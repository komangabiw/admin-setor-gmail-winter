import { NextRequest } from "next/server";

const ALLOWED_ORIGINS = [
  "https://admin.setorgmail.com",
  "https://setorgmail.com",
  "http://localhost:3000",
  "http://127.0.0.1:3000",
];

if (process.env.NEXT_PUBLIC_SITE_URL) {
  try {
    const origin = new URL(process.env.NEXT_PUBLIC_SITE_URL).origin;
    if (!ALLOWED_ORIGINS.includes(origin)) {
      ALLOWED_ORIGINS.push(origin);
    }
  } catch {}
}

/**
 * Validates CSRF for state-modifying HTTP methods (POST, PATCH, PUT, DELETE)
 */
export function validateCsrf(req: NextRequest): { valid: boolean; reason?: string } {
  const method = req.method.toUpperCase();

  // Safe read-only methods do not modify server state
  if (method === "GET" || method === "HEAD" || method === "OPTIONS") {
    return { valid: true };
  }

  // 1. Origin header check
  const origin = req.headers.get("origin");
  if (origin) {
    const isAllowed = ALLOWED_ORIGINS.some((allowed) => {
      return origin === allowed || origin.endsWith(".setorgmail.com");
    });

    if (!isAllowed) {
      return { valid: false, reason: `Untrusted Origin: ${origin}` };
    }
    return { valid: true };
  }

  // 2. Referer header fallback check
  const referer = req.headers.get("referer");
  if (referer) {
    try {
      const refererOrigin = new URL(referer).origin;
      const isAllowed = ALLOWED_ORIGINS.some((allowed) => {
        return refererOrigin === allowed || refererOrigin.endsWith(".setorgmail.com");
      });

      if (!isAllowed) {
        return { valid: false, reason: `Untrusted Referer: ${referer}` };
      }
      return { valid: true };
    } catch {
      return { valid: false, reason: "Malformed Referer header" };
    }
  }

  // 3. For API clients without Origin/Referer (e.g. mobile/same-origin fetches), require custom header
  const customHeader =
    req.headers.get("x-requested-with") ||
    req.headers.get("sec-fetch-site") ||
    req.headers.get("authorization");

  if (customHeader) {
    return { valid: true };
  }

  return { valid: false, reason: "Missing Origin, Referer, or custom anti-CSRF header" };
}

