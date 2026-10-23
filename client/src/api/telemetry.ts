/**
 * ReceptionAI End-to-End Customer Telemetry & Session Tracker
 * Collects interaction metadata, funnel drop-offs, device context,
 * and tracks duplicate click prevention to preserve vendor server health.
 */

// Generate or retrieve persistent browser session ID
export function getOrCreateSessionId(): string {
  let sessionId = sessionStorage.getItem('reception_session_id');
  if (!sessionId) {
    sessionId = 'sess_' + Math.random().toString(36).substring(2, 11) + '_' + Date.now();
    sessionStorage.setItem('reception_session_id', sessionId);
  }
  return sessionId;
}

// Track local mitigated clicks count across the active session
let sessionMitigatedClicks = 0;

export function recordMitigatedClick(): number {
  sessionMitigatedClicks++;
  return sessionMitigatedClicks;
}

export function getMitigatedClicksCount(): number {
  return sessionMitigatedClicks;
}

// Device context detection
export function getDeviceContext() {
  const ua = navigator.userAgent;
  let deviceType = 'Desktop';
  if (/mobile/i.test(ua)) deviceType = 'Mobile';
  else if (/tablet|ipad/i.test(ua)) deviceType = 'Tablet';

  let browser = 'Unknown Browser';
  if (/chrome|crios/i.test(ua)) browser = 'Chrome';
  else if (/firefox|fxios/i.test(ua)) browser = 'Firefox';
  else if (/safari/i.test(ua) && !/chrome/i.test(ua)) browser = 'Safari';
  else if (/edg/i.test(ua)) browser = 'Edge';

  let os = 'Unknown OS';
  if (/windows/i.test(ua)) os = 'Windows';
  else if (/macintosh|mac os x/i.test(ua)) os = 'macOS';
  else if (/android/i.test(ua)) os = 'Android';
  else if (/iphone|ipad|ipod/i.test(ua)) os = 'iOS';
  else if (/linux/i.test(ua)) os = 'Linux';

  return {
    deviceType,
    browser,
    os,
    screenResolution: `${window.innerWidth}x${window.innerHeight}`,
    referrer: document.referrer || window.location.href,
  };
}

import { API_BASE } from './client';

export interface TelemetryEventPayload {
  tenantSlug?: string;
  tenantId?: string;
  eventType:
    | 'SESSION_START'
    | 'WIDGET_OPEN'
    | 'SERVICE_SELECT'
    | 'SLOT_BROWSE'
    | 'SLOT_SELECT'
    | 'DETAILS_INPUT'
    | 'DUPLICATE_CLICK_PREVENTED'
    | 'BOOKING_SUBMITTED'
    | 'BOOKING_CONFIRMED'
    | 'ABANDONED';
  channel?: 'WEB_WIDGET' | 'CALL_TO_CHAT' | 'DEMO' | 'DIRECT_LINK' | 'DASHBOARD';
  customerEmail?: string;
  customerPhone?: string;
  timeSpentSeconds?: number;
  duplicateClicksMitigated?: number;
  metadata?: Record<string, any>;
  appointmentId?: string;
}

/**
 * Dispatch telemetry event asynchronously to backend
 */
export async function sendTelemetryEvent(payload: TelemetryEventPayload) {
  try {
    const sessionId = getOrCreateSessionId();
    const device = getDeviceContext();

    await fetch(`${API_BASE}/telemetry/event`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...device,
        sessionId,
        ...payload,
        duplicateClicksMitigated: payload.duplicateClicksMitigated ?? sessionMitigatedClicks,
      }),
    });
  } catch (err) {
    // Non-blocking telemetry
    console.debug('[Telemetry] Event recording failed (silently skipped):', err);
  }
}
