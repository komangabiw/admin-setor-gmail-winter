"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAdminAuth } from "@/context/admin-auth-context";
import {
  ShieldCheck,
  Lock,
  AlertCircle,
  Loader2,
} from "lucide-react";

export const dynamic = "force-dynamic";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isAdmin, isLoading, signInWithGoogle } = useAdminAuth();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Check URL query error
  useEffect(() => {
    const errorParam = searchParams.get("error");
    if (errorParam === "not_admin") {
      setErrorMessage(
        "Akses ditolak: Akun Google ini bukan Administrator (komangabiw@gmail.com). Silakan gunakan akun admin yang berwenang."
      );
    } else if (errorParam === "unauthorized") {
      setErrorMessage("Silakan login dengan akun Administrator resmi untuk melanjutkan.");
    }
  }, [searchParams]);

  // If already authenticated as admin, redirect to dashboard
  useEffect(() => {
    if (!isLoading && user && isAdmin) {
      router.push("/");
    }
  }, [isLoading, user, isAdmin, router]);

  const handleGoogleLogin = async () => {
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      const { error } = await signInWithGoogle();
      if (error) {
        setErrorMessage(error.message || "Gagal masuk dengan Google");
        setIsSubmitting(false);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || "Terjadi kesalahan saat otentikasi Google");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden select-none">
      {/* Background Glow Accents */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-72 h-72 bg-teal-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Main Container */}
      <div className="w-full max-w-md relative z-10">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-xl shadow-emerald-950/50 mb-4 border border-emerald-400/30">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center justify-center gap-2">
            Setor Gmail
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 uppercase tracking-wider">
              Admin Portal
            </span>
          </h1>
          <p className="text-xs text-zinc-400 mt-2">
            Pusat Kontrol & Manajemen admin.setorgmail.com
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-zinc-900/80 backdrop-blur-xl border border-zinc-800 rounded-2xl p-6 sm:p-8 shadow-2xl">
          {/* Error Message */}
          {errorMessage && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5 animate-in fade-in duration-200">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
              <span className="leading-relaxed">{errorMessage}</span>
            </div>
          )}

          {/* Direct Google OAuth Section */}
          <div className="space-y-4">
            <div className="text-center space-y-1 mb-2">
              <h2 className="text-sm font-semibold text-zinc-200">
                Otentikasi Administrator
              </h2>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Login khusus akun Google Admin: <span className="text-emerald-400 font-mono font-medium">komangabiw@gmail.com</span>
              </p>
            </div>

            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl bg-white hover:bg-zinc-100 text-zinc-900 font-semibold text-sm transition-all shadow-md active:scale-[0.98] disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? (
                <Loader2 className="w-5 h-5 animate-spin text-zinc-900" />
              ) : (
                /* Google "G" SVG */
                <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.36 24 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.17 0 9.97 0 12s.45 3.83 1.25 5.42l4.03-3.15z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.36 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                  />
                </svg>
              )}
              <span>{isSubmitting ? "Menghubungkan ke Google..." : "Lanjutkan dengan Google"}</span>
            </button>
          </div>

          {/* Security Notice */}
          <div className="mt-6 pt-5 border-t border-zinc-800 text-center">
            <p className="text-[11px] text-zinc-400 flex items-center justify-center gap-1.5">
              <Lock className="w-3 h-3 text-emerald-400" />
              Sesi terenkripsi & diproteksi Supabase OAuth
            </p>
          </div>
        </div>

        {/* Return to public site */}
        <div className="text-center mt-6">
          <a
            href="https://setorgmail.com"
            target="_blank"
            rel="noreferrer"
            className="text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            ← Kembali ke Website Utama Setor Gmail
          </a>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-zinc-400 text-sm">
          Memuat halaman login admin...
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
