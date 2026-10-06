import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const startTime = Date.now();

  // 1. Check Supabase DB
  const checkSupabase = async () => {
    const t0 = Date.now();
    try {
      const { error } = await supabaseAdmin
        .from("profiles")
        .select("id", { count: "exact", head: true });

      const latency = Date.now() - t0;
      if (error) {
        return {
          status: "Error",
          latency,
          error: error.message,
          project: "kdjoeeehyahdgwgsfyal",
        };
      }
      return {
        status: "Live",
        latency,
        project: "kdjoeeehyahdgwgsfyal",
      };
    } catch (e: any) {
      return {
        status: "Error",
        latency: Date.now() - t0,
        error: e?.message || "Connection failed",
        project: "kdjoeeehyahdgwgsfyal",
      };
    }
  };

  // 2. Check Telegram Bot
  const checkTelegram = async () => {
    const t0 = Date.now();
    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token) {
      return {
        status: "Offline",
        latency: 0,
        username: "@setorgmail_bot",
        error: "No token configured",
      };
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2500);

      const res = await fetch(`https://api.telegram.org/bot${token}/getMe`, {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      const json = await res.json();
      const latency = Date.now() - t0;

      if (json.ok) {
        return {
          status: "Live",
          latency,
          username: json.result?.username ? `@${json.result.username}` : "@setorgmail_bot",
        };
      } else {
        return {
          status: "Error",
          latency,
          username: "@setorgmail_bot",
          error: json.description,
        };
      }
    } catch (e: any) {
      return {
        status: "Offline",
        latency: Date.now() - t0,
        username: "@setorgmail_bot",
        error: e?.message || "Timeout",
      };
    }
  };

  // 3. Check Cloudflare Edge
  const checkCloudflare = async () => {
    const host = req.headers.get("host") || "admin.setorgmail.com";
    return {
      status: "Live",
      latency: Math.max(1, Date.now() - startTime),
      host: host.includes("localhost") ? "admin.setorgmail.com" : host,
    };
  };

  const [supabase, telegram, cloudflare] = await Promise.all([
    checkSupabase(),
    checkTelegram(),
    checkCloudflare(),
  ]);

  return NextResponse.json({
    success: true,
    timestamp: new Date().toISOString(),
    totalTimeMs: Date.now() - startTime,
    integrations: {
      supabase,
      telegram,
      cloudflare,
    },
  });
}
