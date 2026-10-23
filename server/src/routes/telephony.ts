import { Router, Request, Response } from 'express';
import { prisma } from '../db.js';
import { TelephonyService } from '../services/telephonyService.js';
import { authenticateUser, requireTenant, requireRole } from '../middleware/auth.js';

const router = Router();

/**
 * POST /api/telephony/:tenantSlug/call/start
 * Inbound telephone call entrypoint.
 */
router.post('/:tenantSlug/call/start', async (req: Request, res: Response) => {
  try {
    const { tenantSlug } = req.params;
    const { callerPhone, callerName } = req.body;

    const session = await TelephonyService.handleInboundCall({
      tenantSlug,
      callerPhone: callerPhone || '+1 (512) 555-0100',
      callerName: callerName || 'Inbound Caller',
    });

    return res.json(session);
  } catch (err: any) {
    return res.status(400).json({ error: err.message || 'Call failed' });
  }
});

/**
 * POST /api/telephony/:tenantSlug/call/turn
 * Conversational speech turn during phone call.
 */
router.post('/:tenantSlug/call/turn', async (req: Request, res: Response) => {
  try {
    const { tenantSlug } = req.params;
    const { callId, callerPhone, callerName, callerEmail, utterance } = req.body;

    if (!callId || !utterance) {
      return res.status(400).json({ error: 'callId and utterance are required.' });
    }

    const response = await TelephonyService.processCallTurn({
      callId,
      tenantSlug,
      callerPhone: callerPhone || '+1 (512) 555-0100',
      callerName,
      callerEmail,
      utterance,
    });

    return res.json(response);
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Call processing error' });
  }
});

/**
 * POST /api/telephony/:tenantSlug/call/revert-to-chat
 * Send interactive slot-picker link to caller's phone.
 */
router.post('/:tenantSlug/call/revert-to-chat', async (req: Request, res: Response) => {
  try {
    const { tenantSlug } = req.params;
    const { callId, callerPhone, callerName } = req.body;

    const response = await TelephonyService.processCallTurn({
      callId,
      tenantSlug,
      callerPhone: callerPhone || '+1 (512) 555-0100',
      callerName,
      utterance: 'Please send link to my phone',
    });

    return res.json(response);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/telephony/:tenantSlug/call/end
 */
router.post('/:tenantSlug/call/end', async (req: Request, res: Response) => {
  try {
    const { callId, durationSeconds } = req.body;
    await TelephonyService.endCall(callId, Number(durationSeconds) || 30);
    return res.json({ success: true });
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

/**
 * GET /api/tenants/:tenantId/calls
 * List all attended calls for the clinic.
 */
router.get('/:tenantId/calls', authenticateUser, requireTenant, async (req: Request, res: Response) => {
  const tenantId = req.tenant!.id;

  const calls = await prisma.callLog.findMany({
    where: { tenantId },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  return res.json({ calls });
});

/**
 * POST /api/tenants/:tenantId/voice/settings
 * Save custom voice persona, recorded receptionist audio greeting, and call forwarding.
 */
router.post('/:tenantId/voice/settings', authenticateUser, requireTenant, requireRole(['OWNER', 'ADMIN']), async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenant!.id;
    const {
      voiceId,
      customAudioGreetingUrl,
      phoneReceptionistEnabled,
      forwardingPhoneNumber,
      callToChatEnabled,
    } = req.body;

    const updated = await prisma.agentConfiguration.upsert({
      where: { tenantId },
      update: {
        ...(voiceId !== undefined ? { voiceId } : {}),
        ...(customAudioGreetingUrl !== undefined ? { customAudioGreetingUrl } : {}),
        ...(phoneReceptionistEnabled !== undefined ? { phoneReceptionistEnabled } : {}),
        ...(forwardingPhoneNumber !== undefined ? { forwardingPhoneNumber } : {}),
        ...(callToChatEnabled !== undefined ? { callToChatEnabled } : {}),
      },
      create: {
        tenantId,
        voiceId: voiceId || 'sarah-warm',
        customAudioGreetingUrl,
        phoneReceptionistEnabled: phoneReceptionistEnabled !== false,
        forwardingPhoneNumber,
        callToChatEnabled: callToChatEnabled !== false,
      },
    });

    await prisma.auditLog.create({
      data: {
        tenantId,
        userId: req.user!.id,
        action: 'VOICE_SETTINGS_UPDATED',
        resourceType: 'AgentConfiguration',
        details: JSON.stringify({ voiceId, hasCustomAudio: !!customAudioGreetingUrl }),
      },
    });

    return res.json({ success: true, config: updated });
  } catch (err: any) {
    return res.status(400).json({ error: err.message || 'Failed to update voice settings' });
  }
});

/**
 * GET /api/tenants/:tenantId/notifications
 * Real-time log of dispatched SMS and Email confirmations.
 */
router.get('/:tenantId/notifications', authenticateUser, requireTenant, async (req: Request, res: Response) => {
  const tenantId = req.tenant!.id;

  const notifications = await prisma.notificationJob.findMany({
    where: { tenantId },
    orderBy: { createdAt: 'desc' },
    take: 50,
    include: {
      appointment: {
        include: {
          service: true,
          customer: true,
        },
      },
    },
  });

  return res.json({ notifications });
});

export default router;
