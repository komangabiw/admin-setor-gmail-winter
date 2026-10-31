import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { verifyIsAdmin } from "@/lib/auth-helpers";
import { checkRateLimit, getClientIp, RATE_LIMITS } from "@/lib/security/rate-limiter";
import { logAuditEvent } from "@/lib/security/audit-logger";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const clientIp = getClientIp(req);
  const country = req.headers.get("cf-ipcountry") || null;
  const userAgent = req.headers.get("user-agent") || null;

  // 1. Rate Limiting Protection (anti-brute force / credential stuffing)
  const rateLimit = checkRateLimit(req, RATE_LIMITS.AUTH, "auth_check");
  if (!rateLimit.success) {
    await logAuditEvent({
      event: "RATE_LIMIT_EXCEEDED",
      severity: "WARNING",
      ip: clientIp,
      country,
      userAgent,
      details: { route: "/api/auth/admin-check" },
    });

    const res = NextResponse.json(
      { isAdmin: false, error: "Terlalu banyak percobaan autentikasi. Tunggu sebentar." },
      { status: 429 }
    );
    res.headers.set("Retry-After", String(rateLimit.retryAfterSeconds));
    return res;
  }

  try {
    // 2. Extract JWT Token from Authorization header or cookie
    let token: string | null = null;
    const authHeader = req.headers.get("authorization");

    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.replace("Bearer ", "").trim();
    }

    if (!token) {
      token =
        req.cookies.get("sb-access-token")?.value ||
        req.cookies.get("sb-auth-token")?.value ||
        null;
    }

    // STRICT: Reject any unauthenticated request immediately (No body spoofing)
    if (!token) {
      return NextResponse.json(
        { isAdmin: false, error: "Token autentikasi tidak ditemukan" },
        { status: 401 }
      );
    }

    // 3. Cryptographically verify the session token with Supabase Auth
    const { data, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !data?.user) {
      await logAuditEvent({
        event: "AUTH_FAILED",
        severity: "WARNING",
        ip: clientIp,
        country,
        userAgent,
        details: { error: error?.message },
      });

      return NextResponse.json(
        { isAdmin: false, error: "Sesi tidak valid atau telah kedaluwarsa" },
        { status: 401 }
      );
    }

    const authUser = data.user;
    const userEmail = authUser.email || null;

    // 4. Verify admin status
    const { isAdmin, profile } = await verifyIsAdmin(authUser.id, userEmail);

    if (isAdmin) {
      await logAuditEvent({
        event: "AUTH_SUCCESS",
        severity: "INFO",
        actorId: authUser.id,
        actorEmail: userEmail,
        ip: clientIp,
        country,
        userAgent,
      });
    } else {
      await logAuditEvent({
        event: "UNAUTHORIZED_ACCESS_ATTEMPT",
        severity: "WARNING",
        actorId: authUser.id,
        actorEmail: userEmail,
        ip: clientIp,
        country,
        userAgent,
        details: { note: "Non-admin user called admin-check" },
      });
    }

    return NextResponse.json({
      isAdmin,
      profile: profile || null,
      email: userEmail,
    });
  } catch (err: any) {
    console.error("Admin check API error:", err);
    return NextResponse.json(
      { isAdmin: false, error: "Terjadi kesalahan internal pada server" },
      { status: 500 }
    );
  }
}
