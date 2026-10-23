import { prisma } from '../db.js';

export interface Slot {
  startTime: string; // ISO string UTC
  endTime: string;   // ISO string UTC
  displayTime: string; // e.g. "09:00 AM"
  displayEndTime: string; // e.g. "09:30 AM"
  staffMemberId?: string;
  staffName?: string;
}

export interface BookAppointmentInput {
  tenantId: string;
  serviceId: string;
  staffMemberId?: string;
  startTime: string; // ISO String
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  notes?: string;
  bookedVia?: string; // AI_WIDGET, AI_PHONE, DASHBOARD, MANUAL
}

export class BookingConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BookingConflictError';
  }
}

export class BusinessRuleError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BusinessRuleError';
  }
}

export class BookingEngine {
  /**
   * Calculate real available slots for a specific date and service.
   */
  static async getAvailableSlots(
    tenantId: string,
    serviceId: string,
    targetDateStr: string, // "YYYY-MM-DD"
    preferredStaffId?: string
  ): Promise<{ slots: Slot[]; message?: string }> {
    const targetDate = new Date(`${targetDateStr}T00:00:00Z`);
    if (isNaN(targetDate.getTime())) {
      throw new BusinessRuleError('Invalid date format. Expected YYYY-MM-DD.');
    }

    // 1. Fetch Service
    const service = await prisma.service.findFirst({
      where: { id: serviceId, tenantId, isActive: true },
      include: {
        staffAssignments: {
          include: { staffMember: true },
        },
      },
    });

    if (!service) {
      throw new BusinessRuleError('Service not found or inactive.');
    }

    // 2. Fetch Business Hours for the day of week (0 = Sunday, 1 = Monday...)
    const dayOfWeek = targetDate.getUTCDay();
    const businessHour = await prisma.businessHour.findFirst({
      where: { tenantId, dayOfWeek },
    });

    if (!businessHour || businessHour.isClosed) {
      return {
        slots: [],
        message: 'The clinic is closed on this day. Please select another day.',
      };
    }

    // 3. Fetch Booking Policy
    const policy = await prisma.bookingPolicy.findUnique({
      where: { tenantId },
    });

    const minNoticeHours = policy?.minNoticeHours || 2;
    const maxAdvanceDays = policy?.maxAdvanceDays || 60;
    const bufferMinutes = Math.max(service.bufferMinutes, policy?.bufferBetweenSlotsMinutes || 10);

    // Verify booking is not too far in the future
    const now = new Date();
    const maxBookingDate = new Date(now.getTime() + maxAdvanceDays * 24 * 60 * 60 * 1000);
    if (targetDate > maxBookingDate) {
      return {
        slots: [],
        message: `Bookings can only be scheduled up to ${maxAdvanceDays} days in advance.`,
      };
    }

    // 4. Parse open and close times (e.g. "09:00" and "17:00")
    const [openH, openM] = businessHour.openTime.split(':').map(Number);
    const [closeH, closeM] = businessHour.closeTime.split(':').map(Number);

    const dayStart = new Date(Date.UTC(
      targetDate.getUTCFullYear(),
      targetDate.getUTCMonth(),
      targetDate.getUTCDate(),
      openH,
      openM,
      0
    ));

    const dayEnd = new Date(Date.UTC(
      targetDate.getUTCFullYear(),
      targetDate.getUTCMonth(),
      targetDate.getUTCDate(),
      closeH,
      closeM,
      0
    ));

    // 5. Fetch existing active appointments for the day
    const existingAppointments = await prisma.appointment.findMany({
      where: {
        tenantId,
        status: { in: ['CONFIRMED', 'PENDING'] },
        startTime: { gte: dayStart, lt: dayEnd },
      },
    });

    // 6. Generate Candidate Slots
    const totalDuration = service.durationMinutes + bufferMinutes;
    const candidateSlots: Slot[] = [];
    const minBookingTime = new Date(now.getTime() + minNoticeHours * 60 * 60 * 1000);

    let currentCursor = new Date(dayStart);

    while (currentCursor.getTime() + service.durationMinutes * 60 * 1000 <= dayEnd.getTime()) {
      const slotStart = new Date(currentCursor);
      const slotEnd = new Date(slotStart.getTime() + service.durationMinutes * 60 * 1000);
      const slotWithBufferEnd = new Date(slotStart.getTime() + totalDuration * 60 * 1000);

      // Check min advance notice
      if (slotStart > minBookingTime) {
        // Check overlap with existing appointments
        const hasConflict = existingAppointments.some((appt) => {
          // If a preferred staff member is requested, only check their appointments
          if (preferredStaffId && appt.staffMemberId && appt.staffMemberId !== preferredStaffId) {
            return false;
          }
          const apptStart = new Date(appt.startTime);
          const apptEnd = new Date(appt.endTime);
          // Overlap condition
          return slotStart < apptEnd && slotEnd > apptStart;
        });

        if (!hasConflict) {
          candidateSlots.push({
            startTime: slotStart.toISOString(),
            endTime: slotEnd.toISOString(),
            displayTime: formatTime(slotStart),
            displayEndTime: formatTime(slotEnd),
            staffMemberId: preferredStaffId,
          });
        }
      }

      // Step by totalDuration or 30-min increments
      currentCursor = new Date(currentCursor.getTime() + 30 * 60 * 1000);
    }

    return {
      slots: candidateSlots,
      message: candidateSlots.length === 0 ? 'No open slots found for this date. Please try another day.' : undefined,
    };
  }

