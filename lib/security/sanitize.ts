/**
 * Input sanitization & validation helper for OWASP A03 (Injection) & A10 (SSRF)
 */

/**
 * Escapes HTML characters to prevent XSS
 */
export function escapeHtml(str: string): string {
  if (!str || typeof str !== "string") return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Strips dangerous script tags, iframe, javascript: pseudo-protocols, and control characters
 */
export function sanitizeString(val: any, maxLength: number = 2000): string {
  if (val === null || val === undefined) return "";
  let str = String(val).trim();

  // Strip NULL bytes and dangerous non-printable control characters
  str = str.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");

  // Strip javascript:, data:text/html, vbscript:
  str = str.replace(/(?:javascript|vbscript|data):/gi, "");

  // Strip HTML script and event handler attributes
  str = str.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "");
  str = str.replace(/on\w+\s*=/gi, "");

  // Truncate to maximum length
  if (str.length > maxLength) {
    str = str.substring(0, maxLength);
  }

  return str;
}

/**
 * Strictly validates and bounds numeric inputs (prevents NaN, Infinity, negative balance manipulation)
 */
export function sanitizeNumber(
  val: any,
  min: number = 0,
  max: number = 1_000_000_000,
  defaultVal: number = 0
): number {
  if (val === null || val === undefined) return defaultVal;
  const num = Number(val);
  if (!Number.isFinite(num) || Number.isNaN(num)) {
    return defaultVal;
  }
  return Math.min(Math.max(num, min), max);
}

/**
 * SSRF Prevention (OWASP A10): Validates external URLs against private networks and non-HTTPS schemes
 */
export function isSafeExternalUrl(urlStr: string): boolean {
  if (!urlStr || typeof urlStr !== "string") return false;

  try {
    const parsed = new URL(urlStr);

    // Only allow HTTPS (never javascript:, file:, data:, ftp:, http:)
    if (parsed.protocol !== "https:") {
      return false;
    }

    const hostname = parsed.hostname.toLowerCase();

    // Block localhost and loopback
    if (
      hostname === "localhost" ||
      hostname.endsWith(".localhost") ||
      hostname === "127.0.0.1" ||
      hostname === "::1" ||
      hostname === "0.0.0.0"
    ) {
      return false;
    }

    // Block Cloud metadata IP (AWS, GCP, DigitalOcean, Azure: 169.254.169.254)
    if (hostname === "169.254.169.254" || hostname.startsWith("169.254.")) {
      return false;
    }

    // Block RFC 1918 Private IPv4 Addresses
    // 10.0.0.0/8
    if (/^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(hostname)) return false;
    // 172.16.0.0/12 (172.16 - 172.31)
    if (/^172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}$/.test(hostname)) return false;
    // 192.168.0.0/16
    if (/^192\.168\.\d{1,3}\.\d{1,3}$/.test(hostname)) return false;

    // Block internal kubernetes/docker service domains
    if (
      hostname.endsWith(".internal") ||
      hostname.endsWith(".local") ||
      hostname.endsWith(".cluster.local")
    ) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

