import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { verifyIsAdmin } from "@/lib/auth-helpers";
import { checkRateLimit, getClientIp, RATE_LIMITS } from "./rate-limiter";
import { validateCsrf } from "./csrf";
import { logAuditEvent } from "./audit-logger";

export interface AdminAuthResult {
  authorized: boolean;
  user?: any;
  profile?: any;
  clientIp: string;
  country: string | null;
  response?: NextResponse;
}

/**
 * Server-side guard to strictly enforce authentication, admin authorization,
 * anti-CSRF, and rate limiting on every Admin API endpoint.
 * (OWASP A01: Broken Access Control, A04: Insecure Design, A07: Auth Failures)
 */
export async function requireAdminAuth(
  req: NextRequest,
  options?: {
    rateLimit?: { maxRequests: number; windowMs: number };
    allowCsrfBypass?: boolean;
  }
): Promise<AdminAuthResult> {
  const clientIp = getClientIp(req);
  const country = req.headers.get("cf-ipcountry") || null;
  const userAgent = req.headers.get("user-agent") || null;
  const pathname = req.nextUrl.pathname;

  // 1. Rate Limiting Check
  const rateLimitConfig = options?.rateLimit || RATE_LIMITS.API;
  const rateLimitResult = checkRateLimit(req, rateLimitConfig, "admin_api");

  if (!rateLimitResult.success) {
    await logAuditEvent({
      event: "RATE_LIMIT_EXCEEDED",
      severity: "WARNING",
      ip: clientIp,
      country,
      userAgent,
      details: {
        path: pathname,
        retryAfter: rateLimitResult.retryAfterSeconds,
      },
    });

    const res = NextResponse.json(
      {
        success: false,
        error: "Terlalu banyak permintaan (Rate limit exceeded). Coba lagi nanti.",
      },
      { status: 429 }
    );

    res.headers.set("Retry-After", String(rateLimitResult.retryAfterSeconds));
    res.headers.set("X-RateLimit-Limit", String(rateLimitResult.limit));
    res.headers.set("X-RateLimit-Remaining", "0");
    res.headers.set("X-RateLimit-Reset", String(rateLimitResult.resetAt));
    return { authorized: false, clientIp, country, response: res };
  }

  // 2. CSRF Validation for state-changing requests
  if (!options?.allowCsrfBypass) {
    const csrfCheck = validateCsrf(req);
    if (!csrfCheck.valid) {
      await logAuditEvent({
        event: "CSRF_BLOCKED",
        severity: "WARNING",
        ip: clientIp,
        country,
        userAgent,
        details: { path: pathname, reason: csrfCheck.reason },
      });

      return {
        authorized: false,
        clientIp,
        country,
        response: NextResponse.json(
          {
            success: false,
            error: "Akses ditolak: Validasi CSRF gagal.",
          },
          { status: 403 }
        ),
      };
    }
  }

  // 3. Extract Token from Authorization header or secure cookie
  let token: string | null = null;
  const authHeader = req.headers.get("authorization");

  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.replace("Bearer ", "").trim();
  }

  // Fallback to cookie
  if (!token) {
    const cookieToken =
      req.cookies.get("sb-access-token")?.value ||
      req.cookies.get("sb-auth-token")?.value;
    if (cookieToken) {
      token = cookieToken;
    }
  }

  if (!token) {
    await logAuditEvent({
      event: "UNAUTHORIZED_ACCESS_ATTEMPT",
      severity: "WARNING",
      ip: clientIp,
      country,
      userAgent,
      details: { path: pathname, reason: "Missing token" },
    });

    return {
      authorized: false,
      clientIp,
      country,
      response: NextResponse.json(
        {
          success: false,
          error: "Akses ditolak: Token autentikasi tidak ditemukan.",
        },
        { status: 401 }
      ),
    };
  }

  // 4. Verify Token with Supabase Auth
  try {
    const { data: authData, error: authError } =
      await supabaseAdmin.auth.getUser(token);

    if (authError || !authData?.user) {
      await logAuditEvent({
        event: "AUTH_FAILED",
        severity: "WARNING",
        ip: clientIp,
        country,
        userAgent,
        details: { path: pathname, authError: authError?.message },
      });

      return {
        authorized: false,
        clientIp,
        country,
        response: NextResponse.json(
          {
            success: false,
            error: "Akses ditolak: Sesi tidak sah atau telah kedaluwarsa.",
          },
          { status: 401 }
        ),
      };
    }

    const authUser = authData.user;

    // 5. Verify Admin Role / Email
    const { isAdmin, profile } = await verifyIsAdmin(
      authUser.id,
      authUser.email
    );

    if (!isAdmin) {
      await logAuditEvent({
        event: "UNAUTHORIZED_ACCESS_ATTEMPT",
        severity: "CRITICAL",
        actorId: authUser.id,
        actorEmail: authUser.email,
        ip: clientIp,
        country,
        userAgent,
        details: {
          path: pathname,
          reason: "Non-admin attempted admin action",
        },
      });

      return {
        authorized: false,
        clientIp,
        country,
        response: NextResponse.json(
          {
            success: false,
            error: "Akses ditolak: Anda tidak memiliki hak akses Administrator.",
          },
          { status: 403 }
        ),
      };
    }

    return {
      authorized: true,
      user: authUser,
      profile,
      clientIp,
      country,
    };
  } catch (err: any) {
    console.error("Auth guard unexpected error:", err);
    return {
      authorized: false,
      clientIp,
      country,
      response: NextResponse.json(
        {
          success: false,
          error: "Terjadi kesalahan keamanan internal.",
        },
        { status: 500 }
      ),
    };
  }
}

