"use client";

import React, { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useAdminAuth } from "@/context/admin-auth-context";
import {
  Menu,
  Bell,
  Clock,
  LogOut,
  Sparkles,
  Shield,
  Search,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function Header({
  onMenuClick,
}: {
  onMenuClick?: () => void;
}) {
  const pathname = usePathname();
  const { profile, user, signOut } = useAdminAuth();
  const [timeStr, setTimeStr] = useState<string>("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleDateString("id-ID", {
          weekday: "short",
          day: "numeric",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }) + " WIB"
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 30000);
    return () => clearInterval(interval);
  }, []);

  const getPageTitle = () => {
    if (pathname === "/") return { title: "Dashboard", subtitle: "Ringkasan metrik & statistik aktivitas" };
    if (pathname.startsWith("/users")) return { title: "Manajemen Pengguna", subtitle: "Kelola akun pengguna, saldo dompet & hak akses" };
    if (pathname.startsWith("/transactions")) return { title: "Transaksi & Saldo", subtitle: "Pantau setoran, penarikan & mutasi saldo" };
    if (pathname.startsWith("/tickets")) return { title: "Tiket Bantuan & Telegram", subtitle: "Laporan pengguna & tiket dari Bot Telegram" };
    return { title: "Admin Portal", subtitle: "Setor Gmail Backoffice" };
  };

  const { title, subtitle } = getPageTitle();

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 sm:px-6 bg-zinc-950/80 backdrop-blur-md border-b border-zinc-800/80">
      {/* Left side: Hamburger + Page Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="lg:hidden text-zinc-400 hover:text-zinc-200 p-2 rounded-lg hover:bg-zinc-900 transition-colors"
          aria-label="Buka Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex flex-col">
          <h1 className="text-base sm:text-lg font-bold text-zinc-100 flex items-center gap-2">
            {title}
            <Badge variant="primary" className="hidden sm:inline-flex text-[10px] py-0 px-2">
              Live
            </Badge>
          </h1>
          <p className="text-xs text-zinc-400 hidden md:block">
            {subtitle}
          </p>
        </div>
      </div>

      {/* Right side: Live Time, Status, Admin dropdown/pill */}
      <div className="flex items-center gap-3">
        {/* Real-time WIB clock */}
        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-300 font-mono">
          <Clock className="w-3.5 h-3.5 text-zinc-400" />
          <span>{timeStr || "WIB Live"}</span>
        </div>

        {/* Profile Pill */}
        <div className="flex items-center gap-2 pl-2 border-l border-zinc-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center font-bold text-xs shadow-sm">
              {(profile?.name || user?.email || "A").charAt(0).toUpperCase()}
            </div>
            <div className="hidden xl:flex flex-col text-left">
              <span className="text-xs font-semibold text-zinc-200 leading-tight">
                {profile?.name || "Admin"}
              </span>
              <span className="text-[10px] text-emerald-400 leading-tight">
                Administrator
              </span>
            </div>
          </div>

          <button
            onClick={() => signOut()}
            title="Keluar dari sesi admin"
            className="p-1.5 text-zinc-400 hover:text-rose-400 hover:bg-zinc-900 rounded-lg transition-colors"
            aria-label="Logout"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
