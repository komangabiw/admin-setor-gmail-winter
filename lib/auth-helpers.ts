import { supabaseAdmin } from "./supabase/admin";

export const DEFAULT_ADMIN_EMAILS = [
  "komangabi26@gmail.com",
  "komangdev7@gmail.com",
];

export function getAdminEmails(): string[] {
  const envEmails = process.env.ADMIN_EMAILS
    ? process.env.ADMIN_EMAILS.split(",").map((e) => e.trim().toLowerCase())
    : [];
  return Array.from(new Set([...DEFAULT_ADMIN_EMAILS, ...envEmails]));
}

/**
 * Checks if a given email or profile has admin privileges
 */
export async function verifyIsAdmin(
  userId?: string | null,
  email?: string | null
): Promise<{ isAdmin: boolean; profile?: any }> {
  if (!userId && !email) {
    return { isAdmin: false };
  }

  const adminEmails = getAdminEmails();
  const lowerEmail = email ? email.toLowerCase().trim() : null;

  // 1. Quick check against admin email whitelist
  if (lowerEmail && adminEmails.includes(lowerEmail)) {
    // Optionally fetch profile
    if (userId) {
      const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle();
      return { isAdmin: true, profile };
    }
    return { isAdmin: true };
  }

  // 2. Database role check in profiles table
  try {
    let query = supabaseAdmin.from("profiles").select("*");
    if (userId) {
      query = query.eq("id", userId);
    } else if (lowerEmail) {
      query = query.eq("email", lowerEmail);
    }

    const { data: profile, error } = await query.maybeSingle();

    if (error || !profile) {
      return { isAdmin: false };
    }

    const role = (profile.role || "").toLowerCase();
    const isRoleAdmin = role === "admin";
    const isEmailWhitelisted =
      profile.email && adminEmails.includes(profile.email.toLowerCase());

    return {
      isAdmin: isRoleAdmin || isEmailWhitelisted,
      profile,
    };
  } catch (err) {
    console.error("verifyIsAdmin error:", err);
    return { isAdmin: false };
  }
}
