import { NextRequest } from "next/server";

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

// In-memory token bucket / sliding window for Edge and Node runtime
const rateLimitStore = new Map<string, RateLimitRecord>();

// Clean up stale records periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of rateLimitStore.entries()) {
    if (record.resetAt <= now) {
      rateLimitStore.delete(key);
    }
  }
}, 60_000);

export interface RateLimitConfig {
  maxRequests: number; // Maximum requests allowed
  windowMs: number;    // Window duration in milliseconds
}

export const RATE_LIMITS = {
  // Sensitive endpoints like auth check (20 requests per minute)
  AUTH: { maxRequests: 20, windowMs: 60_000 },
  // Mutative actions like PATCH/POST/DELETE (40 requests per minute)
  MUTATION: { maxRequests: 40, windowMs: 60_000 },
  // General admin read endpoints (120 requests per minute)
  API: { maxRequests: 120, windowMs: 60_000 },
};

/**
 * Extracts client IP with Cloudflare protection awareness
 */
export function getClientIp(req: NextRequest): string {
  // Cloudflare CF-Connecting-IP is set by Cloudflare edge and cannot be spoofed by client
  const cfConnectingIp = req.headers.get("cf-connecting-ip");
  if (cfConnectingIp) return cfConnectingIp.trim();

  // True-Client-IP header (Enterprise Cloudflare)
  const trueClientIp = req.headers.get("true-client-ip");
  if (trueClientIp) return trueClientIp.trim();

  // X-Real-IP
  const xRealIp = req.headers.get("x-real-ip");
  if (xRealIp) return xRealIp.trim();

  // Standard X-Forwarded-For
  const xForwardedFor = req.headers.get("x-forwarded-for");
  if (xForwardedFor) {
    const ips = xForwardedFor.split(",").map((ip) => ip.trim());
    if (ips[0]) return ips[0];
  }

  return "127.0.0.1";
}

/**
 * Checks if request exceeds rate limit
 */
export function checkRateLimit(
  req: NextRequest,
  config: RateLimitConfig = RATE_LIMITS.API,
  identifierPrefix: string = "api"
): {
  success: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
  retryAfterSeconds: number;
} {
  const ip = getClientIp(req);
  const key = `${identifierPrefix}:${ip}`;
  const now = Date.now();

  const record = rateLimitStore.get(key);

  if (!record || record.resetAt <= now) {
    const resetAt = now + config.windowMs;
    rateLimitStore.set(key, { count: 1, resetAt });
    return {
      success: true,
      limit: config.maxRequests,
      remaining: config.maxRequests - 1,
      resetAt,
      retryAfterSeconds: 0,
    };
  }

  if (record.count >= config.maxRequests) {
    const retryAfterSeconds = Math.max(1, Math.ceil((record.resetAt - now) / 1000));
    return {
      success: false,
      limit: config.maxRequests,
      remaining: 0,
      resetAt: record.resetAt,
      retryAfterSeconds,
    };
  }

  record.count += 1;
  return {
    success: true,
    limit: config.maxRequests,
    remaining: config.maxRequests - record.count,
    resetAt: record.resetAt,
    retryAfterSeconds: 0,
  };
}

