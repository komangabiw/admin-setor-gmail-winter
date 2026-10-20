"use client";

import React, { useEffect, useState } from "react";
import {
  Users,
  Wallet,
  ArrowLeftRight,
  MessageSquareText,
  RefreshCw,
  PlusCircle,
  ShieldCheck,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Activity,
  Check,
  X,
  Copy,
  ChevronRight,
  UserCheck,
  Search,
} from "lucide-react";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Input, Select, Textarea } from "@/components/ui/input";
import { LineChart9 } from "@/components/ui/demo";

export default function DashboardOverviewPage() {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<"tickets" | "transactions" | "withdrawals" | "users">("tickets");

  // Quick Balance Modal
  const [balanceModalOpen, setBalanceModalOpen] = useState(false);
  const [targetUserId, setTargetUserId] = useState("");
  const [balanceAmount, setBalanceAmount] = useState("");
  const [balanceNote, setBalanceNote] = useState("");
  const [isSubmittingBalance, setIsSubmittingBalance] = useState(false);
  const [balanceSuccess, setBalanceSuccess] = useState<string | null>(null);

  // Withdrawal processing state
  const [isProcessingWd, setIsProcessingWd] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Ticket Detail & Status Modal
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [ticketStatusUpdate, setTicketStatusUpdate] = useState("");
  const [isUpdatingTicket, setIsUpdatingTicket] = useState(false);

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

  const scrollToTabs = () => {
    document.getElementById("dashboard-tabs-section")?.scrollIntoView({ behavior: "smooth" });
  };

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
          description: balanceNote || "Penambahan saldo langsung via Dashboard Utama",
        }),
      });

      const resJson = await res.json();
      if (resJson.success) {
        setBalanceSuccess("Saldo berhasil ditambahkan ke dompet pengguna!");
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

  const handleUpdateWithdrawal = async (id: string, newStatus: "success" | "rejected") => {
    setIsProcessingWd(id);
    try {
      const res = await fetch("/api/admin/transactions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          sourceTable: "withdrawals",
          newStatus,
          adminNote: newStatus === "success" ? "Disetujui via Dashboard" : "Ditolak via Dashboard",
        }),
      });

      const json = await res.json();
      if (json.success) {
        fetchStats(false);
      } else {
        alert(json.error || "Gagal memperbarui status penarikan");
      }
    } catch (err: any) {
      alert(err?.message || "Terjadi kesalahan");
    } finally {
      setIsProcessingWd(null);
    }
  };

  const handleUpdateTicketStatus = async (newStatus: string) => {
    if (!selectedTicket) return;
    setIsUpdatingTicket(true);
    try {
      const res = await fetch("/api/admin/tickets", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ticketId: selectedTicket.id,
          status: newStatus,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setSelectedTicket(null);
        fetchStats(false);
      } else {
        alert(json.error || "Gagal memperbarui tiket");
      }
    } catch (err: any) {
      alert(err?.message || "Terjadi kesalahan");
    } finally {
      setIsUpdatingTicket(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1500);
    }
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

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-10">
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
              Semua kontrol aktivitas, saldo, penarikan, tiket, dan pengguna dalam 1 dashboard
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              setTargetUserId("");
              setBalanceAmount("");
              setBalanceNote("");
              setBalanceSuccess(null);
              setBalanceModalOpen(true);
            }}
            className="h-8 px-3 text-xs flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Top-up Saldo</span>
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => fetchStats(false)}
            isLoading={isRefreshing}
            className="h-8 px-2.5 text-xs flex items-center gap-1.5 bg-zinc-800 hover:bg-zinc-700 border-zinc-700"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </Button>
        </div>
      </div>

      {/* Action Notification Strip if there are pending withdrawals */}
      {stats.pendingWithdrawals > 0 && (
        <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-300 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              <b>{stats.pendingWithdrawals} Penarikan Saldo</b> menunggu persetujuan (Rp {stats.pendingWithdrawalsAmount.toLocaleString("id-ID")})
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              setActiveTab("withdrawals");
              scrollToTabs();
            }}
            className="text-[11px] font-semibold underline hover:text-white shrink-0 ml-2 cursor-pointer"
          >
            Proses Sekarang →
          </button>
        </div>
      )}

      {/* 4 Compact Metric KPI Cards (Click to switch active tab) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Card 1: Total Pengguna */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => {
            setActiveTab("users");
            scrollToTabs();
          }}
          className={`group block p-3.5 rounded-xl border transition-all shadow-sm cursor-pointer text-left ${
            activeTab === "users"
              ? "bg-zinc-900 border-blue-500/40 ring-1 ring-blue-500/30"
              : "bg-zinc-900/80 hover:bg-zinc-900 border-zinc-800 hover:border-zinc-700"
          }`}
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
              <span className="text-blue-400 group-hover:translate-x-0.5 transition-transform">Lihat ↓</span>
            </div>
          </div>
        </div>

        {/* Card 2: Saldo Beredar */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => {
            setActiveTab("transactions");
            scrollToTabs();
          }}
          className={`group block p-3.5 rounded-xl border transition-all shadow-sm cursor-pointer text-left ${
            activeTab === "transactions"
              ? "bg-zinc-900 border-emerald-500/40 ring-1 ring-emerald-500/30"
              : "bg-zinc-900/80 hover:bg-zinc-900 border-zinc-800 hover:border-zinc-700"
          }`}
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
              <span className="text-emerald-400 group-hover:translate-x-0.5 transition-transform">Mutasi ↓</span>
            </div>
          </div>
        </div>

        {/* Card 3: Penarikan Pending */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => {
            setActiveTab("withdrawals");
            scrollToTabs();
          }}
          className={`group block p-3.5 rounded-xl border transition-all shadow-sm cursor-pointer text-left ${
            activeTab === "withdrawals"
              ? "bg-zinc-900 border-amber-500/40 ring-1 ring-amber-500/30"
              : "bg-zinc-900/80 hover:bg-zinc-900 border-zinc-800 hover:border-zinc-700"
          }`}
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
                    <span className="text-[10px] text-zinc-500 font-normal">Kosong</span>
                  )}
                </>
              )}
            </div>
            <div className="flex items-center justify-between mt-1.5 text-[11px] text-zinc-400">
              <span>Rp {stats.pendingWithdrawalsAmount.toLocaleString("id-ID")}</span>
              <span className="text-amber-400 group-hover:translate-x-0.5 transition-transform">Proses ↓</span>
            </div>
          </div>
        </div>

        {/* Card 4: Tiket CS */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => {
            setActiveTab("tickets");
            scrollToTabs();
          }}
          className={`group block p-3.5 rounded-xl border transition-all shadow-sm cursor-pointer text-left ${
            activeTab === "tickets"
              ? "bg-zinc-900 border-cyan-500/40 ring-1 ring-cyan-500/30"
              : "bg-zinc-900/80 hover:bg-zinc-900 border-zinc-800 hover:border-zinc-700"
          }`}
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
              <span className="text-cyan-400 group-hover:translate-x-0.5 transition-transform">Buka ↓</span>
            </div>
          </div>
        </div>
      </div>

      {/* Revenue & Balance Flow Line Chart */}
      <LineChart9 />

      {/* Main Full-Width Section (Unified Dashboard Tabs) */}
      <div id="dashboard-tabs-section" className="space-y-4">
        <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl overflow-hidden shadow-sm">
          {/* Tab Header */}
          <div className="flex items-center justify-between border-b border-zinc-800 px-3 pt-2 pb-0 bg-zinc-950/40 overflow-x-auto">
            <div className="flex items-center gap-1">
              {/* Tab 1: Tiket */}
              <button
                type="button"
                onClick={() => setActiveTab("tickets")}
                className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-t-lg border-b-2 transition-colors cursor-pointer ${
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

              {/* Tab 2: Mutasi Transaksi */}
              <button
                type="button"
                onClick={() => setActiveTab("transactions")}
                className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-t-lg border-b-2 transition-colors cursor-pointer ${
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

              {/* Tab 3: Antrian WD */}
              <button
                type="button"
                onClick={() => setActiveTab("withdrawals")}
                className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-t-lg border-b-2 transition-colors cursor-pointer ${
                  activeTab === "withdrawals"
                    ? "border-amber-500 text-amber-400 bg-zinc-900/60"
                    : "border-transparent text-zinc-400 hover:text-zinc-200"
                }`}
              >
                <Wallet className="w-3.5 h-3.5" />
                <span>Antrian WD</span>
                {stats.pendingWithdrawals > 0 ? (
                  <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500/20 text-amber-400 font-bold border border-amber-500/30">
                    {stats.pendingWithdrawals}
                  </span>
                ) : (
                  <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-zinc-800 text-zinc-400">
                    0
                  </span>
                )}
              </button>

              {/* Tab 4: Pengguna */}
              <button
                type="button"
                onClick={() => setActiveTab("users")}
                className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-t-lg border-b-2 transition-colors cursor-pointer ${
                  activeTab === "users"
                    ? "border-blue-500 text-blue-400 bg-zinc-900/60"
                    : "border-transparent text-zinc-400 hover:text-zinc-200"
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Daftar Pengguna</span>
                <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-zinc-800 text-zinc-300">
                  {stats.totalUsers}
                </span>
              </button>
            </div>
          </div>

          {/* Tab Body */}
          <div className="p-3">
            {/* 1. Tab Tiket Masuk */}
            {activeTab === "tickets" && (
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

                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => {
                          setSelectedTicket(t);
                          setTicketStatusUpdate(t.status);
                        }}
                        className="shrink-0 text-xs font-medium h-7 px-2.5 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-600 hover:text-white border border-emerald-500/20 transition-all flex items-center gap-1"
                      >
                        <span>Kelola</span>
                        <ChevronRight className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )
            )}

            {/* 2. Tab Mutasi Transaksi */}
            {activeTab === "transactions" && (
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
                            hour: "2-digit",
                            minute: "2-digit",
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

            {/* 3. Tab Antrian Penarikan (WD) */}
            {activeTab === "withdrawals" && (
              !data?.pendingWithdrawalsList || data.pendingWithdrawalsList.length === 0 ? (
                <div className="py-12 text-center space-y-2">
                  <div className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/20">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <p className="text-xs text-zinc-300 font-semibold">Semua Penarikan Telah Diproses</p>
                  <p className="text-[11px] text-zinc-500 max-w-sm mx-auto">
                    Saat ini tidak ada antrian penarikan saldo pengguna yang pending.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-zinc-800/70">
                  {data.pendingWithdrawalsList.map((w: any) => (
                    <div
                      key={w.id}
                      className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-2 rounded-lg hover:bg-zinc-800/20 transition-colors"
                    >
                      <div className="min-w-0 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white">
                            {w.userName}
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-semibold">
                            Pending
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-300">
                          <span className="font-semibold text-emerald-400">
                            {w.method?.toUpperCase()}
                          </span>
                          <span>•</span>
                          <span>A/N: <b>{w.account_name || "-"}</b></span>
                          <span>•</span>
                          <span className="flex items-center gap-1 font-mono text-zinc-200 bg-zinc-800/80 px-2 py-0.5 rounded border border-zinc-700/60">
                            {w.account_number || "-"}
                            <button
                              type="button"
                              onClick={() => copyToClipboard(w.account_number || "", w.id)}
                              className="text-zinc-400 hover:text-white p-0.5"
                              title="Salin Nomor Akun"
                            >
                              {copiedId === w.id ? (
                                <Check className="w-3 h-3 text-emerald-400" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          </span>
                        </div>
                        <p className="text-[10px] text-zinc-500">
                          Diajukan: {new Date(w.created_at).toLocaleDateString("id-ID", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>

                      <div className="flex items-center gap-3 self-end sm:self-center shrink-0">
                        <span className="text-sm font-bold font-mono text-amber-400 sm:text-right mr-1">
                          Rp {Number(w.amount).toLocaleString("id-ID")}
                        </span>

                        <Button
                          size="sm"
                          variant="danger"
                          disabled={isProcessingWd === w.id}
                          onClick={() => {
                            if (confirm(`Yakin tolak penarikan Rp ${Number(w.amount).toLocaleString("id-ID")} untuk ${w.userName}?`)) {
                              handleUpdateWithdrawal(w.id, "rejected");
                            }
                          }}
                          className="h-8 px-2.5 text-xs bg-rose-600/20 hover:bg-rose-600 text-rose-400 hover:text-white border border-rose-500/30"
                        >
                          <X className="w-3.5 h-3.5 mr-1" />
                          Tolak
                        </Button>

                        <Button
                          size="sm"
                          variant="primary"
                          isLoading={isProcessingWd === w.id}
                          onClick={() => {
                            if (confirm(`Setujui dan konfirmasi transfer penarikan Rp ${Number(w.amount).toLocaleString("id-ID")} ke ${w.account_name} (${w.account_number})?`)) {
                              handleUpdateWithdrawal(w.id, "success");
                            }
                          }}
                          className="h-8 px-3 text-xs bg-emerald-600 hover:bg-emerald-500 text-white"
                        >
                          <Check className="w-3.5 h-3.5 mr-1" />
                          Setujui
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}

            {/* 4. Tab Daftar Pengguna */}
            {activeTab === "users" && (
              !data?.recentUsers || data.recentUsers.length === 0 ? (
                <div className="py-10 text-center text-zinc-500 text-xs">
                  Tidak ada data pengguna.
                </div>
              ) : (
                <div className="divide-y divide-zinc-800/70">
                  {data.recentUsers.map((u: any) => (
                    <div
                      key={u.id}
                      className="py-2.5 flex items-center justify-between gap-3 hover:bg-zinc-800/30 px-2 rounded-lg transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 text-zinc-300 flex items-center justify-center font-bold text-xs shrink-0">
                          {u.name?.charAt(0)?.toUpperCase() || "U"}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-zinc-100 truncate">
                              {u.name}
                            </span>
                            <span className={`text-[10px] px-1.5 py-0.2 rounded font-medium ${
                              (u.role || "").toLowerCase() === "admin"
                                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                                : "bg-zinc-800 text-zinc-400 border border-zinc-700/60"
                            }`}>
                              {u.role || "Member"}
                            </span>
                          </div>
                          <p className="text-[10px] text-zinc-400 truncate">
                            {u.email}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 shrink-0">
                        <div className="text-right">
                          <p className="text-xs font-bold font-mono text-emerald-400">
                            Rp {Number(u.balance || 0).toLocaleString("id-ID")}
                          </p>
                          <p className="text-[10px] text-zinc-500">
                            WD: Rp {Number(u.total_withdrawn || 0).toLocaleString("id-ID")}
                          </p>
                        </div>

                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => openBalanceModalForUser(u.id)}
                          className="h-7 px-2.5 text-xs bg-zinc-800 hover:bg-emerald-600 hover:text-white border-zinc-700 transition-colors"
                        >
                          <PlusCircle className="w-3 h-3 mr-1" />
                          Isi Saldo
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}
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

      {/* Quick Ticket Detail Modal */}
      {selectedTicket && (
        <Modal
          isOpen={!!selectedTicket}
          onClose={() => setSelectedTicket(null)}
          title={`Detail Tiket: ${selectedTicket.ticket_code}`}
          subtitle={`Kategori: ${selectedTicket.category} • Dibuat oleh ${selectedTicket.userName}`}
          footer={
            <>
              <Button
                variant="ghost"
                onClick={() => setSelectedTicket(null)}
                disabled={isUpdatingTicket}
              >
                Tutup
              </Button>
              <Button
                variant="primary"
                onClick={() => handleUpdateTicketStatus(ticketStatusUpdate)}
                isLoading={isUpdatingTicket}
              >
                Simpan Perubahan
              </Button>
            </>
          }
        >
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-zinc-950/70 border border-zinc-800 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-zinc-400">Pengirim:</span>
                <span className="font-semibold text-zinc-200">
                  {selectedTicket.userName} ({selectedTicket.userEmail})
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-400">Waktu:</span>
                <span className="text-zinc-300">
                  {new Date(selectedTicket.created_at).toLocaleString("id-ID")}
                </span>
              </div>
            </div>

            <div>
              <p className="text-zinc-400 font-medium mb-1">Subjek / Masalah:</p>
              <div className="p-3 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-200 leading-relaxed">
                {selectedTicket.subject}
              </div>
            </div>

            <Select
              label="Perbarui Status Tiket"
              value={ticketStatusUpdate}
              onChange={(e) => setTicketStatusUpdate(e.target.value)}
              options={[
                { label: "Baru / Belum Ditangani", value: "baru" },
                { label: "Sedang Diproses", value: "proses" },
                { label: "Selesai (Resolved)", value: "selesai" },
                { label: "Ditolak / Ditutup", value: "ditolak" },
              ]}
            />
          </div>
        </Modal>
      )}
    </div>
  );
}
