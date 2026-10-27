"use client";

import React, { useEffect, useState } from "react";
import {
  Users,
  Wallet,
  ArrowLeftRight,
  RefreshCw,
  PlusCircle,
  ShieldCheck,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Activity,
  TrendingUp,
  Check,
  X,
  Copy,
  ChevronRight,
  UserCheck,
  Search,
  Mail,
  ArrowDownToLine,
} from "lucide-react";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Input, Select, Textarea } from "@/components/ui/input";
import { LineChart9 } from "@/components/ui/demo";
import { UsersTab } from "@/components/dashboard/users-tab";

export default function DashboardOverviewPage() {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<"transactions" | "users">("transactions");
  const [timeframe, setTimeframe] = useState<string>("30D");

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

  const handleFullRefresh = async () => {
    await fetchStats(false);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("admin_refresh_all"));
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
    usersWithBalance: 0,
    totalWithdrawn: 0,
    usersWithdrawnCount: 0,
    totalWithdrawalTransactions: 0,
    totalGmailCreated: 0,
    gmailDiterima: 0,
    gmailDicek: 0,
    gmailDitolak: 0,
    usersWithGmailSuccess: 0,
    totalEarned: 0,
    pendingWithdrawals: 0,
    pendingWithdrawalsAmount: 0,
    totalTransactionsCount: 0,
  };

  const totalFlow = stats.totalBalance + stats.totalWithdrawn;

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-10">
      {/* Revenue & Balance Flow Line Chart with Refresh Button & Timeframe (1D, 3D, 7D, 14D, 30D) */}
      <LineChart9
        onRefresh={handleFullRefresh}
        isRefreshing={isRefreshing}
        timeframe={timeframe}
        onTimeframeChange={(d) => setTimeframe(d)}
      />

      {/* 1 Kolom Terpadu: Ekosistem & Likuiditas User (3 Section) */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-5 shadow-sm space-y-4">
        {/* Header Insight */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white tracking-tight">
                Ekosistem & Likuiditas User
              </h3>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Live Insight
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {stats.pendingWithdrawals > 0 ? (
              <button
                type="button"
                onClick={() => {
                  setActiveTab("transactions");
                  scrollToTabs();
                }}
                className="px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
              >
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400 animate-bounce shrink-0" />
                <span>{stats.pendingWithdrawals} Antrean WD Butuh Diproses</span>
                <span className="font-mono text-white bg-amber-500/30 px-1.5 py-0.2 rounded text-[10px]">
                  Rp {stats.pendingWithdrawalsAmount.toLocaleString("id-ID")}
                </span>
              </button>
            ) : (
              <div className="px-3 py-1 rounded-xl bg-zinc-950/60 border border-zinc-800 text-[11px] text-zinc-300 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="font-medium">Semua Penarikan Telah Diproses</span>
              </div>
            )}
          </div>
        </div>

        {/* 3 Section Terpadu: Ekosistem & Likuiditas User */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-1">
          {/* Section 1: Pengguna & Aktivitas Penarikan */}
          <div className="bg-zinc-950/60 border border-zinc-800/80 rounded-xl p-4 flex flex-col justify-between space-y-3.5 hover:border-zinc-700/80 transition-colors">
            <div>
              <div className="flex items-center justify-between text-zinc-400 mb-1.5">
                <span className="text-[11px] font-semibold uppercase tracking-wider">Jumlah User</span>
                <Users className="w-4 h-4 text-blue-400" />
              </div>
              <div className="text-2xl font-bold text-white font-mono tracking-tight">
                {isLoading ? (
                  <div className="w-20 h-7 bg-zinc-800 animate-pulse rounded" />
                ) : (
                  `${stats.totalMembers.toLocaleString("id-ID")} User`
                )}
              </div>
            </div>

            <div className="border-t border-zinc-800/80 pt-3 space-y-2 text-xs text-zinc-400">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5 text-cyan-400" />
                  User Punya Saldo:
                </span>
                <b className="text-cyan-300 font-mono">
                  {stats.usersWithBalance.toLocaleString("id-ID")} User
                </b>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-orange-400" />
                  User Tarik Saldo:
                </span>
                <div className="flex items-center gap-1.5">
                  <b className="text-zinc-200 font-mono">
                    {stats.usersWithdrawnCount.toLocaleString("id-ID")} User
                  </b>
                  <span className="text-zinc-600">•</span>
                  <span className="text-purple-400 font-mono font-semibold bg-purple-500/10 px-1.5 py-0.5 rounded border border-purple-500/20 text-[10px]">
                    {stats.totalWithdrawalTransactions}x Tarik
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Saldo All User - Saldo Ditarik */}
          <div className="bg-zinc-950/60 border border-zinc-800/80 rounded-xl p-4 flex flex-col justify-between space-y-3.5 hover:border-zinc-700/80 transition-colors">
            <div>
              <div className="flex items-center justify-between text-zinc-400 mb-1.5">
                <span className="text-[11px] font-semibold uppercase tracking-wider">Saldo All User</span>
                <Wallet className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl font-bold text-emerald-400 font-mono tracking-tight">
                {isLoading ? (
                  <div className="w-28 h-7 bg-zinc-800 animate-pulse rounded" />
                ) : (
                  `Rp ${stats.totalBalance.toLocaleString("id-ID")}`
                )}
              </div>
            </div>

            <div className="border-t border-zinc-800/80 pt-3 space-y-2 text-xs text-zinc-400">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <ArrowDownToLine className="w-3.5 h-3.5 text-amber-400" />
                  Saldo Ditarik:
                </span>
                <b className="text-amber-400 font-mono">
                  Rp {stats.totalWithdrawn.toLocaleString("id-ID")}
                </b>
              </div>
              <div className="flex items-center justify-between text-[11px] text-zinc-500">
                <span>Perputaran Dana:</span>
                <span className="font-mono text-zinc-300 font-medium">Rp {totalFlow.toLocaleString("id-ID")}</span>
              </div>
            </div>
          </div>

          {/* Section 3: Gmail Digenerate & Status (Dicek/Ditolak/Diterima) */}
          <div className="bg-zinc-950/60 border border-zinc-800/80 rounded-xl p-4 flex flex-col justify-between space-y-3.5 hover:border-zinc-700/80 transition-colors">
            <div>
              <div className="flex items-center justify-between text-zinc-400 mb-1.5">
                <span className="text-[11px] font-semibold uppercase tracking-wider">Gmail Digenerate</span>
                <Mail className="w-4 h-4 text-rose-400" />
              </div>
              <div className="text-2xl font-bold text-white font-mono tracking-tight flex items-baseline gap-1.5">
                {isLoading ? (
                  <div className="w-20 h-7 bg-zinc-800 animate-pulse rounded" />
                ) : (
                  <>
                    <span>{stats.totalGmailCreated.toLocaleString("id-ID")}</span>
                    <span className="text-xs font-normal text-zinc-400 font-sans">Akun Gmail</span>
                  </>
                )}
              </div>
            </div>

            <div className="border-t border-zinc-800/80 pt-3 flex items-center justify-between gap-1.5 text-[11px]">
              <div className="flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/20 px-2 py-1 rounded-lg">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                <span className="text-zinc-400">Dicek:</span>
                <b className="text-amber-400 font-mono">{stats.gmailDicek || 0}</b>
              </div>

              <div className="flex items-center gap-1.5 bg-rose-500/10 border border-rose-500/20 px-2 py-1 rounded-lg">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                <span className="text-zinc-400">Ditolak:</span>
                <b className="text-rose-400 font-mono">{stats.gmailDitolak || 0}</b>
              </div>

              <div className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 rounded-lg">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span className="text-zinc-400">Diterima:</span>
                <b className="text-emerald-400 font-mono">{stats.gmailDiterima || 0}</b>
              </div>
            </div>
          </div>
        </div>

        {/* Insight Likuiditas Kas */}
        <div className="pt-3 border-t border-zinc-800 flex items-center gap-2 text-xs">
          <span className="flex h-2 w-2 relative shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-zinc-400 text-[11px]">
            <b className="text-zinc-200">Kesehatan Likuiditas Kas:</b> Total perputaran dana pengguna mencapai{" "}
            <b className="text-emerald-400 font-mono">
              Rp {totalFlow.toLocaleString("id-ID")}
            </b>{" "}
            {stats.pendingWithdrawals > 0
              ? `— Perlu memproses ${stats.pendingWithdrawals} penarikan saldo (Rp ${stats.pendingWithdrawalsAmount.toLocaleString("id-ID")}) segera.`
              : "— Semua penarikan tuntas dan saldo dompet beroperasi normal."}
          </span>
        </div>
      </div>

      {/* Main Full-Width Section (Unified Dashboard Tabs) */}
      <div id="dashboard-tabs-section" className="space-y-4">
        <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl overflow-hidden shadow-sm">
          {/* Tab Header (Merged: Transaksi & Daftar Pengguna) */}
          <div className="flex items-center justify-between border-b border-zinc-800 px-3 pt-2 pb-0 bg-zinc-950/40 overflow-x-auto">
            <div className="flex items-center gap-1">
              {/* Tab 1: Transaksi (Gabungan Mutasi Transaksi & Withdraw) */}
              <button
                type="button"
                onClick={() => setActiveTab("transactions")}
                className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-t-lg border-b-2 transition-colors cursor-pointer ${
                  activeTab === "transactions"
                    ? "border-emerald-500 text-emerald-400 bg-zinc-900/60"
                    : "border-transparent text-zinc-400 hover:text-zinc-200"
                }`}
              >
                <ArrowLeftRight className="w-3.5 h-3.5" />
                <span>Transaksi</span>
                {stats.pendingWithdrawals > 0 ? (
                  <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500/20 text-amber-400 font-bold border border-amber-500/30">
                    {stats.pendingWithdrawals} WD Pending
                  </span>
                ) : (
                  <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-zinc-800 text-zinc-300">
                    {data?.recentTransactions?.length || 0}
                  </span>
                )}
              </button>

              {/* Tab 2: Daftar Pengguna */}
              <button
                type="button"
                onClick={() => setActiveTab("users")}
                className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-t-lg border-b-2 transition-colors cursor-pointer ${
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
            {/* 1. Tab Transaksi (Gabungan Withdraw & Mutasi Transaksi) */}
            {activeTab === "transactions" && (
              <div className="space-y-5">
                {/* Antrean Penarikan Saldo Pending (jika ada request WD) */}
                {data?.pendingWithdrawalsList && data.pendingWithdrawalsList.length > 0 && (
                  <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-3.5 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Wallet className="w-4 h-4 text-amber-400 shrink-0" />
                        <span className="text-xs font-bold text-amber-300 uppercase tracking-wide">
                          Permintaan Penarikan Saldo (Withdraw)
                        </span>
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
                          {data.pendingWithdrawalsList.length} Menunggu Proses
                        </span>
                      </div>
                      <span className="text-xs text-amber-400 font-semibold font-mono">
                        Total: Rp {stats.pendingWithdrawalsAmount.toLocaleString("id-ID")}
                      </span>
                    </div>

                    <div className="divide-y divide-zinc-800/80 bg-zinc-950/70 rounded-lg p-2 border border-zinc-800/80">
                      {data.pendingWithdrawalsList.map((w: any) => (
                        <div
                          key={w.id}
                          className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-2 rounded-lg hover:bg-zinc-800/30 transition-colors"
                        >
                          <div className="min-w-0 space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-white">
                                {w.userName}
                              </span>
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-semibold">
                                Pending WD
                              </span>
                            </div>
                            <div className="flex flex-wrap items-center gap-2.5 text-xs text-zinc-300">
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
                  </div>
                )}

                {/* Bagian Riwayat Mutasi & Transaksi */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between px-1">
                    <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                      Riwayat Transaksi & Mutasi Saldo
                    </span>
                    <span className="text-[11px] text-zinc-500">
                      {data?.recentTransactions?.length || 0} Transaksi Terakhir
                    </span>
                  </div>

                  {isLoading ? (
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
                  )}
                </div>
              </div>
            )}

            {/* 2. Tab Daftar Pengguna */}
            {activeTab === "users" && (
              <UsersTab onUserUpdated={() => fetchStats(false)} />
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


    </div>
  );
}
