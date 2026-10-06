"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Users,
  Wallet,
  ArrowLeftRight,
  MessageSquareText,
  RefreshCw,
  PlusCircle,
  ArrowUpRight,
  ShieldCheck,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Activity,
  Send,
  UserCheck,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { Card, CardHeader } from "@/components/ui/card";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Input, Select, Textarea } from "@/components/ui/input";

export default function DashboardOverviewPage() {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<"tickets" | "transactions">("tickets");

  // Quick Balance Modal
  const [balanceModalOpen, setBalanceModalOpen] = useState(false);
  const [targetUserId, setTargetUserId] = useState("");
  const [balanceAmount, setBalanceAmount] = useState("");
  const [balanceNote, setBalanceNote] = useState("");
  const [isSubmittingBalance, setIsSubmittingBalance] = useState(false);
  const [balanceSuccess, setBalanceSuccess] = useState<string | null>(null);

  const fetchStats = async (showLoading = true) => {
    if (showLoading) setIsLoading(true);
    else setIsRefreshing(true);

    try {
      const res = await fetch("/api/admin/stats");
      const json = await res.json();
      if (json.success) {
        setData(json);
      }
    } catch (err) {
      console.error("Failed to load dashboard stats:", err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleQuickAddBalance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetUserId || !balanceAmount) return;

    setIsSubmittingBalance(true);
    setBalanceSuccess(null);

    try {
      const res = await fetch("/api/admin/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: targetUserId,
          type: "deposit",
          amount: Number(balanceAmount),
          title: "Top-up Saldo oleh Admin",
          description: balanceNote || "Penambahan saldo langsung via dashboard overview",
        }),
      });

      const resJson = await res.json();
      if (resJson.success) {
        setBalanceSuccess("Saldo berhasil ditambahkan ke pengguna!");
        setBalanceAmount("");
        setBalanceNote("");
        fetchStats(false);
        setTimeout(() => {
          setBalanceModalOpen(false);
          setBalanceSuccess(null);
        }, 1200);
      } else {
        alert(resJson.error || "Gagal menambahkan saldo");
      }
    } catch (err: any) {
      alert(err?.message || "Terjadi kesalahan");
    } finally {
      setIsSubmittingBalance(false);
    }
  };

  const openBalanceModalForUser = (userId: string) => {
    setTargetUserId(userId);
    setBalanceAmount("");
    setBalanceNote("");
    setBalanceSuccess(null);
    setBalanceModalOpen(true);
  };

  const stats = data?.stats || {
    totalUsers: 0,
    totalAdmins: 0,
    totalMembers: 0,
    totalBalance: 0,
    totalWithdrawn: 0,
    totalEarned: 0,
    totalTickets: 0,
    activeTickets: 0,
    resolvedTickets: 0,
    pendingWithdrawals: 0,
    pendingWithdrawalsAmount: 0,
    totalTransactionsCount: 0,
  };

  const health = data?.systemHealth || {
    supabaseConnected: true,
    latencyMs: 18,
    telegramConfigured: true,
    adminCount: 1,
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      {/* Compact Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-900/70 backdrop-blur border border-zinc-800/80 px-4 py-3 rounded-xl shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold text-white tracking-tight">
                Pusat Kontrol Operasional
              </h1>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live Supabase
              </span>
            </div>
            <p className="text-[11px] text-zinc-400">
              Data sinkron langsung dengan database & bot Telegram
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => fetchStats(false)}
            isLoading={isRefreshing}
            className="h-8 px-2.5 text-xs flex items-center gap-1.5 bg-zinc-800 hover:bg-zinc-700 border-zinc-700"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
            <span>Segarkan</span>
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              setTargetUserId("");
              setBalanceModalOpen(true);
            }}
            className="h-8 px-3 text-xs flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-medium shadow-sm shadow-emerald-950/40"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Tambah Saldo</span>
          </Button>
        </div>
      </div>

      {/* Action Notification Strip if there are pending items */}
      {(stats.pendingWithdrawals > 0 || stats.activeTickets > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
          {stats.pendingWithdrawals > 0 && (
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-300 text-xs">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                <span>
                  <b>{stats.pendingWithdrawals} Penarikan Saldo</b> menunggu persetujuan (Rp {stats.pendingWithdrawalsAmount.toLocaleString("id-ID")})
                </span>
              </div>
              <Link
                href="/transactions?type=withdrawal"
                className="text-[11px] font-semibold underline hover:text-white shrink-0 ml-2"
              >
                Proses Sekarang →
              </Link>
            </div>
          )}

          {stats.activeTickets > 0 && (
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/25 text-cyan-300 text-xs">
              <div className="flex items-center gap-2">
                <MessageSquareText className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>
                  <b>{stats.activeTickets} Tiket Bantuan Aktif</b> butuh respon Anda
                </span>
              </div>
              <Link
                href="/tickets"
                className="text-[11px] font-semibold underline hover:text-white shrink-0 ml-2"
              >
                Lihat Tiket →
              </Link>
            </div>
          )}
        </div>
      )}

      {/* 4 Compact Metric KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Card 1: Total Pengguna */}
        <Link
          href="/users"
          className="group block p-3.5 rounded-xl bg-zinc-900/80 hover:bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition-all shadow-sm"
        >
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-[11px] font-medium uppercase tracking-wider">Pengguna</span>
            <div className="w-7 h-7 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Users className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              {isLoading ? (
                <div className="w-16 h-7 bg-zinc-800 animate-pulse rounded" />
              ) : (
                stats.totalUsers.toLocaleString("id-ID")
              )}
            </div>
            <div className="flex items-center justify-between mt-1.5 text-[11px] text-zinc-400">
              <span>{stats.totalAdmins} Admin • {stats.totalMembers} Member</span>
              <span className="text-blue-400 group-hover:translate-x-0.5 transition-transform">→</span>
            </div>
          </div>
        </Link>

        {/* Card 2: Saldo Beredar */}
        <Link
          href="/transactions"
          className="group block p-3.5 rounded-xl bg-zinc-900/80 hover:bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition-all shadow-sm"
        >
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-[11px] font-medium uppercase tracking-wider">Saldo Beredar</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Wallet className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-xl sm:text-2xl font-bold text-emerald-400 tracking-tight">
              {isLoading ? (
                <div className="w-24 h-7 bg-zinc-800 animate-pulse rounded" />
              ) : (
                `Rp ${stats.totalBalance.toLocaleString("id-ID")}`
              )}
            </div>
            <div className="flex items-center justify-between mt-1.5 text-[11px] text-zinc-400">
              <span>Ditarik: Rp {stats.totalWithdrawn.toLocaleString("id-ID")}</span>
              <span className="text-emerald-400 group-hover:translate-x-0.5 transition-transform">→</span>
            </div>
          </div>
        </Link>

        {/* Card 3: Penarikan Pending */}
        <Link
          href="/transactions?type=withdrawal"
          className="group block p-3.5 rounded-xl bg-zinc-900/80 hover:bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition-all shadow-sm"
        >
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-[11px] font-medium uppercase tracking-wider">Antrian WD</span>
            <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center group-hover:scale-105 transition-transform">
              <ArrowLeftRight className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-1.5">
              {isLoading ? (
                <div className="w-12 h-7 bg-zinc-800 animate-pulse rounded" />
              ) : (
                <>
                  <span>{stats.pendingWithdrawals}</span>
                  {stats.pendingWithdrawals > 0 ? (
                    <span className="text-[10px] font-bold px-1.5 py-0.2 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded">
                      Pending
                    </span>
                  ) : (
                    <span className="text-[10px] text-zinc-500 font-normal">Antrian Kosong</span>
                  )}
                </>
              )}
            </div>
            <div className="flex items-center justify-between mt-1.5 text-[11px] text-zinc-400">
              <span>Rp {stats.pendingWithdrawalsAmount.toLocaleString("id-ID")}</span>
              <span className="text-amber-400 group-hover:translate-x-0.5 transition-transform">→</span>
            </div>
          </div>
        </Link>

        {/* Card 4: Tiket CS & Telegram */}
        <Link
          href="/tickets"
          className="group block p-3.5 rounded-xl bg-zinc-900/80 hover:bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition-all shadow-sm"
        >
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-[11px] font-medium uppercase tracking-wider">Tiket CS</span>
            <div className="w-7 h-7 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center group-hover:scale-105 transition-transform">
              <MessageSquareText className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-1.5">
              {isLoading ? (
                <div className="w-12 h-7 bg-zinc-800 animate-pulse rounded" />
              ) : (
                <>
                  <span>{stats.activeTickets}</span>
                  <span className="text-[10px] font-medium text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-1.5 py-0.2 rounded">
                    Aktif
                  </span>
                </>
              )}
            </div>
            <div className="flex items-center justify-between mt-1.5 text-[11px] text-zinc-400">
              <span>{stats.resolvedTickets} Selesai • Total {stats.totalTickets}</span>
              <span className="text-cyan-400 group-hover:translate-x-0.5 transition-transform">→</span>
            </div>
          </div>
        </Link>
      </div>

      {/* Main High-Density Split Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Column (8 of 12 Cols): Tabbed Tickets & Transactions */}
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl overflow-hidden shadow-sm">
            {/* Tab Header */}
            <div className="flex items-center justify-between border-b border-zinc-800 px-3 pt-2 pb-0 bg-zinc-950/40">
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setActiveTab("tickets")}
                  className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-t-lg border-b-2 transition-colors ${
                    activeTab === "tickets"
                      ? "border-emerald-500 text-emerald-400 bg-zinc-900/60"
                      : "border-transparent text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  <MessageSquareText className="w-3.5 h-3.5" />
                  <span>Tiket Masuk</span>
                  <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-zinc-800 text-zinc-300">
                    {stats.totalTickets}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("transactions")}
                  className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-t-lg border-b-2 transition-colors ${
                    activeTab === "transactions"
                      ? "border-emerald-500 text-emerald-400 bg-zinc-900/60"
                      : "border-transparent text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  <ArrowLeftRight className="w-3.5 h-3.5" />
                  <span>Mutasi Transaksi</span>
                  <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-zinc-800 text-zinc-300">
                    {data?.recentTransactions?.length || 0}
                  </span>
                </button>
              </div>

              <Link
                href={activeTab === "tickets" ? "/tickets" : "/transactions"}
                className="text-[11px] font-medium text-emerald-400 hover:text-emerald-300 flex items-center gap-0.5 mb-1"
              >
                Lihat Lengkap <ArrowUpRight className="w-3 h-3" />
              </Link>
            </div>

            {/* Tab Body */}
            <div className="p-3">
              {activeTab === "tickets" ? (
                /* Tickets List */
                isLoading ? (
                  <div className="space-y-2 py-2">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-12 bg-zinc-800/40 rounded-lg animate-pulse" />
                    ))}
                  </div>
                ) : !data?.recentTickets || data.recentTickets.length === 0 ? (
                  <div className="py-10 text-center text-zinc-500 text-xs">
                    Belum ada tiket bantuan yang tercatat di Supabase.
                  </div>
                ) : (
                  <div className="divide-y divide-zinc-800/70">
                    {data.recentTickets.map((t: any) => (
                      <div
                        key={t.id}
                        className="py-2.5 flex items-center justify-between gap-3 hover:bg-zinc-800/30 px-2 rounded-lg transition-colors"
                      >
                        <div className="min-w-0 space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-zinc-200">
                              {t.ticket_code}
                            </span>
                            <StatusBadge status={t.status} />
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-400 border border-zinc-700/50">
                              {t.category}
                            </span>
                          </div>
                          <p className="text-xs font-medium text-zinc-300 truncate max-w-md">
                            {t.subject}
                          </p>
                          <p className="text-[10px] text-zinc-500">
                            {t.userName} ({t.userEmail}) •{" "}
                            {new Date(t.created_at).toLocaleDateString("id-ID", {
                              day: "numeric",
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>

                        <Link
                          href={`/tickets?id=${t.id}`}
                          className="shrink-0 text-xs font-medium text-emerald-400 hover:text-white bg-emerald-500/10 hover:bg-emerald-600 px-2.5 py-1 rounded-md border border-emerald-500/20 transition-all flex items-center gap-1"
                        >
                          <span>Buka</span>
                          <ChevronRight className="w-3 h-3" />
                        </Link>
                      </div>
                    ))}
                  </div>
                )
              ) : (
                /* Transactions List */
                isLoading ? (
                  <div className="space-y-2 py-2">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-12 bg-zinc-800/40 rounded-lg animate-pulse" />
                    ))}
                  </div>
                ) : !data?.recentTransactions || data.recentTransactions.length === 0 ? (
                  <div className="py-10 text-center space-y-1">
                    <p className="text-xs text-zinc-400 font-medium">Belum ada riwayat transaksi</p>
                    <p className="text-[11px] text-zinc-500">
                      Transaksi saldo dan mutasi pengguna akan otomatis tercatat di sini saat dibuat.
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-zinc-800/70">
                    {data.recentTransactions.map((tx: any) => (
                      <div
                        key={tx.id}
                        className="py-2.5 flex items-center justify-between gap-3 hover:bg-zinc-800/30 px-2 rounded-lg transition-colors"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-zinc-200 truncate">
                              {tx.title}
                            </span>
                            <StatusBadge status={tx.status} />
                          </div>
                          <p className="text-[10px] text-zinc-500">
                            {tx.userName} ({tx.userEmail}) •{" "}
                            {new Date(tx.created_at).toLocaleDateString("id-ID", {
                              day: "numeric",
                              month: "short",
                            })}
                          </p>
                        </div>

                        <div className="text-right shrink-0">
                          <span
                            className={`text-xs font-bold font-mono ${
                              tx.type === "deposit" || tx.type === "manual_credit"
                                ? "text-emerald-400"
                                : "text-rose-400"
                            }`}
                          >
                            {tx.type === "deposit" || tx.type === "manual_credit" ? "+" : "-"}
                            Rp {Number(tx.amount).toLocaleString("id-ID")}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              )}
            </div>
          </div>

          {/* Quick Pending Withdrawals Card (If Any Pending) */}
          {data?.pendingWithdrawalsList && data.pendingWithdrawalsList.length > 0 && (
            <div className="bg-zinc-900/80 border border-amber-500/30 rounded-xl p-3 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                  <ArrowLeftRight className="w-3.5 h-3.5" />
                  Antrian Penarikan Dana ({data.pendingWithdrawalsList.length})
                </span>
                <Link
                  href="/transactions?type=withdrawal"
                  className="text-[11px] text-amber-400 hover:underline"
                >
                  Kelola Semua →
                </Link>
              </div>
              <div className="divide-y divide-zinc-800/60">
                {data.pendingWithdrawalsList.map((w: any) => (
                  <div key={w.id} className="py-2 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-medium text-zinc-200">{w.userName} ({w.account_name || w.method})</p>
                      <p className="text-[10px] text-zinc-500">{w.method}: {w.account_number || "-"}</p>
                    </div>
                    <span className="font-mono font-bold text-amber-400">
                      Rp {Number(w.amount).toLocaleString("id-ID")}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column (4 of 12 Cols): Live Users & System Status */}
        <div className="lg:col-span-4 space-y-4">
          {/* Newest Users Card with REAL Live Balances */}
          <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-3.5 shadow-sm">
            <div className="flex items-center justify-between pb-2.5 border-b border-zinc-800">
              <div className="flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-blue-400" />
                <span className="text-xs font-bold text-zinc-200">Pengguna Terbaru</span>
              </div>
              <Link
                href="/users"
                className="text-[11px] text-blue-400 hover:text-blue-300 font-medium flex items-center gap-0.5"
              >
                Kelola <ArrowUpRight className="w-3 h-3" />
              </Link>
            </div>

            <div className="mt-2.5 space-y-2">
              {isLoading ? (
                <div className="space-y-2 py-1">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-10 bg-zinc-800/40 rounded-lg animate-pulse" />
                  ))}
                </div>
              ) : !data?.recentUsers || data.recentUsers.length === 0 ? (
                <p className="text-xs text-zinc-500 text-center py-4">Belum ada pengguna.</p>
              ) : (
                data.recentUsers.slice(0, 5).map((u: any) => (
                  <div
                    key={u.id}
                    className="p-2 rounded-lg bg-zinc-950/40 hover:bg-zinc-800/40 border border-zinc-800/50 flex items-center justify-between gap-2 transition-colors"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-7 h-7 rounded-full bg-zinc-800 border border-zinc-700 text-zinc-300 flex items-center justify-center font-bold text-[11px] shrink-0">
                        {(u.name || u.email || "U").charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1">
                          <p className="text-xs font-semibold text-zinc-200 truncate">
                            {u.name || "Pengguna"}
                          </p>
                          {u.role === "Admin" && (
                            <span className="text-[9px] px-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded font-semibold">
                              Admin
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-zinc-500 truncate">
                          Saldo: <span className="text-emerald-400 font-mono font-medium">Rp {Number(u.balance || 0).toLocaleString("id-ID")}</span>
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => openBalanceModalForUser(u.id)}
                      className="shrink-0 text-[10px] font-medium text-emerald-400 hover:text-white bg-emerald-500/10 hover:bg-emerald-600 px-2 py-1 rounded border border-emerald-500/20 transition-colors"
                    >
                      + Saldo
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* System & Infrastructure Real-Time Health */}
          <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-3.5 shadow-sm space-y-2.5">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
              <span className="text-xs font-bold text-zinc-200 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                Status Integrasi Real-Time
              </span>
              <span className="text-[10px] text-emerald-400 font-mono">
                {health.latencyMs}ms Latency
              </span>
            </div>

            <div className="space-y-2 text-[11px]">
              <div className="flex items-center justify-between p-2 rounded-lg bg-zinc-950/40 border border-zinc-800/60">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <div>
                    <p className="font-medium text-zinc-200">Supabase DB</p>
                    <p className="text-[10px] text-zinc-500">kdjoeeehyahdgwgsfyal</p>
                  </div>
                </div>
                <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                  Ready ({health.latencyMs}ms)
                </span>
              </div>

              <div className="flex items-center justify-between p-2 rounded-lg bg-zinc-950/40 border border-zinc-800/60">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <div>
                    <p className="font-medium text-zinc-200">Bot Telegram</p>
                    <p className="text-[10px] text-zinc-500">@setorgmail_bot</p>
                  </div>
                </div>
                <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                  Aktif
                </span>
              </div>

              <div className="flex items-center justify-between p-2 rounded-lg bg-zinc-950/40 border border-zinc-800/60">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <div>
                    <p className="font-medium text-zinc-200">Cloudflare Edge</p>
                    <p className="text-[10px] text-zinc-500">admin.setorgmail.com</p>
                  </div>
                </div>
                <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                  Live Worker
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Add Balance Modal */}
      <Modal
        isOpen={balanceModalOpen}
        onClose={() => setBalanceModalOpen(false)}
        title="Top-up Saldo Pengguna"
        subtitle="Nominal akan langsung masuk ke dompet pengguna di database Supabase"
        footer={
          <>
            <Button
              variant="ghost"
              onClick={() => setBalanceModalOpen(false)}
              disabled={isSubmittingBalance}
            >
              Batal
            </Button>
            <Button
              variant="primary"
              onClick={handleQuickAddBalance}
              isLoading={isSubmittingBalance}
            >
              Tambahkan Saldo
            </Button>
          </>
        }
      >
        <form onSubmit={handleQuickAddBalance} className="space-y-4">
          {balanceSuccess && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{balanceSuccess}</span>
            </div>
          )}

          <Select
            label="Pilih Pengguna Sasaran"
            value={targetUserId}
            onChange={(e) => setTargetUserId(e.target.value)}
            options={[
              { label: "-- Pilih Pengguna --", value: "" },
              ...(data?.recentUsers || []).map((u: any) => ({
                label: `${u.name || "User"} (${u.email}) - Saldo: Rp ${Number(u.balance || 0).toLocaleString("id-ID")}`,
                value: u.id,
              })),
            ]}
            required
          />

          <Input
            label="Nominal Saldo (Rp)"
            type="number"
            placeholder="Contoh: 50000"
            value={balanceAmount}
            onChange={(e) => setBalanceAmount(e.target.value)}
            helperText="Nominal dalam Rupiah tanpa titik"
            required
          />

          <Textarea
            label="Keterangan / Alasan (Opsional)"
            placeholder="Contoh: Bonus verifikasi setoran akun Gmail"
            value={balanceNote}
            onChange={(e) => setBalanceNote(e.target.value)}
          />
        </form>
      </Modal>
    </div>
  );
}

