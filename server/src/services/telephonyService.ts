import { prisma } from '../db.js';
import { BookingEngine, BookingConflictError } from './bookingEngine.js';
import { config } from '../config.js';

export interface InboundCallInput {
  tenantSlug: string;
  callerPhone: string;
  callerName?: string;
}

export interface CallUtteranceInput {
  callId: string;
  tenantSlug: string;
  callerPhone: string;
  callerName?: string;
  callerEmail?: string;
  utterance: string;
}

export class TelephonyService {
  /**
   * Start an inbound call session and greet caller.
   */
  static async handleInboundCall(input: InboundCallInput) {
    const { tenantSlug, callerPhone, callerName } = input;

    const tenant = await prisma.tenant.findUnique({
      where: { slug: tenantSlug },
      include: {
        agentConfiguration: true,
        businessProfile: true,
        services: { where: { isActive: true } },
      },
    });

    if (!tenant) {
      throw new Error(`Practice not found with slug: ${tenantSlug}`);
    }

    const agent = tenant.agentConfiguration;
    const agentName = agent?.agentName || 'Sarah';
    const clinicName = tenant.name;

    // Build natural spoken greeting
    const greetingText = agent?.customAudioGreetingUrl
      ? `Welcome to ${clinicName}. Please hold while our virtual receptionist answers.`
      : `Thank you for calling ${clinicName}! My name is ${agentName}, your AI receptionist. I can help you check doctor availability, answer questions about our services, or schedule an appointment. How may I help you today?`;

    // Create call log
    const callLog = await prisma.callLog.create({
      data: {
        tenantId: tenant.id,
        callerPhone,
        callerName: callerName || 'Phone Caller',
        status: 'IN_PROGRESS',
        durationSeconds: 0,
        transcript: JSON.stringify([
          { role: 'assistant', text: greetingText, timestamp: new Date().toISOString() },
        ]),
        audioRecordingUrl: agent?.customAudioGreetingUrl || null,
      },
    });

    return {
      callId: callLog.id,
      agentName,
      clinicName,
      greetingText,
      hasCustomAudio: !!agent?.customAudioGreetingUrl,
      customAudioUrl: agent?.customAudioGreetingUrl || null,
      voiceId: agent?.voiceId || 'sarah-warm',
      availableServices: tenant.services.map((s) => ({ id: s.id, name: s.name, price: s.price, duration: s.durationMinutes })),
    };
  }

