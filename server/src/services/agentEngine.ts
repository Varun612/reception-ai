import { prisma } from '../db.js';
import { BookingEngine } from './bookingEngine.js';
import { config } from '../config.js';

// Dental safety keywords that trigger mandatory triage advice
const URGENT_DENTAL_SYMPTOMS = [
  'swelling in my neck',
  'throat swelling',
  'difficulty breathing',
  'difficulty swallowing',
  'bleeding won\'t stop',
  'uncontrolled bleeding',
  'knocked out tooth',
  'tooth knocked out',
  'severe trauma',
  'high fever and swelling',
];

const MEDICAL_DIAGNOSIS_KEYWORDS = [
  'do i have a cavity',
  'is this an infection',
  'can you prescribe',
  'what antibiotic',
  'what painkiller should i take',
  'can you diagnose',
  'do i need a root canal',
];

export interface AgentChatInput {
  tenantId: string;
  conversationId?: string;
  message: string;
  customerEmail?: string;
  customerName?: string;
  channel?: string; // WEB_WIDGET, DASHBOARD_SANDBOX, PHONE
}

export interface AgentChatResponse {
  conversationId: string;
  reply: string;
  toolCallsExecuted: {
    tool: string;
    params: any;
    result: any;
  }[];
  escalated: boolean;
  appointmentBooked?: any;
}

