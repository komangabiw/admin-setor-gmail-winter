import { supabase } from "@/lib/supabase/client";

/**
 * Frontend client helper that automatically injects:
 * 1. Bearer JWT token from active Supabase session
 * 2. Anti-CSRF header (X-Requested-With)
 * 3. Secure session cookie sync
 */
export async function adminFetch(
  input: string | URL | Request,
  init?: RequestInit
): Promise<Response> {
  let token: string | null = null;

  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (session?.access_token) {
      token = session.access_token;

      // Keep cookie synchronized in browser for server-side verification fallback
      if (typeof document !== "undefined") {
        const isHttps = window.location.protocol === "https:";
        document.cookie = `sb-access-token=${token}; Path=/; SameSite=Lax${
          isHttps ? "; Secure" : ""
        }; max-age=3600`;
      }
    }
  } catch (err) {
    console.warn("Could not retrieve active session for adminFetch:", err);
  }

  const headers = new Headers(init?.headers || {});

  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  if (!headers.has("X-Requested-With")) {
    headers.set("X-Requested-With", "XMLHttpRequest");
  }

  return fetch(input, {
    ...init,
    headers,
  });
}

