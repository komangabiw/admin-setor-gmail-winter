"use client";

import React, { useEffect, useState } from "react";
import { ShieldCheck, ExternalLink, Bot, Server, Globe } from "lucide-react";

export function BottomBar() {
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
    <footer className="fixed bottom-0 inset-x-0 z-40 bg-zinc-950/90 backdrop-blur-md border-t border-zinc-800/90 shadow-2xl transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex items-center justify-between gap-4 overflow-x-auto">
        {/* Status Integrasi Section */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-900/90 border border-zinc-800 text-[11px] font-semibold text-zinc-300">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Status Integrasi</span>
            <span className="text-[9px] font-mono text-emerald-400 bg-emerald-500/10 px-1 py-0.2 rounded border border-emerald-500/20">
              Live
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Supabase DB */}
            <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-zinc-900/60 border border-zinc-800/80 hover:border-zinc-700 transition-colors text-[11px]">
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
            <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-zinc-900/60 border border-zinc-800/80 hover:border-zinc-700 transition-colors text-[11px]">
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
            <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-zinc-900/60 border border-zinc-800/80 hover:border-zinc-700 transition-colors text-[11px]">
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
        </div>

        {/* Tautan Cepat Section */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[11px] font-semibold tracking-wider text-zinc-500 uppercase hidden lg:inline">
            Tautan Cepat:
          </span>
          <a
            href="https://setorgmail.com"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900/80 border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800/80 text-xs text-zinc-300 hover:text-white transition-colors"
          >
            <span>Aplikasi Pengguna</span>
            <ExternalLink className="w-3.5 h-3.5 text-zinc-400" />
          </a>
          <a
            href="https://t.me/setorgmail_bot"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900/80 border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800/80 text-xs text-zinc-300 hover:text-white transition-colors"
          >
            <span>Bot Telegram</span>
            <ExternalLink className="w-3.5 h-3.5 text-zinc-400" />
          </a>
        </div>
      </div>
    </footer>
  );
}
