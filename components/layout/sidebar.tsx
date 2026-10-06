"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAdminAuth } from "@/context/admin-auth-context";
import {
  LayoutDashboard,
  Users,
  ArrowLeftRight,
  Mail,
  MessageSquareText,
  LogOut,
  ShieldCheck,
  ExternalLink,
  Database,
  Menu,
  X,
} from "lucide-react";

const NAV_ITEMS = [
  {
    name: "Dashboard",
    href: "/",
    icon: LayoutDashboard,
    badge: null,
  },
  {
    name: "Pengguna",
    href: "/users",
    icon: Users,
    badge: null,
  },
  {
    name: "Transaksi & Saldo",
    href: "/transactions",
    icon: ArrowLeftRight,
    badge: null,
  },
  {
    name: "Setoran Gmail",
    href: "/deposits",
    icon: Mail,
    badge: null,
  },
  {
    name: "Tiket & Telegram",
    href: "/tickets",
    icon: MessageSquareText,
    badge: null,
  },
];

export function Sidebar({
  mobileOpen,
  setMobileOpen,
}: {
  mobileOpen?: boolean;
  setMobileOpen?: (open: boolean) => void;
}) {
  const pathname = usePathname();
  const { profile, user, signOut } = useAdminAuth();

  const adminName =
    profile?.name ||
    user?.user_metadata?.full_name ||
    user?.email?.split("@")[0] ||
    "Admin";
  const adminEmail = profile?.email || user?.email || "";

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen && setMobileOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-zinc-950/95 border-r border-zinc-800 flex flex-col justify-between transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Top Header & Brand */}
        <div>
          <div className="flex items-center justify-between h-16 px-5 border-b border-zinc-800">
            <Link
              href="/"
              className="flex items-center gap-2.5 font-bold text-zinc-100 group"
              onClick={() => setMobileOpen && setMobileOpen(false)}
            >
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-950/40">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-semibold tracking-tight text-white flex items-center gap-1.5">
                  Setor Gmail
                  <span className="text-[10px] uppercase font-bold tracking-widest bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-500/20">
                    Admin
                  </span>
                </span>
                <span className="text-[10px] text-zinc-400">admin.setorgmail.com</span>
              </div>
            </Link>

            {/* Mobile close button */}
            <button
              onClick={() => setMobileOpen && setMobileOpen(false)}
              className="lg:hidden text-zinc-400 hover:text-zinc-200 p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <div className="px-3 py-4 space-y-1">
            <div className="px-3 pb-2">
              <span className="text-[11px] font-semibold tracking-wider text-zinc-400 uppercase">
                Menu Utama
              </span>
            </div>

            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setMobileOpen && setMobileOpen(false)}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-sm"
                      : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 border border-transparent"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      className={`w-4 h-4 ${
                        isActive ? "text-emerald-400" : "text-zinc-400"
                      }`}
                    />
                    <span>{item.name}</span>
                  </div>
                  {item.badge}
                </Link>
              );
            })}
          </div>

          {/* Quick External Links */}
          <div className="px-3 py-2">
            <div className="px-3 pb-2 pt-2 border-t border-zinc-800/80">
              <span className="text-[11px] font-semibold tracking-wider text-zinc-400 uppercase">
                Tautan Cepat
              </span>
            </div>
            <a
              href="https://setorgmail.com"
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-between px-3 py-2 text-xs text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 rounded-lg transition-colors"
            >
              <span>Aplikasi Pengguna</span>
              <ExternalLink className="w-3.5 h-3.5 text-zinc-400" />
            </a>
            <a
              href="https://t.me/setorgmail_bot"
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-between px-3 py-2 text-xs text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 rounded-lg transition-colors"
            >
              <span>Bot Telegram</span>
              <ExternalLink className="w-3.5 h-3.5 text-zinc-400" />
            </a>
          </div>

          {/* Status Integrasi Real-Time */}
          <div className="px-3 py-2">
            <div className="px-3 pb-2 pt-2 border-t border-zinc-800/80 flex items-center justify-between">
              <span className="text-[11px] font-semibold tracking-wider text-zinc-400 uppercase flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                Status Integrasi
              </span>
              <span className="text-[9px] font-medium text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20 font-mono">
                Real-Time
              </span>
            </div>

            <div className="space-y-1.5 px-1 mt-1 text-[11px]">
              <div className="flex items-center justify-between p-2 rounded-lg bg-zinc-900/60 border border-zinc-800/60">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <div>
                    <p className="font-medium text-zinc-200 text-xs">Supabase DB</p>
                    <p className="text-[10px] text-zinc-500">kdjoeeehyahdgwgsfyal</p>
                  </div>
                </div>
                <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20 font-mono">
                  Ready
                </span>
              </div>

              <div className="flex items-center justify-between p-2 rounded-lg bg-zinc-900/60 border border-zinc-800/60">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <div>
                    <p className="font-medium text-zinc-200 text-xs">Bot Telegram</p>
                    <p className="text-[10px] text-zinc-500">@setorgmail_bot</p>
                  </div>
                </div>
                <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                  Aktif
                </span>
              </div>

              <div className="flex items-center justify-between p-2 rounded-lg bg-zinc-900/60 border border-zinc-800/60">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <div>
                    <p className="font-medium text-zinc-200 text-xs">Cloudflare Edge</p>
                    <p className="text-[10px] text-zinc-500">admin.setorgmail.com</p>
                  </div>
                </div>
                <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                  Live
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section: Admin Profile */}
        <div className="p-3 border-t border-zinc-800 space-y-3 bg-zinc-950">

          {/* Admin Profile */}
          <div className="flex items-center justify-between px-2 py-1.5 bg-zinc-900/40 rounded-xl">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-emerald-600/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center font-bold text-xs shrink-0">
                {adminName.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex flex-col">
                <p className="text-xs font-semibold text-zinc-200 truncate">
                  {adminName}
                </p>
                <p className="text-[10px] text-zinc-400 truncate">
                  {adminEmail}
                </p>
              </div>
            </div>
            <button
              onClick={() => signOut()}
              title="Keluar"
              className="text-zinc-400 hover:text-rose-400 p-1.5 rounded-lg hover:bg-zinc-800 transition-colors shrink-0"
              aria-label="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
