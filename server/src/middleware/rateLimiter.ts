import { Request, Response, NextFunction } from 'express';

interface RateLimitStore {
  [ip: string]: {
    count: number;
    resetTime: number;
  };
}

const stores: { [name: string]: RateLimitStore } = {};

export const createRateLimiter = (options: {
  name: string;
  windowMs: number;
  maxRequests: number;
  message?: string;
}) => {
  const { name, windowMs, maxRequests, message } = options;
  if (!stores[name]) {
    stores[name] = {};
  }

  // Periodic cleanup
  setInterval(() => {
    const now = Date.now();
    const store = stores[name];
    for (const key in store) {
      if (store[key].resetTime <= now) {
        delete store[key];
      }
    }
  }, windowMs);

  return (req: Request, res: Response, next: NextFunction) => {
    // In test environment, skip rate limits
    if (process.env.NODE_ENV === 'test') {
      return next();
    }

    const ip = req.ip || req.socket.remoteAddress || 'unknown-ip';
    const now = Date.now();
    const store = stores[name];

    if (!store[ip] || store[ip].resetTime <= now) {
      store[ip] = {
        count: 1,
        resetTime: now + windowMs,
      };
      return next();
    }

    store[ip].count += 1;

    if (store[ip].count > maxRequests) {
      const retryAfter = Math.ceil((store[ip].resetTime - now) / 1000);
      res.setHeader('Retry-After', retryAfter);
      return res.status(429).json({
        error: message || 'Too many requests. Please slow down.',
        retryAfterSeconds: retryAfter,
      });
    }

    next();
  };
};

export const chatRateLimiter = createRateLimiter({
  name: 'chat-limiter',
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 30, // 30 messages/minute
  message: 'Chat rate limit reached. Please wait a moment before sending another message.',
});

export const authRateLimiter = createRateLimiter({
  name: 'auth-limiter',
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 20,
  message: 'Too many authentication attempts. Please try again later.',
});
