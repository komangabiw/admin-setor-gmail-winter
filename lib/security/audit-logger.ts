import { supabaseAdmin } from "@/lib/supabase/admin";
import { notifySecurityAlert } from "@/lib/telegram";

export interface AuditLogEntry {
  event:
    | "AUTH_SUCCESS"
    | "AUTH_FAILED"
    | "UNAUTHORIZED_ACCESS_ATTEMPT"
    | "RATE_LIMIT_EXCEEDED"
    | "CSRF_BLOCKED"
    | "UPDATE_BALANCE"
    | "TOGGLE_BLOCK_USER"
    | "DELETE_USER"
    | "DEPOSIT_STATUS_CHANGE"
    | "WITHDRAWAL_STATUS_CHANGE"
    | "TICKET_STATUS_CHANGE"
    | "TICKET_REPLY"
    | "CMS_CONFIG_UPDATE";
  severity?: "CRITICAL" | "WARNING" | "INFO";
  actorId?: string | null;
  actorEmail?: string | null;
  targetId?: string | null;
  ip: string;
  country?: string | null;
  userAgent?: string | null;
  details?: Record<string, any> | string;
}

/**
 * Centrally logs security and administrative events
 */
export async function logAuditEvent(entry: AuditLogEntry): Promise<void> {
  const severity = entry.severity || "INFO";
  const detailsStr =
    typeof entry.details === "object"
      ? JSON.stringify(entry.details)
      : entry.details || "";

  // 1. Structured Console Logging (visible in Cloudflare Workers / Vercel log stream)
  console.log(
    JSON.stringify({
      security_event: entry.event,
      severity,
      actor: entry.actorEmail || entry.actorId || "anonymous",
      target: entry.targetId,
      ip: entry.ip,
      country: entry.country,
      timestamp: new Date().toISOString(),
      details: entry.details,
    })
  );

  // 2. Alert via Telegram on WARNING or CRITICAL events
  if (severity === "CRITICAL" || severity === "WARNING") {
    notifySecurityAlert({
      title: entry.event,
      severity,
      action: entry.event,
      ip: entry.ip,
      country: entry.country,
      userAgent: entry.userAgent,
      userId: entry.actorId,
      email: entry.actorEmail,
      details: detailsStr,
    }).catch((err) => {
      console.error("Failed to dispatch security alert to Telegram:", err);
    });
  }
}

