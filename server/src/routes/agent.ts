import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../db.js';
import { authenticateUser, requireTenant, requireRole } from '../middleware/auth.js';
import { AgentEngine } from '../services/agentEngine.js';

const router = Router();

/**
 * GET /api/tenants/:tenantId/agent
 */
router.get('/:tenantId/agent', authenticateUser, requireTenant, async (req: Request, res: Response) => {
  const tenantId = req.tenant!.id;

  const [agentConfig, knowledgeDocs] = await Promise.all([
    prisma.agentConfiguration.findUnique({
      where: { tenantId },
    }),
    prisma.knowledgeDocument.findMany({
      where: { tenantId, isActive: true },
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  return res.json({
    config: agentConfig,
    knowledgeDocuments: knowledgeDocs,
  });
});

/**
 * PUT /api/tenants/:tenantId/agent
 */
router.put('/:tenantId/agent', authenticateUser, requireTenant, requireRole(['OWNER', 'ADMIN']), async (req: Request, res: Response) => {
  const tenantId = req.tenant!.id;
  const {
    agentName,
    tone,
    greetingMessage,
    customInstructions,
    emergencyEscalationNumber,
    humanHandoffEmail,
    allowPriceQuoting,
    isEnabled,
  } = req.body;

  const updated = await prisma.agentConfiguration.upsert({
    where: { tenantId },
    update: {
      ...(agentName !== undefined ? { agentName } : {}),
      ...(tone !== undefined ? { tone } : {}),
      ...(greetingMessage !== undefined ? { greetingMessage } : {}),
      ...(customInstructions !== undefined ? { customInstructions } : {}),
      ...(emergencyEscalationNumber !== undefined ? { emergencyEscalationNumber } : {}),
      ...(humanHandoffEmail !== undefined ? { humanHandoffEmail } : {}),
      ...(allowPriceQuoting !== undefined ? { allowPriceQuoting } : {}),
      ...(isEnabled !== undefined ? { isEnabled } : {}),
    },
    create: {
      tenantId,
      agentName: agentName || 'Sarah',
      tone: tone || 'PROFESSIONAL',
      greetingMessage: greetingMessage || 'Hello! How can I help you today?',
      customInstructions,
      emergencyEscalationNumber,
      humanHandoffEmail,
      allowPriceQuoting: allowPriceQuoting !== false,
      isEnabled: isEnabled !== false,
    },
  });

  return res.json({ config: updated });
});

/**
 * POST /api/tenants/:tenantId/agent/knowledge
 */
router.post('/:tenantId/agent/knowledge', authenticateUser, requireTenant, requireRole(['OWNER', 'ADMIN']), async (req: Request, res: Response) => {
  const tenantId = req.tenant!.id;
  const { title, category, content } = req.body;

  if (!title || !content) {
    return res.status(400).json({ error: 'Title and content are required.' });
  }

  const doc = await prisma.knowledgeDocument.create({
    data: {
      tenantId,
      title,
      category: category || 'FAQ',
      content,
      isActive: true,
    },
  });

  return res.status(201).json({ document: doc });
});

/**
 * DELETE /api/tenants/:tenantId/agent/knowledge/:id
 */
router.delete('/:tenantId/agent/knowledge/:id', authenticateUser, requireTenant, requireRole(['OWNER', 'ADMIN']), async (req: Request, res: Response) => {
  const { id } = req.params;
  const tenantId = req.tenant!.id;

  await prisma.knowledgeDocument.deleteMany({
    where: { id, tenantId },
  });

  return res.json({ success: true, message: 'Knowledge document removed.' });
});

/**
 * POST /api/tenants/:tenantId/agent/chat
 * Sandbox test conversation in the business dashboard.
 */
router.post('/:tenantId/agent/chat', authenticateUser, requireTenant, async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenant!.id;
    const { message, conversationId } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Message is required.' });
    }

    const response = await AgentEngine.processMessage({
      tenantId,
      conversationId,
      message,
      channel: 'DASHBOARD_SANDBOX',
    });

    return res.json(response);
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Error processing sandbox chat' });
  }
});

/**
 * GET /api/tenants/:tenantId/agent/conversations
 * View past conversations and escalated handoffs.
 */
router.get('/:tenantId/agent/conversations', authenticateUser, requireTenant, async (req: Request, res: Response) => {
  const tenantId = req.tenant!.id;
  const { status } = req.query;

  const conversations = await prisma.conversation.findMany({
    where: {
      tenantId,
      ...(status ? { status: status as string } : {}),
    },
    orderBy: { updatedAt: 'desc' },
    take: 50,
    include: {
      customer: true,
      messages: {
        orderBy: { createdAt: 'asc' },
        take: 20,
      },
    },
  });

  return res.json({ conversations });
});

export default router;