  /**
   * Process spoken utterance from caller during an active call.
   */
  static async processCallTurn(input: CallUtteranceInput) {
    const { callId, tenantSlug, callerPhone, callerName, callerEmail, utterance } = input;

    const tenant = await prisma.tenant.findUnique({
      where: { slug: tenantSlug },
      include: {
        agentConfiguration: true,
        businessProfile: true,
        services: { where: { isActive: true } },
        knowledgeDocuments: { where: { isActive: true } },
      },
    });

    if (!tenant) {
      throw new Error('Tenant not found');
    }

    const lower = utterance.toLowerCase();
    let spokenReply = '';
    let toolExecuted: any = null;
    let appointmentBooked: any = null;
    let smsLinkSent = false;
    let shouldOfferCallToChat = false;

    // Check emergency dental triage
    if (
      lower.includes('throat swelling') ||
      lower.includes('difficulty breathing') ||
      lower.includes('severe trauma') ||
      lower.includes('bleeding won\'t stop')
    ) {
      const emergencyNum = tenant.agentConfiguration?.emergencyEscalationNumber || tenant.businessProfile?.phone || '911';
      spokenReply = `What you are describing sounds like a critical dental emergency. Please hang up and call our emergency line at ${emergencyNum} immediately, or head to the nearest emergency room.`;
      
      await this.appendTranscript(callId, utterance, spokenReply);
      await prisma.callLog.update({
        where: { id: callId },
        data: { status: 'TRANSFERRED' },
      });

      return {
        replyText: spokenReply,
        isEmergency: true,
        action: 'EMERGENCY_TRANSFER',
      };
    }

    // Intent 1: Call-to-Chat Revert (explicit or prompted)
    if (
      lower.includes('send link') ||
      lower.includes('text me') ||
      lower.includes('send to my phone') ||
      lower.includes('send chat') ||
      lower.includes('send booking link')
    ) {
      const chatLink = `${config.clientUrl}/book-chat/${tenantSlug}?phone=${encodeURIComponent(callerPhone)}&name=${encodeURIComponent(callerName || '')}`;

      await prisma.notificationJob.create({
        data: {
          tenantId: tenant.id,
          type: 'SMS_CONFIRMATION',
          recipient: callerPhone,
          status: 'SENT',
          sentAt: new Date(),
          payload: JSON.stringify({
            smsText: `[${tenant.name}] Tap this link to view available appointment chairs and pick your time: ${chatLink}`,
          }),
        },
      });

      smsLinkSent = true;
      spokenReply = `I have just sent a secure booking link directly to your mobile phone at ${callerPhone}. You can tap it right now to see all open appointment times on your screen and select your preferred slot.`;

      await this.appendTranscript(callId, utterance, spokenReply);
      await prisma.callLog.update({
        where: { id: callId },
        data: { smsChatLinkSent: true },
      });

      return {
        replyText: spokenReply,
        smsLinkSent: true,
        chatLink,
      };
    }

    // Intent 2: Inquire about services or prices
    if (
      lower.includes('how much') ||
      lower.includes('price') ||
      lower.includes('cost') ||
      lower.includes('services') ||
      lower.includes('whitening') ||
      lower.includes('cleaning') ||
      lower.includes('exam')
    ) {
      const matchedService = tenant.services.find((s) => lower.includes(s.name.toLowerCase()));
      if (matchedService) {
        spokenReply = `Our ${matchedService.name} is ${matchedService.durationMinutes} minutes and the cost is $${matchedService.price}. We have appointments available this week. Would you like me to check open times, or text a link to your phone so you can choose a slot?`;
      } else {
        const sampleServices = tenant.services.slice(0, 3).map((s) => `${s.name} for $${s.price}`).join(', and ');
        spokenReply = `At ${tenant.name}, we provide comprehensive dental services including ${sampleServices}. Would you like to check available appointment openings?`;
      }
      shouldOfferCallToChat = true;
    }

    // Intent 3: Availability & Slot Query
    else if (
      lower.includes('available') ||
      lower.includes('open') ||
      lower.includes('slots') ||
      lower.includes('tomorrow') ||
      lower.includes('next week') ||
      lower.includes('when can i come') ||
      lower.includes('schedule') ||
      lower.includes('appointment')
    ) {
      const targetService = tenant.services[0];
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const targetDateStr = tomorrow.toISOString().split('T')[0];

      if (targetService) {
        const avail = await BookingEngine.getAvailableSlots(tenant.id, targetService.id, targetDateStr);
        if (avail.slots.length > 0) {
          const sampleSlots = avail.slots.slice(0, 3).map((s) => s.displayTime).join(', ');
          spokenReply = `For ${targetService.name}, we have openings tomorrow at ${sampleSlots}. I can reserve one of these right now, or text an interactive slot-picker directly to your mobile phone. Which would you prefer?`;
          toolExecuted = { tool: 'check_availability', date: targetDateStr, slots: avail.slots.slice(0, 3) };
          shouldOfferCallToChat = true;
        } else {
          spokenReply = `We don't have openings tomorrow, but we have availability the following day. Would you like me to text our schedule link to your phone so you can pick a time?`;
        }
      }
    }

    // Intent 4: Confirm Booking Over Phone
    else if (
      lower.includes('confirm') ||
      lower.includes('book it') ||
      lower.includes('reserve that') ||
      lower.includes('9:00 am') ||
      lower.includes('10:00 am') ||
      lower.includes('11:00 am') ||
      lower.includes('2:00 pm')
    ) {
      const targetService = tenant.services[0];
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setUTCHours(14, 0, 0, 0); // 9:00 AM Central

      const email = callerEmail || 'caller@example.com';
      const name = callerName || 'Valued Patient';

      try {
        const booking = await BookingEngine.bookAppointment({
          tenantId: tenant.id,
          serviceId: targetService.id,
          startTime: tomorrow.toISOString(),
          customerName: name,
          customerEmail: email,
          customerPhone: callerPhone,
          bookedVia: 'AI_PHONE',
          notes: 'Booked via AI Phone Receptionist',
        });

        appointmentBooked = booking;
        spokenReply = `Fantastic! Your appointment for ${targetService.name} is confirmed for tomorrow at 9:00 AM. I have just dispatched an SMS confirmation to ${callerPhone} and a detailed calendar receipt to your email. We look forward to seeing you at ${tenant.name}!`;

        await prisma.callLog.update({
          where: { id: callId },
          data: { status: 'BOOKED', appointmentId: booking.id },
        });
      } catch (err: any) {
        spokenReply = `I tried to lock in that slot, but it was just reserved. Let me text an interactive slot link to your phone right now so you can pick an alternate opening.`;
      }
    }

    // Fallback: General Assistant
    else {
      spokenReply = `I can certainly help you with that! At ${tenant.name}, our virtual receptionist can book routine cleanings, emergency checkups, and answer insurance questions. Would you like me to check open slots for you?`;
    }

    await this.appendTranscript(callId, utterance, spokenReply);

    return {
      replyText: spokenReply,
      toolExecuted,
      appointmentBooked,
      shouldOfferCallToChat,
      smsLinkSent,
    };
  }

  /**
   * End call session and record total duration.
   */
  static async endCall(callId: string, durationSeconds: number) {
    return await prisma.callLog.update({
      where: { id: callId },
      data: {
        durationSeconds,
        status: 'COMPLETED',
      },
    });
  }

  private static async appendTranscript(callId: string, userUtterance: string, assistantReply: string) {
    const existing = await prisma.callLog.findUnique({
      where: { id: callId },
      select: { transcript: true },
    });

    const turns = existing?.transcript ? JSON.parse(existing.transcript) : [];
    turns.push({ role: 'caller', text: userUtterance, timestamp: new Date().toISOString() });
    turns.push({ role: 'receptionist', text: assistantReply, timestamp: new Date().toISOString() });

    await prisma.callLog.update({
      where: { id: callId },
      data: { transcript: JSON.stringify(turns) },
    });
  }
}