export class AgentEngine {
  /**
   * Main entrypoint for processing incoming customer messages.
   */
  static async processMessage(input: AgentChatInput): Promise<AgentChatResponse> {
    const { tenantId, message, channel = 'WEB_WIDGET' } = input;

    // 1. Fetch Tenant, Agent Configuration, Profile, Knowledge Docs, and Services
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      include: {
        agentConfiguration: true,
        businessProfile: true,
        knowledgeDocuments: { where: { isActive: true } },
        services: { where: { isActive: true } },
        businessHours: true,
        bookingPolicy: true,
      },
    });

    if (!tenant) {
      throw new Error(`Tenant ${tenantId} not found.`);
    }

    const agentConfig = tenant.agentConfiguration || {
      agentName: 'Sarah',
      tone: 'PROFESSIONAL',
      greetingMessage: 'Hello! How may I assist you today?',
      customInstructions: '',
      emergencyEscalationNumber: '911 / (555) 019-2831',
      humanHandoffEmail: 'reception@example.com',
      allowPriceQuoting: true,
      isEnabled: true,
    };

    // 2. Locate or create Conversation record
    let conversation;
    if (input.conversationId) {
      conversation = await prisma.conversation.findFirst({
        where: { id: input.conversationId, tenantId },
      });
    }

    if (!conversation) {
      // Create conversation
      conversation = await prisma.conversation.create({
        data: {
          tenantId,
          channel,
          status: 'ACTIVE',
        },
      });
    }

    // Save user message to database
    await prisma.message.create({
      data: {
        conversationId: conversation.id,
        role: 'USER',
        content: message,
      },
    });

    // 3. Safety Guardrails Check (Dental & Urgent Medical)
    const lowerMsg = message.toLowerCase();

    // Check for urgent symptoms
    const isUrgent = URGENT_DENTAL_SYMPTOMS.some((symptom) => lowerMsg.includes(symptom));
    if (isUrgent) {
      const emergencyPhone = agentConfig.emergencyEscalationNumber || tenant.businessProfile?.phone || 'emergency services (911)';
      const urgentReply = `⚠️ IMPORTANT: What you are describing may require urgent clinical evaluation. Please do not wait for an online appointment. Call our emergency hotline at ${emergencyPhone} immediately or proceed to the nearest emergency medical facility.`;

      await prisma.conversation.update({
        where: { id: conversation.id },
        data: { status: 'ESCALATED', escalationReason: 'Urgent medical/dental safety symptom flagged' },
      });

      await prisma.message.create({
        data: {
          conversationId: conversation.id,
          role: 'ASSISTANT',
          content: urgentReply,
        },
      });

      return {
        conversationId: conversation.id,
        reply: urgentReply,
        toolCallsExecuted: [{
          tool: 'request_human_handoff',
          params: { reason: 'Urgent dental safety symptom' },
          result: { escalated: true },
        }],
        escalated: true,
      };
    }

    // Check for diagnostic or medication advice requests
    const isDiagnosisRequest = MEDICAL_DIAGNOSIS_KEYWORDS.some((diag) => lowerMsg.includes(diag));
    if (isDiagnosisRequest) {
      const safetyReply = `As an AI receptionist, I cannot provide medical or dental diagnoses, nor can I prescribe medications. I would be delighted to schedule a comprehensive examination with one of our licensed dental providers who can thoroughly evaluate your symptoms. Would you like to check available appointments?`;

      await prisma.message.create({
        data: {
          conversationId: conversation.id,
          role: 'ASSISTANT',
          content: safetyReply,
        },
      });

      return {
        conversationId: conversation.id,
        reply: safetyReply,
        toolCallsExecuted: [],
        escalated: false,
      };
    }

    // 4. Try Google Gemini API if GEMINI_API_KEY is configured
    if (config.geminiApiKey) {
      try {
        const geminiResult = await this.executeGeminiWithTools({
          tenant,
          agentConfig,
          conversation,
          userMessage: message,
          customerEmail: input.customerEmail,
          customerName: input.customerName,
        });
        if (geminiResult) {
          return geminiResult;
        }
      } catch (err: any) {
        console.warn('[GEMINI ERROR, FALLING BACK TO LOCAL ENGINE]', err.message || err);
      }
    }

    // 5. Intelligent Local Semantic Engine & Tool Execution
    return await this.executeSemanticToolPipeline({
      tenant,
      agentConfig,
      conversation,
      userMessage: message,
      customerEmail: input.customerEmail,
      customerName: input.customerName,
    });
  }

  /**
   * Local Semantic Tool Pipeline: parses intent, executes real database tools,
   * enforces tenant isolation, and composes natural language response.
   */
  private static async executeSemanticToolPipeline(params: {
    tenant: any;
    agentConfig: any;
    conversation: any;
    userMessage: string;
    customerEmail?: string;
    customerName?: string;
  }): Promise<AgentChatResponse> {
    const { tenant, agentConfig, conversation, userMessage, customerEmail, customerName } = params;
    const lower = userMessage.toLowerCase();
    const toolCallsExecuted: any[] = [];
    let reply = '';
    let appointmentBooked: any = null;
    let escalated = false;

    // Intent 1: Request Human Handoff / Talk to Human
    if (
      lower.includes('talk to human') ||
      lower.includes('speak with someone') ||
      lower.includes('human agent') ||
      lower.includes('receptionist phone') ||
      lower.includes('speak to a person')
    ) {
      const handoffResult = await this.tools.request_human_handoff(tenant.id, {
        conversationId: conversation.id,
        reason: 'Customer explicitly requested human assistance',
      });
      toolCallsExecuted.push({
        tool: 'request_human_handoff',
        params: { conversationId: conversation.id },
        result: handoffResult,
      });
      escalated = true;
      reply = `I have flagged your request for our team. A staff member will follow up with you at ${agentConfig.humanHandoffEmail || 'our front desk'}. You can also call us directly at ${tenant.businessProfile?.phone || '(555) 019-2831'}. Is there anything else I can assist you with in the meantime?`;
    }

    // Intent 2: Service Inquiry & Pricing
    else if (
      lower.includes('price') ||
      lower.includes('cost') ||
      lower.includes('how much') ||
      lower.includes('services') ||
      lower.includes('what do you offer') ||
      lower.includes('teeth cleaning') ||
      lower.includes('whitening') ||
      lower.includes('consultation') ||
      lower.includes('checkup')
    ) {
      const searchResult = await this.tools.search_services(tenant.id, { query: lower });
      toolCallsExecuted.push({
        tool: 'search_services',
        params: { query: lower },
        result: searchResult,
      });

      if (searchResult.services.length > 0) {
        const serviceList = searchResult.services
          .map((s: any) => `• **${s.name}**: ${s.description || 'Professional dental care'} (${s.durationMinutes} min${agentConfig.allowPriceQuoting && s.displayPrice ? ` - $${s.price}` : ''})`)
          .join('\n');

        reply = `Here are the services we provide at ${tenant.name}:\n\n${serviceList}\n\nWould you like me to check available appointment times for any of these?`;
      } else {
        reply = `At ${tenant.name}, we offer a wide range of dental care including comprehensive consultations, routine checkups, cleanings, and cosmetic procedures. Would you like to check available appointment dates?`;
      }
    }

    // Intent 3: Hours, Location & Clinic Information
    else if (
      lower.includes('hours') ||
      lower.includes('open') ||
      lower.includes('address') ||
      lower.includes('location') ||
      lower.includes('where are you') ||
      lower.includes('parking') ||
      lower.includes('insurance')
    ) {
      const infoResult = await this.tools.get_business_information(tenant.id);
      toolCallsExecuted.push({
        tool: 'get_business_information',
        params: {},
        result: infoResult,
      });

      if (lower.includes('hours') || lower.includes('open')) {
        const hoursList = infoResult.hours
          .map((h: any) => `• ${getDayName(h.dayOfWeek)}: ${h.isClosed ? 'Closed' : `${h.openTime} - ${h.closeTime}`}`)
          .join('\n');
        reply = `${tenant.name} operating hours:\n\n${hoursList}\n\nWould you like to book an appointment during these hours?`;
      } else if (lower.includes('insurance')) {
        const insuranceDoc = tenant.knowledgeDocuments.find((d: any) => d.category === 'INSURANCE');
        reply = insuranceDoc
          ? insuranceDoc.content
          : `We accept most major PPO dental insurances and offer flexible self-pay options. Our team will verify your benefits upon arrival. Would you like to schedule a visit?`;
      } else {
        const profile = infoResult.profile;
        reply = `${tenant.name} is located at ${profile.address || '100 Medical Center Parkway'}, ${profile.city || 'Austin'}, ${profile.state || 'TX'}. You can reach our front desk at ${profile.phone || '(555) 019-2831'}. How else can I assist you?`;
      }
    }

    // Intent 4: Check Availability
    else if (
      lower.includes('availability') ||
      lower.includes('available') ||
      lower.includes('open slots') ||
      lower.includes('when can i come') ||
      lower.includes('next week') ||
      lower.includes('tomorrow') ||
      lower.includes('monday') ||
      lower.includes('tuesday') ||
      lower.includes('wednesday') ||
      lower.includes('thursday') ||
      lower.includes('friday')
    ) {
      // Pick first active service (or match service from query)
      const matchedService = tenant.services.find((s: any) => lower.includes(s.name.toLowerCase())) || tenant.services[0];
      const targetDate = extractDateFromText(lower);

      if (matchedService) {
        const availabilityResult = await this.tools.check_availability(tenant.id, {
          serviceId: matchedService.id,
          date: targetDate,
        });

        toolCallsExecuted.push({
          tool: 'check_availability',
          params: { serviceId: matchedService.id, date: targetDate },
          result: availabilityResult,
        });

        if (availabilityResult.slots.length > 0) {
          const sampleSlots = availabilityResult.slots.slice(0, 4);
          const slotsFormatted = sampleSlots.map((s: any) => `• **${s.displayTime}**`).join('\n');
          reply = `Here are available times for **${matchedService.name}** on ${targetDate}:\n\n${slotsFormatted}\n\nTo confirm one of these slots, simply let me know your preferred time, your full name, and your email address!`;
        } else {
          reply = `We do not have open slots for **${matchedService.name}** on ${targetDate}. Our earliest opening is on the next business day. Would you like to see times for another day?`;
        }
      } else {
        reply = `We'd love to have you! Which service are you interested in booking (e.g., Routine Cleaning, Dental Consultation, or Teeth Whitening)?`;
      }
    }

    // Intent 5: Direct Booking Execution (e.g. "Book me for 10:00 AM on 2026-10-24, John Doe, john@example.com")
    else if (
      lower.includes('book') ||
      lower.includes('schedule') ||
      lower.includes('reserve') ||
      lower.includes('confirm appointment')
    ) {
      const email = customerEmail || extractEmail(userMessage);
      const name = customerName || extractName(userMessage) || 'Patient';
      const matchedService = tenant.services.find((s: any) => lower.includes(s.name.toLowerCase())) || tenant.services[0];
      const targetDate = extractDateFromText(lower);

      if (email && matchedService) {
        // Find an open slot for that date
        const avail = await this.tools.check_availability(tenant.id, {
          serviceId: matchedService.id,
          date: targetDate,
        });

        if (avail.slots.length > 0) {
          const chosenSlot = avail.slots[0];
          try {
            const bookingResult = await this.tools.create_appointment(tenant.id, {
              serviceId: matchedService.id,
              startTime: chosenSlot.startTime,
              customerName: name,
              customerEmail: email,
              customerPhone: extractPhone(userMessage) || '555-0100',
              notes: 'Booked via AI Receptionist',
            });

            toolCallsExecuted.push({
              tool: 'create_appointment',
              params: { serviceId: matchedService.id, startTime: chosenSlot.startTime, customerEmail: email },
              result: bookingResult,
            });

            appointmentBooked = bookingResult.appointment;

            reply = `🎉 **Appointment Confirmed!**\n\n• **Patient**: ${name}\n• **Service**: ${matchedService.name}\n• **Time**: ${chosenSlot.displayTime} (${targetDate})\n• **Location**: ${tenant.name}, ${tenant.businessProfile?.address || 'Austin, TX'}\n\nA confirmation email has been dispatched to **${email}**. Please arrive 10 minutes early. If you need to reschedule, just let me know at least 24 hours in advance!`;
          } catch (bookingErr: any) {
            reply = `I tried to reserve that slot for you, but: ${bookingErr.message}. Would you like me to check alternative available times?`;
          }
        } else {
          reply = `I checked our calendar, but unfortunately all slots for **${matchedService.name}** on ${targetDate} are currently taken. Would you like to check the following day?`;
        }
      } else {
        reply = `I would be happy to book that for you! Could you please provide your **full name** and **email address** so I can secure your appointment confirmation?`;
      }
    }

    // Default Greeting / Conversational Fallback
    else {
      reply = `Hello! I'm ${agentConfig.agentName}, virtual receptionist for **${tenant.name}**. I can help you explore our dental services, check real-time doctor availability, and book or reschedule your appointments. What can I do for you today?`;
    }

    // Save assistant message to database
    await prisma.message.create({
      data: {
        conversationId: conversation.id,
        role: 'ASSISTANT',
        content: reply,
        toolCalls: toolCallsExecuted.length > 0 ? JSON.stringify(toolCallsExecuted) : null,
      },
    });

    return {
      conversationId: conversation.id,
      reply,
      toolCallsExecuted,
      escalated,
      appointmentBooked,
    };
  }

  /**
   * Integration with Google Gemini API using @google/genai SDK when key is present.
   */
  private static async executeGeminiWithTools(params: {
    tenant: any;
    agentConfig: any;
    conversation: any;
    userMessage: string;
    customerEmail?: string;
    customerName?: string;
  }): Promise<AgentChatResponse | null> {
    const { GoogleGenAI } = await import('@google/genai');
    const ai = new GoogleGenAI({});

    const systemPrompt = `You are ${params.agentConfig.agentName}, the professional AI receptionist for ${params.tenant.name}.
Clinic Industry: ${params.tenant.businessProfile?.industry || 'Dental'}.
Clinic Address: ${params.tenant.businessProfile?.address || 'Austin, TX'}, Phone: ${params.tenant.businessProfile?.phone || '(555) 019-2831'}.
Tone: ${params.agentConfig.tone}.

CRITICAL DENTAL SAFETY RULES:
1. NEVER diagnose dental conditions or recommend specific prescription medications (e.g. antibiotics).
2. If patient describes severe swelling, breathing difficulty, or uncontrolled bleeding, immediately direct them to emergency services or clinic hotline.
3. Use the provided tools (check_availability, search_services, create_appointment) to provide truthful, real-time booking details. Never invent times or fake bookings.`;

    // Tool declarations for Gemini
    const toolsConfig = [{
      functionDeclarations: [
        {
          name: 'get_business_information',
          description: 'Get clinic business information, location, operating hours, and contact details.',
          parameters: { type: 'OBJECT', properties: {} },
        },
        {
          name: 'search_services',
          description: 'Search clinic approved services, pricing, and appointment durations.',
          parameters: {
            type: 'OBJECT',
            properties: {
              query: { type: 'STRING', description: 'Search term like cleaning, whitening, or consult' },
            },
          },
        },
        {
          name: 'check_availability',
          description: 'Check available appointment slots for a specific service and date (YYYY-MM-DD).',
          parameters: {
            type: 'OBJECT',
            properties: {
              serviceId: { type: 'STRING', description: 'The unique ID of the service' },
              date: { type: 'STRING', description: 'Date in YYYY-MM-DD format' },
            },
            required: ['serviceId', 'date'],
          },
        },
        {
          name: 'create_appointment',
          description: 'Book a confirmed appointment for a patient.',
          parameters: {
            type: 'OBJECT',
            properties: {
              serviceId: { type: 'STRING' },
              startTime: { type: 'STRING', description: 'ISO date time string UTC' },
              customerName: { type: 'STRING' },
              customerEmail: { type: 'STRING' },
              customerPhone: { type: 'STRING' },
            },
            required: ['serviceId', 'startTime', 'customerName', 'customerEmail'],
          },
        },
      ],
    }];

    // Note: If calling Gemini fails or times out, it throws and caller falls back smoothly to local engine
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        { role: 'user', parts: [{ text: `${systemPrompt}\n\nPatient message: "${params.userMessage}"` }] },
      ],
      // tools: toolsConfig as any,
    });

    const candidate = response.candidates?.[0];
    const text = candidate?.content?.parts?.[0]?.text;

    if (text) {
      await prisma.message.create({
        data: {
          conversationId: params.conversation.id,
          role: 'ASSISTANT',
          content: text,
        },
      });

      return {
        conversationId: params.conversation.id,
        reply: text,
        toolCallsExecuted: [],
        escalated: false,
      };
    }

    return null;
  }

  /**
   * Tool Implementations strictly bound to tenant isolation.
   */
  static tools = {
    async get_business_information(tenantId: string) {
      const tenant = await prisma.tenant.findUnique({
        where: { id: tenantId },
        include: {
          businessProfile: true,
          businessHours: { orderBy: { dayOfWeek: 'asc' } },
          bookingPolicy: true,
        },
      });
      return {
        name: tenant?.name,
        profile: tenant?.businessProfile,
        hours: tenant?.businessHours,
        policy: tenant?.bookingPolicy,
      };
    },

    async search_services(tenantId: string, params: { query?: string }) {
      let filter: any = { tenantId, isActive: true };

      if (params.query) {
        const queryLower = params.query.toLowerCase();
        // Check for specific service keywords
        const keywords = ['whitening', 'cleaning', 'exam', 'consult', 'filling', 'restoration', 'emergency'];
        const matchedKeyword = keywords.find((kw) => queryLower.includes(kw));

        if (matchedKeyword) {
          filter.OR = [
            { name: { contains: matchedKeyword } },
            { description: { contains: matchedKeyword } },
            { category: { contains: matchedKeyword } },
          ];
        }
        // If it's a general service or price inquiry, returning all active services is preferred!
      }

      const services = await prisma.service.findMany({
        where: filter,
        orderBy: { price: 'asc' },
      });
      return { services };
    },

    async check_availability(tenantId: string, params: { serviceId: string; date: string; staffMemberId?: string }) {
      return await BookingEngine.getAvailableSlots(tenantId, params.serviceId, params.date, params.staffMemberId);
    },

    async create_appointment(tenantId: string, params: {
      serviceId: string;
      startTime: string;
      customerName: string;
      customerEmail: string;
      customerPhone?: string;
      notes?: string;
    }) {
      const appointment = await BookingEngine.bookAppointment({
        tenantId,
        serviceId: params.serviceId,
        startTime: params.startTime,
        customerName: params.customerName,
        customerEmail: params.customerEmail,
        customerPhone: params.customerPhone,
        notes: params.notes,
        bookedVia: 'AI_WIDGET',
      });
      return { success: true, appointment };
    },

    async reschedule_appointment(tenantId: string, params: { appointmentId: string; newStartTime: string }) {
      const updated = await BookingEngine.rescheduleAppointment(tenantId, params.appointmentId, params.newStartTime);
      return { success: true, appointment: updated };
    },

    async cancel_appointment(tenantId: string, params: { appointmentId: string; reason?: string }) {
      const cancelled = await BookingEngine.cancelAppointment(tenantId, params.appointmentId, params.reason);
      return { success: true, appointment: cancelled };
    },

    async request_human_handoff(tenantId: string, params: { conversationId: string; reason: string }) {
      await prisma.conversation.update({
        where: { id: params.conversationId },
        data: {
          status: 'ESCALATED',
          escalationReason: params.reason,
        },
      });
      return { escalated: true };
    },
  };
}

// Helpers
function getDayName(day: number): string {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[day] || 'Unknown';
}

function extractDateFromText(text: string): string {
  const match = text.match(/\b(202\d-\d{2}-\d{2})\b/);
  if (match) return match[1];

  // Default to tomorrow in UTC
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return tomorrow.toISOString().split('T')[0];
}

function extractEmail(text: string): string | null {
  const match = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  return match ? match[0] : null;
}

function extractPhone(text: string): string | null {
  const match = text.match(/\b(\+?1[-.\s]?)?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}\b/);
  return match ? match[0] : null;
}

function extractName(text: string): string | null {
  const match = text.match(/my name is ([a-zA-Z\s]+)/i) || text.match(/i am ([a-zA-Z\s]+)/i);
  return match ? match[1].trim() : null;
}
