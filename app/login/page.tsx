"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAdminAuth } from "@/context/admin-auth-context";
import {
  ShieldCheck,
  Lock,
  Mail,
  AlertCircle,
  ArrowRight,
  Eye,
  EyeOff,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const dynamic = "force-dynamic";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isAdmin, isLoading, signInWithGoogle, signInWithPassword } =
    useAdminAuth();


  const [mode, setMode] = useState<"google" | "password">("google");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Check URL query error
  useEffect(() => {
    const errorParam = searchParams.get("error");
    if (errorParam === "not_admin") {
      setErrorMessage(
        "Akun Google Anda berhasil masuk, namun belum terdaftar sebagai Administrator. Hubungi Superadmin untuk mendapatkan hak akses."
      );
    } else if (errorParam === "unauthorized") {
      setErrorMessage("Silakan login dengan akun Administrator untuk melanjutkan.");
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

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMessage("Email dan kata sandi wajib diisi");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const { error } = await signInWithPassword(email, password);
      if (error) {
        setErrorMessage(
          error.message === "Invalid login credentials"
            ? "Email atau kata sandi tidak sesuai"
            : error.message
        );
        setIsSubmitting(false);
        return;
      }

      // Check admin status after login
      setTimeout(() => {
        router.push("/");
      }, 500);
    } catch (err: any) {
      setErrorMessage(err?.message || "Gagal masuk");
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
          <p className="text-sm text-zinc-400 mt-2">
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

          {/* Mode Switcher Tabs */}
          <div className="grid grid-cols-2 p-1 bg-zinc-950 rounded-xl border border-zinc-800/80 mb-6">
            <button
              type="button"
              onClick={() => {
                setMode("google");
                setErrorMessage(null);
              }}
              className={`py-2 text-xs font-medium rounded-lg transition-all ${
                mode === "google"
                  ? "bg-zinc-800 text-white shadow-sm"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              Google OAuth
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("password");
                setErrorMessage(null);
              }}
              className={`py-2 text-xs font-medium rounded-lg transition-all ${
                mode === "password"
                  ? "bg-zinc-800 text-white shadow-sm"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              Email & Sandi
            </button>
          </div>

          {/* Tab 1: Google OAuth */}
          {mode === "google" && (
            <div className="space-y-4">
              <p className="text-xs text-zinc-400 text-center leading-relaxed">
                Masuk menggunakan akun Google Admin yang terdaftar di database Supabase Setor Gmail.
              </p>

              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl bg-white hover:bg-zinc-100 text-zinc-900 font-semibold text-sm transition-all shadow-md active:scale-[0.98] disabled:opacity-50 cursor-pointer"
              >
                {/* Google "G" SVG */}
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
                <span>{isSubmitting ? "Menghubungkan..." : "Lanjutkan dengan Google"}</span>
              </button>

              <div className="pt-2 text-center">
                <span className="text-[11px] text-zinc-500">
                  Akses langsung akun admin: komangabi26@gmail.com
                </span>
              </div>
            </div>
          )}

          {/* Tab 2: Email & Password */}
          {mode === "password" && (
            <form onSubmit={handlePasswordLogin} className="space-y-4">
              <Input
                label="Email Admin"
                type="email"
                placeholder="admin@setorgmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                leftIcon={<Mail className="w-4 h-4" />}
                required
              />

              <div className="relative">
                <Input
                  label="Kata Sandi"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  leftIcon={<Lock className="w-4 h-4" />}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-8 text-zinc-400 hover:text-zinc-200"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>

              <Button
                type="submit"
                variant="primary"
                isLoading={isSubmitting}
                className="w-full py-2.5 mt-2 flex items-center justify-center gap-2"
              >
                <span>Masuk ke Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </form>
          )}

          {/* Security Notice */}
          <div className="mt-6 pt-5 border-t border-zinc-800 text-center">
            <p className="text-[11px] text-zinc-400 flex items-center justify-center gap-1.5">
              <Lock className="w-3 h-3 text-emerald-400" />
              Koneksi terenkripsi & diamankan oleh Supabase Auth
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

