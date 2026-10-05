"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { Loader2, ShieldCheck, AlertCircle } from "lucide-react";

export const dynamic = "force-dynamic";

function AuthCallbackContent() {
  const router = useRouter();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const processAuth = async () => {
      try {
        // 1. Check for OAuth errors in URL query or hash
        const urlParams = new URLSearchParams(window.location.search);
        const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
        const oauthError =
          urlParams.get("error_description") ||
          urlParams.get("error") ||
          hashParams.get("error_description") ||
          hashParams.get("error");

        if (oauthError) {
          setErrorMsg(oauthError);
          return;
        }

        // 2. If PKCE code exists in query params, exchange it
        const code = urlParams.get("code");
        if (code) {
          const { error: exchangeErr } =
            await supabase.auth.exchangeCodeForSession(code);
          if (exchangeErr) {
            console.warn("Code exchange warning:", exchangeErr);
          }
        }

        // 3. Get current session (handles both code exchange and hash #access_token)
        const {
          data: { session },
          error: sessionErr,
        } = await supabase.auth.getSession();

        if (sessionErr || !session?.user) {
          // Listen to state change if hash is being parsed by supabase-js
          const { data: authListener } = supabase.auth.onAuthStateChange(
            async (event, currentSession) => {
              if (currentSession?.user) {
                authListener.subscription.unsubscribe();
                await verifyAndRedirect(currentSession.user, currentSession.access_token);
              }
            }
          );

          // Timeout fallback
          setTimeout(() => {
            if (isMounted) {
              router.push("/login?error=unauthorized");
            }
          }, 3500);
          return;
        }

        await verifyAndRedirect(session.user, session.access_token);
      } catch (err: any) {
        console.error("Auth callback exception:", err);
        if (isMounted) {
          setErrorMsg(err?.message || "Gagal memproses autentikasi");
        }
      }
    };

    const verifyAndRedirect = async (user: any, token?: string) => {
      try {
        const headers: Record<string, string> = {
          "Content-Type": "application/json",
        };
        if (token) headers["Authorization"] = `Bearer ${token}`;

        const res = await fetch("/api/auth/admin-check", {
          method: "POST",
          headers,
          body: JSON.stringify({ userId: user.id, email: user.email }),
        });

        const data = await res.json();

        if (data.isAdmin) {
          // Authorized Admin -> navigate to intended path or dashboard root
          const urlParams = new URLSearchParams(window.location.search);
          const next = urlParams.get("next");
          const destination = next && next.startsWith("/") && !next.startsWith("//") ? next : "/";
          window.location.href = destination;
        } else {
          // Authenticated but not an admin -> sign out and reject
          await supabase.auth.signOut();
          window.location.href = "/login?error=not_admin";
        }
      } catch (err) {
        console.error("Admin verification error:", err);
        window.location.href = "/login?error=unauthorized";
      }
    };

    processAuth();

    return () => {
      isMounted = false;
    };
  }, [router]);

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-6 text-zinc-100">
      <div className="max-w-md w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-8 text-center shadow-2xl relative overflow-hidden">
        <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 mx-auto flex items-center justify-center mb-5 shadow-lg shadow-emerald-950/40">
          <ShieldCheck className="w-7 h-7" />
        </div>

        {errorMsg ? (
          <div className="space-y-3">
            <div className="flex items-center justify-center gap-2 text-rose-400">
              <AlertCircle className="w-5 h-5" />
              <h2 className="font-semibold text-base">Otentikasi Gagal</h2>
            </div>
            <p className="text-xs text-zinc-400">{errorMsg}</p>
            <button
              onClick={() => router.push("/login")}
              className="mt-3 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-xs font-medium rounded-lg text-white transition-colors"
            >
              Kembali ke Login
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-center gap-2">
              <Loader2 className="w-5 h-5 text-emerald-400 animate-spin" />
              <h2 className="font-semibold text-base">Memverifikasi Hak Akses Admin</h2>
            </div>
            <p className="text-xs text-zinc-400">
              Menghubungkan akun Google Anda dengan database Supabase...
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-zinc-400 text-sm">
          Menghubungkan sesi...
        </div>
      }
    >
      <AuthCallbackContent />
    </Suspense>
  );
}
