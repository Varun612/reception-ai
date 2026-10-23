import { getOrCreateSessionId, recordMitigatedClick, getMitigatedClicksCount, sendTelemetryEvent } from './telemetry';

const API_BASE = '/api';

export class ApiError extends Error {
  status: number;
  details?: any;

  constructor(message: string, status: number, details?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

// In-flight active network request registry
const inFlightRequests = new Map<string, Promise<any>>();

// Recent successful responses cache to avoid redundant hits on rapid double-clicking (cooldown: 1200ms)
const recentCompletedRequests = new Map<string, { timestamp: number; data: any }>();

export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const method = (options.method || 'GET').toUpperCase();
  const bodyStr = typeof options.body === 'string' ? options.body : JSON.stringify(options.body || {});
  const requestFingerprint = `${method}:${endpoint}:${bodyStr}`;

  // 1. IN-FLIGHT DEDUPLICATION: If an identical request is already traveling across the wire,
  // do NOT trigger another network request. Share the in-flight Promise.
  if (inFlightRequests.has(requestFingerprint)) {
    const prevented = recordMitigatedClick();
    console.warn(`[ReceptionAI Deduplication] Intercepted rapid duplicate click for ${endpoint}. Attaching to in-flight request. Total prevented: ${prevented}`);
    
    // Asynchronously record duplicate click prevented telemetry
    sendTelemetryEvent({
      eventType: 'DUPLICATE_CLICK_PREVENTED',
      metadata: { endpoint, method, mechanism: 'client_inflight_deduplication' },
    });

    return inFlightRequests.get(requestFingerprint)! as Promise<T>;
  }

  // 2. RAPID CLICK DEBOUNCE (1200ms): If the exact same mutation was just executed <1200ms ago,
  // return the cached response instead of hitting the server again.
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
    const recent = recentCompletedRequests.get(requestFingerprint);
    if (recent && Date.now() - recent.timestamp < 1200) {
      const prevented = recordMitigatedClick();
      console.warn(`[ReceptionAI Deduplication] Intercepted duplicate click within debounce window (${Date.now() - recent.timestamp}ms). Sparing server.`);
      
      sendTelemetryEvent({
        eventType: 'DUPLICATE_CLICK_PREVENTED',
        metadata: { endpoint, method, mechanism: 'client_cooldown_debounce' },
      });

      return recent.data as T;
    }
  }

  const token = localStorage.getItem('reception_token');
  const headers = new Headers(options.headers || {});
  headers.set('Content-Type', 'application/json');

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  // Inject Idempotency and Session Telemetry headers on mutating requests
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
    if (!headers.has('x-idempotency-key')) {
      const randomKey = 'idemp_' + Math.random().toString(36).substring(2, 12) + '_' + Date.now();
      headers.set('x-idempotency-key', randomKey);
    }
    headers.set('x-client-session-id', getOrCreateSessionId());
    headers.set('x-duplicate-clicks-prevented', String(getMitigatedClicksCount()));
  }

  const fetchPromise = (async () => {
    try {
      const response = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers,
      });

      const contentType = response.headers.get('content-type');
      let data: any = null;

      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        data = await response.text();
      }

      if (!response.ok) {
        const errorMsg = data?.error || (typeof data === 'string' ? data : 'API Request failed');
        throw new ApiError(errorMsg, response.status, data?.details);
      }

      // Cache completed mutating request for debounce window
      if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
        recentCompletedRequests.set(requestFingerprint, {
          timestamp: Date.now(),
          data,
        });
      }

      return data as T;
    } finally {
      // Clean up in-flight registry
      inFlightRequests.delete(requestFingerprint);
    }
  })();

  inFlightRequests.set(requestFingerprint, fetchPromise);
  return fetchPromise;
}
