import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { prisma } from '../db.js';

interface InFlightEntry {
  promise: Promise<{ statusCode: number; body: any }>;
  resolve: (val: { statusCode: number; body: any }) => void;
  preventedCount: number;
}

// Global active in-flight request locks to block concurrent multi-click executions
const inFlightMap = new Map<string, InFlightEntry>();

/**
 * Idempotency & Duplicate Request Interception Middleware.
 * Prevents redundant server hits, double bookings, and duplicate mutations
 * when users double-click or submit rapid concurrent requests.
 */
export async function idempotencyMiddleware(req: Request, res: Response, next: NextFunction) {
  // Only apply to mutating HTTP methods
  if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
    return next();
  }

  // Auth endpoints (login, register, forgot-password, reset-password) must always be dynamically evaluated
  if (req.originalUrl.includes('/auth') || req.path.includes('/auth')) {
    return next();
  }

  // 1. Identify or generate the idempotency key
  const clientKey = (req.headers['x-idempotency-key'] || req.headers['x-idempotency-key'.toLowerCase()]) as string;
  const clientSessionId = (req.headers['x-client-session-id'] as string) || 'unknown-session';
  const duplicateClicksPreventedOnClient = parseInt((req.headers['x-duplicate-clicks-prevented'] as string) || '0', 10);

  const bodyStr = JSON.stringify(req.body || {});
  const requestHash = crypto.createHash('sha256').update(`${req.method}:${req.originalUrl}:${bodyStr}`).digest('hex');
  const idempotencyKey = clientKey || `hash_${requestHash.substring(0, 32)}`;

  // Extract tenantIdentifier from headers, body, or URL path
  let tenantIdentifier: string | null =
    ((req as any).tenant?.id as string) ||
    (req.headers['x-tenant-id'] as string) ||
    (req.body && req.body.tenantId);

  if (!tenantIdentifier) {
    const match = req.originalUrl.match(/\/(?:widget|tenants|telephony)\/([^/?]+)/);
    if (match) {
      tenantIdentifier = match[1];
    }
  }

  // 2. SYNCHRONOUS IN-FLIGHT LOCK CHECK:
  // Must check and register synchronously BEFORE any await yields to event loop!
  if (inFlightMap.has(idempotencyKey)) {
    const inFlight = inFlightMap.get(idempotencyKey)!;
    inFlight.preventedCount++;
    const result = await inFlight.promise;

    // Record duplicate click prevention telemetry
    if (tenantIdentifier) {
      const resolvedTenant = await prisma.tenant.findFirst({
        where: {
          OR: [{ id: tenantIdentifier }, { slug: tenantIdentifier }],
        },
      });

      if (resolvedTenant) {
        prisma.interactionTelemetry
          .create({
            data: {
              tenantId: resolvedTenant.id,
              sessionId: clientSessionId,
              eventType: 'DUPLICATE_CLICK_PREVENTED',
              channel: 'WEB_WIDGET',
              duplicateClicksMitigated: 1,
              metadata: JSON.stringify({
                endpoint: req.originalUrl,
                method: req.method,
                preventedAt: 'server_inflight_lock',
                inFlightPreventedTotal: inFlight.preventedCount,
              }),
            },
          })
          .catch(() => {});
      }
    }

    res.setHeader('x-idempotent-replay', 'true');
    res.setHeader('x-prevented-duplicate-clicks', String(inFlight.preventedCount));
    return res.status(result.statusCode).json(result.body);
  }

  // Synchronously register in-flight lock for this request BEFORE any await!
  let resolver!: (val: { statusCode: number; body: any }) => void;
  const inFlightPromise = new Promise<{ statusCode: number; body: any }>((resolve) => {
    resolver = resolve;
  });
  const currentInFlight: InFlightEntry = {
    promise: inFlightPromise,
    resolve: resolver,
    preventedCount: duplicateClicksPreventedOnClient,
  };
  inFlightMap.set(idempotencyKey, currentInFlight);

  try {
    // Resolve tenant ID for database record
    let resolvedTenantId: string | null = null;
    if (tenantIdentifier) {
      const tObj = await prisma.tenant.findFirst({
        where: {
          OR: [{ id: tenantIdentifier }, { slug: tenantIdentifier }],
        },
      });
      if (tObj) resolvedTenantId = tObj.id;
    }

    // 3. PERSISTED IDEMPOTENCY CHECK: Check if this request was already processed in past hours
    const existing = await prisma.idempotencyRecord.findUnique({
      where: { key: idempotencyKey },
    });

    if (existing && existing.expiresAt > new Date()) {
      // Release in-flight lock for any waiting requests
      resolver({ statusCode: existing.statusCode, body: JSON.parse(existing.responseBody) });
      inFlightMap.delete(idempotencyKey);

      const updated = await prisma.idempotencyRecord.update({
        where: { key: idempotencyKey },
        data: { preventedCount: { increment: 1 } },
      });

      if (resolvedTenantId || existing.tenantId) {
        prisma.interactionTelemetry
          .create({
            data: {
              tenantId: resolvedTenantId || existing.tenantId!,
              sessionId: clientSessionId,
              eventType: 'DUPLICATE_CLICK_PREVENTED',
              channel: 'WEB_WIDGET',
              duplicateClicksMitigated: 1,
              metadata: JSON.stringify({
                endpoint: req.originalUrl,
                method: req.method,
                preventedAt: 'server_idempotency_layer',
                serverPreventedTotal: updated.preventedCount,
              }),
            },
          })
          .catch(() => {});
      }

      res.setHeader('x-idempotent-replay', 'true');
      res.setHeader('x-prevented-duplicate-clicks', String(updated.preventedCount));
      return res.status(existing.statusCode).json(JSON.parse(existing.responseBody));
    }

    // 4. Wrap response to capture and record successful responses
    const originalJson = res.json.bind(res);
    res.json = (body: any) => {
      // Snapshot the count of concurrent waiters caught during in-flight execution
      const totalPrevented = currentInFlight.preventedCount;

      // Release in-flight lock for waiting requests
      resolver({ statusCode: res.statusCode, body });
      inFlightMap.delete(idempotencyKey);

      // Save idempotency record asynchronously with upsert
      if (res.statusCode >= 200 && res.statusCode < 500) {
        prisma.idempotencyRecord
          .upsert({
            where: { key: idempotencyKey },
            update: {
              statusCode: res.statusCode,
              responseBody: JSON.stringify(body),
              preventedCount: totalPrevented,
              tenantId: resolvedTenantId || undefined,
            },
            create: {
              key: idempotencyKey,
              tenantId: resolvedTenantId,
              endpoint: req.originalUrl,
              method: req.method,
              requestHash,
              statusCode: res.statusCode,
              responseBody: JSON.stringify(body),
              preventedCount: totalPrevented,
              expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
            },
          })
          .catch((err) => {
            console.error('[Idempotency] Failed to store record:', err);
          });
      }

      return originalJson(body);
    };

    return next();
  } catch (err) {
    console.error('[Idempotency] Middleware error:', err);
    resolver({ statusCode: 500, body: { error: 'Internal server error' } });
    inFlightMap.delete(idempotencyKey);
    return next();
  }
}
