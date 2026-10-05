import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { verifyIsAdmin } from "@/lib/auth-helpers";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") || "/";

  if (code) {
    try {
      const { data, error } = await supabaseAdmin.auth.exchangeCodeForSession(code);
      if (!error && data?.user) {
        const { isAdmin } = await verifyIsAdmin(data.user.id, data.user.email);
        if (!isAdmin) {
          // User is authenticated but NOT an admin
          return NextResponse.redirect(
            new URL("/login?error=not_admin", requestUrl.origin)
          );
        }
        return NextResponse.redirect(new URL(next, requestUrl.origin));
      }
    } catch (err) {
      console.error("Auth callback error:", err);
    }
  }

  // Fallback redirect
  return NextResponse.redirect(new URL(next, requestUrl.origin));
}
