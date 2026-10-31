import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { DEFAULT_CONFIG, SiteConfig } from "@/lib/site-config";
import { requireAdminAuth } from "@/lib/security/auth-guard";
import { sanitizeString, sanitizeNumber, isSafeExternalUrl } from "@/lib/security/sanitize";
import { logAuditEvent } from "@/lib/security/audit-logger";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const auth = await requireAdminAuth(req);
  if (!auth.authorized) return auth.response!;

  try {
    const { data, error } = await supabaseAdmin
      .from("app_settings")
      .select("*")
      .eq("key", "site_config")
      .maybeSingle();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    let parsedConfig: Partial<SiteConfig> | null = null;
    if (data?.value) {
      try {
        parsedConfig = typeof data.value === "string" ? JSON.parse(data.value) : data.value;
      } catch {
        parsedConfig = null;
      }
    }

    // Always merge with DEFAULT_CONFIG so all keys are guaranteed to exist
    const config: SiteConfig = {
      ...DEFAULT_CONFIG,
      ...(parsedConfig || {}),
    };

    // Also get categories
    const { data: categories } = await supabaseAdmin
      .from("setor_categories")
      .select("*")
      .order("id");

    return NextResponse.json({
      success: true,
      config,
      categories: categories || [],
      updatedAt: data?.updated_at || null,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAdminAuth(req);
  if (!auth.authorized) return auth.response!;

  try {
    const body = await req.json();
    const { config } = body;

    if (!config || typeof config !== "object") {
      return NextResponse.json(
        { success: false, error: "Invalid configuration payload" },
        { status: 400 }
      );
    }

    // SSRF and URL validation (OWASP A10)
    if (config.whatsapp_channel_url && !isSafeExternalUrl(config.whatsapp_channel_url)) {
      return NextResponse.json(
        { success: false, error: "URL Saluran WhatsApp tidak aman atau bukan HTTPS valid" },
        { status: 400 }
      );
    }

    // Sanitize values
    const sanitizedIncoming: Partial<SiteConfig> = {
      price_per_gmail: sanitizeNumber(config.price_per_gmail, 100, 1_000_000, DEFAULT_CONFIG.price_per_gmail),
      price_bebas: sanitizeNumber(config.price_bebas, 100, 1_000_000, DEFAULT_CONFIG.price_bebas),
      min_withdrawal: sanitizeNumber(config.min_withdrawal, 1000, 10_000_000, DEFAULT_CONFIG.min_withdrawal),
      tax_gopay: sanitizeNumber(config.tax_gopay, 0, 50_000, DEFAULT_CONFIG.tax_gopay),
      tax_ovo: sanitizeNumber(config.tax_ovo, 0, 50_000, DEFAULT_CONFIG.tax_ovo),
      tax_dana: sanitizeNumber(config.tax_dana, 0, 50_000, DEFAULT_CONFIG.tax_dana),
      tax_shopeepay: sanitizeNumber(config.tax_shopeepay, 0, 50_000, DEFAULT_CONFIG.tax_shopeepay),
      default_password: sanitizeString(config.default_password, 50) || DEFAULT_CONFIG.default_password,
      rule_status: sanitizeString(config.rule_status, 100) || DEFAULT_CONFIG.rule_status,
      rule_nama: sanitizeString(config.rule_nama, 100) || DEFAULT_CONFIG.rule_nama,
      rule_usia: sanitizeString(config.rule_usia, 100) || DEFAULT_CONFIG.rule_usia,
      rule_keamanan: sanitizeString(config.rule_keamanan, 100) || DEFAULT_CONFIG.rule_keamanan,
      rules_detail_text: Array.isArray(config.rules_detail_text)
        ? config.rules_detail_text.map((t: any) => sanitizeString(t, 250))
        : DEFAULT_CONFIG.rules_detail_text,
      hero_headline_1: sanitizeString(config.hero_headline_1, 100) || DEFAULT_CONFIG.hero_headline_1,
      hero_headline_2: sanitizeString(config.hero_headline_2, 100) || DEFAULT_CONFIG.hero_headline_2,
      hero_headline_3: sanitizeString(config.hero_headline_3, 100) || DEFAULT_CONFIG.hero_headline_3,
      hero_subheadline: sanitizeString(config.hero_subheadline, 300) || DEFAULT_CONFIG.hero_subheadline,
      platform_badge: sanitizeString(config.platform_badge, 100) || DEFAULT_CONFIG.platform_badge,
      badge_status_text: sanitizeString(config.badge_status_text, 150) || DEFAULT_CONFIG.badge_status_text,
      badge_status_active: Boolean(config.badge_status_active),
      marquee_text: sanitizeString(config.marquee_text, 500) || DEFAULT_CONFIG.marquee_text,
      whatsapp_channel_url: sanitizeString(config.whatsapp_channel_url, 300) || DEFAULT_CONFIG.whatsapp_channel_url,
      telegram_admin_username: sanitizeString(config.telegram_admin_username, 60).replace("@", "") || DEFAULT_CONFIG.telegram_admin_username,
      is_setor_active: Boolean(config.is_setor_active),
      is_checker_active: Boolean(config.is_checker_active),
      is_withdrawal_active: Boolean(config.is_withdrawal_active),
      is_maintenance_mode: Boolean(config.is_maintenance_mode),
      maintenance_message: sanitizeString(config.maintenance_message, 500) || DEFAULT_CONFIG.maintenance_message,
    };

    // Merge incoming config with default to ensure complete structure
    const fullConfig: SiteConfig = {
      ...DEFAULT_CONFIG,
      ...sanitizedIncoming,
    };

    // 1. Upsert to app_settings
    const { error: upsertError } = await supabaseAdmin
      .from("app_settings")
      .upsert(
        {
          key: "site_config",
          value: JSON.stringify(fullConfig),
          description: "Master dynamic site configuration and content management for Setor Gmail",
          updated_at: new Date().toISOString(),
        },
        { onConflict: "key" }
      );

    if (upsertError) {
      return NextResponse.json(
        { success: false, error: upsertError.message },
        { status: 500 }
      );
    }

    // 2. Synchronize prices to setor_categories
    if (fullConfig.price_per_gmail) {
      await supabaseAdmin
        .from("setor_categories")
        .update({
          price: Number(fullConfig.price_per_gmail),
          updated_at: new Date().toISOString(),
        })
        .eq("id", "good");
    }

    if (fullConfig.price_bebas) {
      await supabaseAdmin
        .from("setor_categories")
        .update({
          price: Number(fullConfig.price_bebas),
          updated_at: new Date().toISOString(),
        })
        .eq("id", "bebas");
    }

    await logAuditEvent({
      event: "CMS_CONFIG_UPDATE",
      severity: "WARNING",
      actorId: auth.user?.id,
      actorEmail: auth.user?.email,
      ip: auth.clientIp,
      country: auth.country,
      details: {
        price_per_gmail: fullConfig.price_per_gmail,
        price_bebas: fullConfig.price_bebas,
        is_maintenance_mode: fullConfig.is_maintenance_mode,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Konfigurasi CMS berhasil disimpan dan disinkronkan!",
      config: fullConfig,
      updatedAt: new Date().toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
