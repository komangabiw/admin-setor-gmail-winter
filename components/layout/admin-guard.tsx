"use client";

import React, { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAdminAuth } from "@/context/admin-auth-context";
import { ShieldAlert, LogIn, LogOut, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const { user, isAdmin, isLoading, signOut } = useAdminAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // If not loading and not on /login, and not authenticated at all, redirect to /login
    if (!isLoading && !user && pathname !== "/login") {
      router.push("/login");
    }
  }, [isLoading, user, pathname, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <div className="relative flex items-center justify-center">
            <div className="w-12 h-12 rounded-full border-2 border-emerald-500/20 border-t-emerald-500 animate-spin" />
            <div className="absolute w-6 h-6 rounded-full bg-emerald-500/10" />
          </div>
          <p className="text-zinc-400 text-sm animate-pulse font-medium">
            Memverifikasi Hak Akses Admin...
          </p>
        </div>
      </div>
    );
  }

  // If user is authenticated but NOT an admin
  if (user && !isAdmin) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-6">
        <div className="max-w-md w-full bg-zinc-900 border border-rose-500/30 rounded-2xl p-6 sm:p-8 text-center shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-rose-500 to-amber-500" />
          <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 mx-auto flex items-center justify-center mb-5">
            <ShieldAlert className="w-8 h-8" />
          </div>

          <h1 className="text-xl font-bold text-zinc-100 mb-2">
            Akses Ditolak
          </h1>
          <p className="text-sm text-zinc-400 mb-4 leading-relaxed">
            Akun Anda terdeteksi bukan sebagai Administrator Setor Gmail. Hanya
            akun dengan role <b>Admin</b> yang diizinkan mengelola portal ini.
          </p>

          <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-3 mb-6 text-left">
            <p className="text-xs text-zinc-500">Email Akun:</p>
            <p className="text-sm font-medium text-zinc-200 truncate">
              {user.email || "-"}
            </p>
          </div>

          <div className="flex flex-col gap-2.5">
            <Button
              variant="secondary"
              onClick={() => signOut()}
              className="w-full flex items-center justify-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              Keluar & Masuk dengan Akun Lain
            </Button>
            <a
              href="https://setorgmail.com"
              target="_blank"
              rel="noreferrer"
              className="text-xs text-zinc-400 hover:text-zinc-200 transition-colors py-2"
            >
              Kembali ke Aplikasi Utama (setorgmail.com)
            </a>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-4">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
      </div>
    );
  }

  return <>{children}</>;
}
