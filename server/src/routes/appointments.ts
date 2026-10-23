import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../db.js';
import { authenticateUser, requireTenant, requireRole } from '../middleware/auth.js';
import { BookingEngine, BookingConflictError } from '../services/bookingEngine.js';

const router = Router();

const CreateAppointmentSchema = z.object({
  serviceId: z.string().min(1),
  staffMemberId: z.string().optional(),
  startTime: z.string(),
  customerName: z.string().min(2),
  customerEmail: z.string().email(),
  customerPhone: z.string().optional(),
  notes: z.string().optional(),
  chiefComplaint: z.string().optional(),
  patientType: z.string().optional(),
  insuranceProvider: z.string().optional(),
  specialAccommodations: z.string().optional(),
  dateOfBirth: z.string().optional(),
});

/**
 * GET /api/tenants/:tenantId/appointments
 * List appointments with date, status, and staff filtering.
 */
router.get('/:tenantId/appointments', authenticateUser, requireTenant, async (req: Request, res: Response) => {
  const tenantId = req.tenant!.id;
  const { status, staffMemberId, startDate, endDate, search } = req.query;

  const whereClause: any = { tenantId };

  if (status && typeof status === 'string') {
    whereClause.status = status;
  }

  if (staffMemberId && typeof staffMemberId === 'string') {
    whereClause.staffMemberId = staffMemberId;
  }

  if (startDate || endDate) {
    whereClause.startTime = {};
    if (startDate) whereClause.startTime.gte = new Date(startDate as string);
    if (endDate) whereClause.startTime.lte = new Date(endDate as string);
  }

  if (search && typeof search === 'string') {
    whereClause.customer = {
      OR: [
        { name: { contains: search } },
        { email: { contains: search } },
      ],
    };
  }

  const appointments = await prisma.appointment.findMany({
    where: whereClause,
    orderBy: { startTime: 'desc' },
    include: {
      service: true,
      customer: true,
      staffMember: true,
    },
  });

  return res.json({ appointments });
});

/**
 * POST /api/tenants/:tenantId/appointments
 * Manual appointment booking by front-desk or staff.
 */
router.post('/:tenantId/appointments', authenticateUser, requireTenant, async (req: Request, res: Response) => {
  try {
    const data = CreateAppointmentSchema.parse(req.body);

    const appointment = await BookingEngine.bookAppointment({
      tenantId: req.tenant!.id,
      serviceId: data.serviceId,
      staffMemberId: data.staffMemberId,
      startTime: data.startTime,
      customerName: data.customerName,
      customerEmail: data.customerEmail,
      customerPhone: data.customerPhone,
      notes: data.notes,
      chiefComplaint: data.chiefComplaint,
      patientType: data.patientType,
      insuranceProvider: data.insuranceProvider,
      specialAccommodations: data.specialAccommodations,
      dateOfBirth: data.dateOfBirth,
      bookedVia: 'MANUAL',
    });

    return res.status(201).json({ appointment });
  } catch (err: any) {
    if (err instanceof BookingConflictError) {
      return res.status(409).json({ error: err.message });
    }
    return res.status(400).json({ error: err.message || 'Failed to book appointment' });
  }
});

/**
 * PATCH /api/tenants/:tenantId/appointments/:id/status
 * Update appointment status (CONFIRMED, COMPLETED, NO_SHOW, CANCELLED).
 */
router.patch('/:tenantId/appointments/:id/status', authenticateUser, requireTenant, async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status, reason } = req.body;

  if (!['CONFIRMED', 'PENDING', 'COMPLETED', 'NO_SHOW', 'CANCELLED'].includes(status)) {
    return res.status(400).json({ error: 'Invalid appointment status.' });
  }

  const appointment = await prisma.appointment.findFirst({
    where: { id, tenantId: req.tenant!.id },
  });

  if (!appointment) {
    return res.status(404).json({ error: 'Appointment not found.' });
  }

  const updated = await prisma.appointment.update({
    where: { id },
    data: {
      status,
      cancellationReason: status === 'CANCELLED' ? (reason || 'Cancelled by staff') : null,
    },
    include: {
      service: true,
      customer: true,
      staffMember: true,
    },
  });

  await prisma.auditLog.create({
    data: {
      tenantId: req.tenant!.id,
      userId: req.user!.id,
      action: `APPOINTMENT_STATUS_${status}`,
      resourceType: 'Appointment',
      resourceId: id,
    },
  });

  return res.json({ appointment: updated });
});

/**
 * POST /api/tenants/:tenantId/appointments/:id/reschedule
 */
router.post('/:tenantId/appointments/:id/reschedule', authenticateUser, requireTenant, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { newStartTime } = req.body;

    if (!newStartTime) {
      return res.status(400).json({ error: 'newStartTime is required.' });
    }

    const updated = await BookingEngine.rescheduleAppointment(req.tenant!.id, id, newStartTime);
    return res.json({ appointment: updated });
  } catch (err: any) {
    if (err instanceof BookingConflictError) {
      return res.status(409).json({ error: err.message });
    }
    return res.status(400).json({ error: err.message || 'Failed to reschedule' });
  }
});

/**
 * POST /api/tenants/:tenantId/appointments/:id/cancel
 */
router.post('/:tenantId/appointments/:id/cancel', authenticateUser, requireTenant, async (req: Request, res: Response) => {
  const { id } = req.params;
  const { reason } = req.body;

  const cancelled = await BookingEngine.cancelAppointment(req.tenant!.id, id, reason);
  return res.json({ appointment: cancelled });
});

export default router;
