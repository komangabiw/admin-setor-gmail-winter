/**
 * URL and Origin Resolution Helpers for Admin Portal
 *
 * Ensures Supabase OAuth and other redirects preserve the current admin origin
 * (e.g. localhost, admin.setorgmail.com, or active Cloudflare worker domain)
 * rather than falling back to the main domain (setorgmail.com).
 */

export function getAdminAppOrigin(): string {
  // 1. Prioritize active browser window origin (dynamic detection for custom domain, worker subdomain, localhost)
  if (
    typeof window !== "undefined" &&
    window.location?.origin &&
    window.location.origin !== "null"
  ) {
    return window.location.origin.replace(/\/+$/, "");
  }

  // 2. Fallback to NEXT_PUBLIC_SITE_URL environment variable if configured
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    let siteUrl = process.env.NEXT_PUBLIC_SITE_URL.trim().replace(/\/+$/, "");
    if (!siteUrl.startsWith("http://") && !siteUrl.startsWith("https://")) {
      siteUrl = `https://${siteUrl}`;
    }
    return siteUrl;
  }

  // 3. Ultimate fallback: production admin domain
  return "https://admin.setorgmail.com";
}

/**
 * Constructs the Supabase Auth callback URL using the dynamic admin origin.
 * @param path Optional callback path, defaults to "/auth/callback"
 */
export function getAuthCallbackUrl(path: string = "/auth/callback"): string {
  const origin = getAdminAppOrigin();
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${origin}${normalizedPath}`;
}
