import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { verifyIsAdmin } from "@/lib/auth-helpers";

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    let userId: string | null = null;
    let email: string | null = null;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.replace("Bearer ", "");
      const { data, error } = await supabaseAdmin.auth.getUser(token);
      if (!error && data?.user) {
        userId = data.user.id;
        email = data.user.email || null;
      }
    }

    // Fallback: request body
    if (!userId && !email) {
      try {
        const body = await req.json();
        userId = body.userId || null;
        email = body.email || null;
      } catch {
        // no body
      }
    }

    if (!userId && !email) {
      return NextResponse.json(
        { isAdmin: false, error: "Unauthenticated" },
        { status: 401 }
      );
    }

    const { isAdmin, profile } = await verifyIsAdmin(userId, email);

    return NextResponse.json({
      isAdmin,
      profile: profile || null,
      email,
    });
  } catch (err: any) {
    console.error("Admin check API error:", err);
    return NextResponse.json(
      { isAdmin: false, error: err?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
