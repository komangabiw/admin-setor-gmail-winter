"use client";

import React, { useEffect, useState } from "react";
import { useAdminAuth } from "@/context/admin-auth-context";
import Link from "next/link";
import {
  LogOut,
  ShieldCheck,
} from "lucide-react";

export function Header() {
  const { profile, user, signOut } = useAdminAuth();

  const [integrations, setIntegrations] = useState<{
    supabase: { status: string; latency?: number; project?: string };
    telegram: { status: string; latency?: number; username?: string };
    cloudflare: { status: string; latency?: number; host?: string };
  }>({
    supabase: { status: "Live", latency: 25, project: "kdjoeeehyahdgwgsfyal" },
    telegram: { status: "Live", latency: 85, username: "@setorgmail_bot" },
    cloudflare: { status: "Live", latency: 5, host: "admin.setorgmail.com" },
  });

  useEffect(() => {
    let isMounted = true;
    const fetchStatus = async () => {
      try {
        const res = await fetch("/api/admin/integrations-status");
        const data = await res.json();
        if (data?.success && data?.integrations && isMounted) {
          setIntegrations(data.integrations);
        }
      } catch (e) {
        console.error("Failed to check integrations status", e);
      }
    };
    fetchStatus();
    const interval = setInterval(fetchStatus, 30000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <header className="sticky top-0 z-30 bg-zinc-950/90 backdrop-blur-md border-b border-zinc-800/80">
      <div className="flex items-center justify-between h-16 px-4 sm:px-6 gap-3 sm:gap-4">
        {/* Left side: Brand Logo */}
        <Link
          href="/"
          className="flex items-center gap-2.5 font-bold text-zinc-100 group shrink-0"
        >
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-950/40">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold tracking-tight text-white flex items-center gap-1.5">
              Setor Gmail by Winter
              <span className="text-[10px] uppercase font-bold tracking-widest bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-500/20">
                Admin
              </span>
            </span>
            <span className="text-[10px] text-zinc-400">admin.setorgmail.com</span>
          </div>
        </Link>

        {/* Right side: Integrations & Profile */}
        <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
          {/* Status Integrasi Pills */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Supabase DB */}
            <div className="flex items-center gap-1.5 sm:gap-2 px-2.5 py-1 rounded-lg bg-zinc-900/60 border border-zinc-800/80 hover:border-zinc-700 transition-colors text-[11px]">
              <span
                className={`w-2 h-2 rounded-full shrink-0 ${
                  integrations.supabase.status === "Live"
                    ? "bg-emerald-500 animate-pulse"
                    : "bg-rose-500"
                }`}
              />
              <span className="font-medium text-zinc-200">Supabase DB</span>
              <span className="text-[10px] text-zinc-500 font-mono hidden sm:inline">
                {integrations.supabase.latency ? `${integrations.supabase.latency}ms` : ""}
              </span>
              <span
                className={`text-[9px] font-semibold px-1 py-0.2 rounded border font-mono ${
                  integrations.supabase.status === "Live"
                    ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
                    : "text-rose-400 bg-rose-500/10 border-rose-500/20"
                }`}
              >
                {integrations.supabase.status}
              </span>
            </div>

            {/* Bot Telegram */}
            <div className="flex items-center gap-1.5 sm:gap-2 px-2.5 py-1 rounded-lg bg-zinc-900/60 border border-zinc-800/80 hover:border-zinc-700 transition-colors text-[11px]">
              <span
                className={`w-2 h-2 rounded-full shrink-0 ${
                  integrations.telegram.status === "Live"
                    ? "bg-emerald-500 animate-pulse"
                    : "bg-rose-500"
                }`}
              />
              <span className="font-medium text-zinc-200">Bot Telegram</span>
              <span className="text-[10px] text-zinc-500 font-mono hidden sm:inline">
                {integrations.telegram.latency ? `${integrations.telegram.latency}ms` : ""}
              </span>
              <span
                className={`text-[9px] font-semibold px-1 py-0.2 rounded border font-mono ${
                  integrations.telegram.status === "Live"
                    ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
                    : "text-rose-400 bg-rose-500/10 border-rose-500/20"
                }`}
              >
                {integrations.telegram.status}
              </span>
            </div>

            {/* Cloudflare Edge */}
            <div className="flex items-center gap-1.5 sm:gap-2 px-2.5 py-1 rounded-lg bg-zinc-900/60 border border-zinc-800/80 hover:border-zinc-700 transition-colors text-[11px]">
              <span
                className={`w-2 h-2 rounded-full shrink-0 ${
                  integrations.cloudflare.status === "Live"
                    ? "bg-emerald-500 animate-pulse"
                    : "bg-rose-500"
                }`}
              />
              <span className="font-medium text-zinc-200">Cloudflare Edge</span>
              <span className="text-[10px] text-zinc-500 font-mono hidden sm:inline">
                {integrations.cloudflare.latency ? `${integrations.cloudflare.latency}ms` : ""}
              </span>
              <span
                className={`text-[9px] font-semibold px-1 py-0.2 rounded border font-mono ${
                  integrations.cloudflare.status === "Live"
                    ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
                    : "text-rose-400 bg-rose-500/10 border-rose-500/20"
                }`}
              >
                {integrations.cloudflare.status}
              </span>
            </div>
          </div>

          {/* Profile Pill & Logout (Nama & Email di sebelah kiri tombol logout) */}
          <div className="flex items-center gap-2.5 pl-2 border-l border-zinc-800">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center font-bold text-xs shadow-sm shrink-0">
                {(profile?.name || user?.email || "A").charAt(0).toUpperCase()}
              </div>
              <div className="flex flex-col text-left max-w-[120px] sm:max-w-[200px]">
                <span className="text-xs font-semibold text-zinc-200 leading-tight truncate">
                  {profile?.name || "Admin"}
                </span>
                <span className="text-[10px] text-zinc-400 leading-tight truncate">
                  {user?.email || profile?.email || "admin@setorgmail.com"}
                </span>
              </div>
            </div>

            <button
              onClick={() => signOut()}
              title="Keluar dari sesi admin"
              className="p-1.5 text-zinc-400 hover:text-rose-400 hover:bg-zinc-900 rounded-lg transition-colors shrink-0"
              aria-label="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