  /**
   * Book an appointment with concurrency check and double-booking protection.
   */
  static async bookAppointment(input: BookAppointmentInput) {
    const {
      tenantId,
      serviceId,
      staffMemberId,
      startTime: startTimeStr,
      customerName,
      customerEmail,
      customerPhone,
      notes,
      bookedVia = 'AI_WIDGET',
    } = input;

    const startTime = new Date(startTimeStr);
    if (isNaN(startTime.getTime())) {
      throw new BusinessRuleError('Invalid start time provided.');
    }

    // 1. Fetch Service and Tenant
    const service = await prisma.service.findFirst({
      where: { id: serviceId, tenantId, isActive: true },
    });

    if (!service) {
      throw new BusinessRuleError('Service not found or is currently unavailable.');
    }

    const endTime = new Date(startTime.getTime() + service.durationMinutes * 60 * 1000);

    // 2. Strict Concurrency Check / Double-booking prevention
    const existingConflict = await prisma.appointment.findFirst({
      where: {
        tenantId,
        status: { in: ['CONFIRMED', 'PENDING'] },
        ...(staffMemberId ? { staffMemberId } : {}),
        AND: [
          { startTime: { lt: endTime } },
          { endTime: { gt: startTime } },
        ],
      },
    });

    if (existingConflict) {
      throw new BookingConflictError(
        'The requested appointment slot is no longer available. Please select another time.'
      );
    }

    // 3. Upsert Customer
    const normalizedEmail = customerEmail.trim().toLowerCase();
    const customer = await prisma.customer.upsert({
      where: {
        tenantId_email: {
          tenantId,
          email: normalizedEmail,
        },
      },
      update: {
        name: customerName,
        phone: customerPhone || undefined,
        totalAppointments: { increment: 1 },
      },
      create: {
        tenantId,
        name: customerName,
        email: normalizedEmail,
        phone: customerPhone,
        totalAppointments: 1,
      },
    });

    // 4. Create the Appointment
    const appointment = await prisma.appointment.create({
      data: {
        tenantId,
        customerId: customer.id,
        serviceId: service.id,
        staffMemberId: staffMemberId || null,
        startTime,
        endTime,
        status: 'CONFIRMED',
        notes: notes || null,
        bookedVia,
      },
      include: {
        service: true,
        customer: true,
        staffMember: true,
      },
    });

    // 5. Schedule Confirmation Notification Job
    await prisma.notificationJob.create({
      data: {
        tenantId,
        appointmentId: appointment.id,
        type: 'EMAIL_CONFIRMATION',
        recipient: normalizedEmail,
        status: 'SENT', // Simulated sent in MVP
        sentAt: new Date(),
        payload: JSON.stringify({
          appointmentId: appointment.id,
          customerName,
          serviceName: service.name,
          startTime: appointment.startTime.toISOString(),
          duration: service.durationMinutes,
        }),
      },
    });

    // 6. Record Audit Log
    await prisma.auditLog.create({
      data: {
        tenantId,
        action: 'APPOINTMENT_BOOKED',
        resourceType: 'Appointment',
        resourceId: appointment.id,
        details: JSON.stringify({
          bookedVia,
          serviceName: service.name,
          startTime: appointment.startTime.toISOString(),
          customerEmail: normalizedEmail,
        }),
      },
    });

    return appointment;
  }

  /**
   * Reschedule an existing appointment.
   */
  static async rescheduleAppointment(
    tenantId: string,
    appointmentId: string,
    newStartTimeStr: string
  ) {
    const appointment = await prisma.appointment.findFirst({
      where: { id: appointmentId, tenantId },
      include: { service: true },
    });

    if (!appointment) {
      throw new BusinessRuleError('Appointment not found.');
    }

    const newStartTime = new Date(newStartTimeStr);
    const newEndTime = new Date(newStartTime.getTime() + appointment.service.durationMinutes * 60 * 1000);

    // Check conflict
    const conflict = await prisma.appointment.findFirst({
      where: {
        tenantId,
        id: { not: appointmentId },
        status: { in: ['CONFIRMED', 'PENDING'] },
        AND: [
          { startTime: { lt: newEndTime } },
          { endTime: { gt: newStartTime } },
        ],
      },
    });

    if (conflict) {
      throw new BookingConflictError('The new selected time slot is already booked.');
    }

    const updated = await prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        startTime: newStartTime,
        endTime: newEndTime,
        status: 'CONFIRMED',
      },
      include: {
        service: true,
        customer: true,
      },
    });

    await prisma.auditLog.create({
      data: {
        tenantId,
        action: 'APPOINTMENT_RESCHEDULED',
        resourceType: 'Appointment',
        resourceId: appointmentId,
        details: JSON.stringify({
          previousStartTime: appointment.startTime.toISOString(),
          newStartTime: updated.startTime.toISOString(),
        }),
      },
    });

    return updated;
  }

  /**
   * Cancel an appointment.
   */
  static async cancelAppointment(
    tenantId: string,
    appointmentId: string,
    reason?: string
  ) {
    const appointment = await prisma.appointment.findFirst({
      where: { id: appointmentId, tenantId },
    });

    if (!appointment) {
      throw new BusinessRuleError('Appointment not found.');
    }

    const updated = await prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        status: 'CANCELLED',
        cancellationReason: reason || 'Customer requested cancellation',
      },
    });

    await prisma.auditLog.create({
      data: {
        tenantId,
        action: 'APPOINTMENT_CANCELLED',
        resourceType: 'Appointment',
        resourceId: appointmentId,
        details: JSON.stringify({ reason }),
      },
    });

    return updated;
  }
}

function formatTime(date: Date): string {
  const hours = date.getUTCHours();
  const minutes = date.getUTCMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  const displayMinutes = minutes < 10 ? `0${minutes}` : minutes;
  return `${displayHours}:${displayMinutes} ${ampm}`;
}
