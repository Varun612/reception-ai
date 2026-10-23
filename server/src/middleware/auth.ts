import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../db.js';
import { config } from '../config.js';

export interface AuthenticatedUser {
  id: string;
  email: string;
  fullName: string;
  isPlatformAdmin: boolean;
}

export interface TenantContext {
  id: string;
  slug: string;
  name: string;
  status: string;
  timeZone: string;
}

export interface MembershipContext {
  id: string;
  role: string;
}

// Augment Express Request interface
declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
      tenant?: TenantContext;
      membership?: MembershipContext;
    }
  }
}

export const authenticateUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authentication required. Please provide a valid Bearer token.' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, config.jwtSecret) as { userId: string };

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true, fullName: true, isPlatformAdmin: true, emailVerified: true },
    });

    if (!user) {
      return res.status(401).json({ error: 'User no longer exists or token is invalid.' });
    }

    req.user = user;
    next();
  } catch (err: any) {
    return res.status(401).json({ error: 'Invalid or expired authentication token.' });
  }
};

export const requireTenant = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User must be authenticated.' });
    }

    const tenantId = (req.params.tenantId || req.headers['x-tenant-id'] || req.body.tenantId) as string;
    if (!tenantId) {
      return res.status(400).json({ error: 'Tenant identifier is required for this operation.' });
    }

    // Platform admin can bypass specific membership requirement if needed
    if (req.user.isPlatformAdmin) {
      const tenant = await prisma.tenant.findUnique({
        where: { id: tenantId },
      });
      if (!tenant) {
        return res.status(404).json({ error: 'Tenant not found.' });
      }
      req.tenant = tenant;
      req.membership = { id: 'admin-override', role: 'OWNER' };
      return next();
    }

    const membership = await prisma.tenantMembership.findUnique({
      where: {
        tenantId_userId: {
          tenantId,
          userId: req.user.id,
        },
      },
      include: {
        tenant: true,
      },
    });

    if (!membership) {
      return res.status(403).json({ error: 'Forbidden: You do not have access to this tenant workspace.' });
    }

    if (membership.tenant.status === 'SUSPENDED') {
      return res.status(403).json({ error: 'Workspace is suspended. Please contact platform support.' });
    }

    req.tenant = membership.tenant;
    req.membership = {
      id: membership.id,
      role: membership.role,
    };

    next();
  } catch (err: any) {
    return res.status(500).json({ error: 'Internal server error verifying tenant authorization.' });
  }
};

export const requireRole = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.membership) {
      return res.status(403).json({ error: 'Tenant context required.' });
    }
    if (!allowedRoles.includes(req.membership.role) && !req.user?.isPlatformAdmin) {
      return res.status(403).json({
        error: `Insufficient permissions. Required role(s): ${allowedRoles.join(', ')}. Current role: ${req.membership.role}`,
      });
    }
    next();
  };
};

export const requirePlatformAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user || !req.user.isPlatformAdmin) {
    return res.status(403).json({ error: 'Super-admin access required.' });
  }
  next();
};
