"use client";

import React, { useEffect, useState, useCallback } from "react";
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
import { adminFetch } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Input, Select, Textarea } from "@/components/ui/input";
import { LineChart9 } from "@/components/ui/demo";
import { UsersTab } from "@/components/dashboard/users-tab";

export default function DashboardOverviewPage() {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<"users" | "deposits" | "transactions">("users");
  const [timeframe, setTimeframe] = useState<string>("All");
  const [isBalanceHidden, setIsBalanceHidden] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("admin_hide_balance") === "true";
    }
    return false;
  });

  const toggleHideBalance = () => {
    setIsBalanceHidden((prev) => {
      const next = !prev;
      if (typeof window !== "undefined") {
        localStorage.setItem("admin_hide_balance", String(next));
      }
      return next;
    });
  };

  // State untuk Tab List Setor Gmail
  const [depositSearch, setDepositSearch] = useState("");
  const [depositStatusFilter, setDepositStatusFilter] = useState<"all" | "accepted" | "pending" | "rejected">("all");
  const [copiedGmail, setCopiedGmail] = useState<string | null>(null);

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

  const fetchStats = async (showLoading = true, tf = timeframe) => {
    if (showLoading) setIsLoading(true);
    else setIsRefreshing(true);

    try {
      const res = await adminFetch(`/api/admin/stats?timeframe=${tf}`);
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

  const handleTimeframeChange = (newTf: string) => {
    setTimeframe(newTf);
    fetchStats(false, newTf);
  };

  const handleFullRefresh = async () => {
    await fetchStats(false, timeframe);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("admin_refresh_all"));
    }
  };

  const handleUserUpdated = useCallback(() => {
    fetchStats(false, timeframe);
  }, [timeframe]);

  useEffect(() => {
    fetchStats(true, "All");
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
      const res = await adminFetch("/api/admin/transactions", {
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
      const res = await adminFetch("/api/admin/transactions", {
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

  const copyGmail = (gmail: string, id: string) => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(gmail);
      setCopiedGmail(id);
      setTimeout(() => setCopiedGmail(null), 1500);
    }
  };

  const stats = data?.stats || {
    totalUsers: 0,
    totalAdmins: 0,
    totalMembers: 0,
    activeUsersCount: 0,
    totalBalance: 0,
    usersWithBalance: 0,
    totalWithdrawn: 0,
    usersWithdrawnCount: 0,
    totalWithdrawalTransactions: 0,
    totalGmailCreated: 0,
    allTimeGmailCreated: 0,
    gmailDiterima: 0,
    gmailDicek: 0,
    gmailDitolak: 0,
    usersWithGmailSuccess: 0,
    totalEarned: 0,
    pendingWithdrawals: 0,
    pendingWithdrawalsAmount: 0,
    totalTransactionsCount: 0,
    gmailPrice: 4500,
  };

  const filteredDepositsList = React.useMemo(() => {
    let list = data?.recentDeposits || [];
    if (depositStatusFilter !== "all") {
      list = list.filter((d: any) => {
        const s = (d.status || "").toLowerCase();
        if (depositStatusFilter === "accepted") {
          return ["accepted", "diterima", "sukses", "approved"].includes(s);
        }
        if (depositStatusFilter === "pending") {
          return ["pending", "dicek", "proses", "menunggu"].includes(s);
        }
        if (depositStatusFilter === "rejected") {
          return ["rejected", "ditolak", "batal"].includes(s);
        }
        return true;
      });
    }
    if (depositSearch.trim()) {
      const q = depositSearch.toLowerCase();
      list = list.filter(
        (d: any) =>
          (d.gmail || "").toLowerCase().includes(q) ||
          (d.userName || "").toLowerCase().includes(q) ||
          (d.userEmail || "").toLowerCase().includes(q)
      );
    }
    return list;
  }, [data?.recentDeposits, depositStatusFilter, depositSearch]);

  const totalFlow = stats.totalBalance + stats.totalWithdrawn;

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-10">
      {/* Revenue & Balance Flow Line Chart with Refresh Button & Timeframe (1D, 3D, 7D, 14D, 30D, All) */}
      <LineChart9
        onRefresh={handleFullRefresh}
        isRefreshing={isRefreshing}
        timeframe={timeframe}
        onTimeframeChange={handleTimeframeChange}
        gmailDisetor={stats.totalGmailCreated}
        hargaGmail={stats.gmailPrice || 4500}
        isBalanceHidden={isBalanceHidden}
        onToggleHideBalance={toggleHideBalance}
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
                  Rp {isBalanceHidden ? "***" : stats.pendingWithdrawalsAmount.toLocaleString("id-ID")}
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

        {/* 3 Section Terpadu: Ekosistem & Likuiditas User (Garis Tengah Sejajar) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-1">
          {/* Section 1: Pengguna & Jumlah User Aktif */}
          <div className="bg-zinc-950/60 border border-zinc-800/80 rounded-xl p-4 flex flex-col hover:border-zinc-700/80 transition-colors">
            <div className="h-[54px] flex flex-col justify-between">
              <div className="flex items-center justify-between text-white">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-white">Jumlah User</span>
                <Users className="w-4 h-4 text-blue-400" />
              </div>
              <div className="text-xl sm:text-2xl font-bold text-white font-mono tracking-tight leading-none">
                {isLoading ? (
                  <div className="w-20 h-6 bg-zinc-800 animate-pulse rounded" />
                ) : (
                  `${stats.totalMembers.toLocaleString("id-ID")} User`
                )}
              </div>
            </div>

            <div className="border-t border-zinc-800/80 pt-3 mt-3.5 flex-1 flex flex-col justify-center space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-zinc-300">
                  <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                  Jumlah User Aktif:
                </span>
                <b className="text-emerald-400 font-mono">
                  {isLoading ? (
                    <span className="w-12 h-4 bg-zinc-800 animate-pulse inline-block rounded" />
                  ) : isBalanceHidden ? (
                    "*** User"
                  ) : (
                    `${(stats.activeUsersCount || 0).toLocaleString("id-ID")} User`
                  )}
                </b>
              </div>
            </div>
          </div>

          {/* Section 2: Saldo All User (kanan bawah: User Punya Saldo) & Saldo Ditarik (kanan: User Tarik Saldo) */}
          <div className="bg-zinc-950/60 border border-zinc-800/80 rounded-xl p-4 flex flex-col hover:border-zinc-700/80 transition-colors">
            <div className="h-[54px] flex flex-col justify-between">
              <div className="flex items-center justify-between text-white">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-white">Saldo All User</span>
                <Wallet className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="flex items-baseline justify-between gap-2">
                <div className="text-xl sm:text-2xl font-bold text-white font-mono tracking-tight leading-none">
                  {isLoading ? (
                    <div className="w-28 h-6 bg-zinc-800 animate-pulse rounded" />
                  ) : isBalanceHidden ? (
                    "Rp ***"
                  ) : (
                    `Rp ${stats.totalBalance.toLocaleString("id-ID")}`
                  )}
                </div>
                {/* User Punya Saldo dipindahkan ke kanan bawah di saldo all user */}
                <div className="text-right text-[11px] text-zinc-400 shrink-0">
                  <span className="text-zinc-500">User Punya Saldo: </span>
                  <b className="text-white font-mono">
                    {isLoading ? (
                      <span className="w-10 h-3 bg-zinc-800 animate-pulse inline-block rounded" />
                    ) : isBalanceHidden ? (
                      "*** User"
                    ) : (
                      `${stats.usersWithBalance.toLocaleString("id-ID")} User`
                    )}
                  </b>
                </div>
              </div>
            </div>

            <div className="border-t border-zinc-800/80 pt-3 mt-3.5 flex-1 flex flex-col justify-center">
              <div className="flex items-center text-white mb-1">
                <span className="text-[11px] font-semibold uppercase tracking-wider flex items-center gap-1.5 text-white">
                  <ArrowDownToLine className="w-3.5 h-3.5 text-white" />
                  Saldo Ditarik
                </span>
              </div>
              <div className="flex items-baseline justify-between gap-2">
                <div className="text-xl sm:text-2xl font-bold text-white font-mono tracking-tight leading-none">
                  {isLoading ? (
                    <div className="w-24 h-6 bg-zinc-800 animate-pulse rounded" />
                  ) : isBalanceHidden ? (
                    "Rp ***"
                  ) : (
                    `Rp ${stats.totalWithdrawn.toLocaleString("id-ID")}`
                  )}
                </div>
                {/* User Tarik Saldo dipindahkan ke sebelah kanan saldo ditarik */}
                <div className="flex items-center gap-1.5 text-[11px] shrink-0">
                  <span className="text-purple-400 font-mono font-semibold bg-purple-500/10 px-1.5 py-0.5 rounded border border-purple-500/20 text-[10px]">
                    {isBalanceHidden ? "*** Tarik" : `${stats.totalWithdrawalTransactions}x Tarik`}
                  </span>
                  <span className="text-zinc-600">•</span>
                  <b className="text-white font-mono">
                    {isLoading ? (
                      <span className="w-10 h-3 bg-zinc-800 animate-pulse inline-block rounded" />
                    ) : isBalanceHidden ? (
                      "*** User"
                    ) : (
                      `${stats.usersWithdrawnCount.toLocaleString("id-ID")} User`
                    )}
                  </b>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Gmail Digenerate & Status (Diterima / Dicek / Ditolak) */}
          <div className="bg-zinc-950/60 border border-zinc-800/80 rounded-xl p-4 flex flex-col hover:border-zinc-700/80 transition-colors">
            <div className="h-[54px] flex flex-col justify-between">
              <div className="flex items-center justify-between text-white">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-white">Gmail Digenerate</span>
                <Mail className="w-4 h-4 text-rose-400" />
              </div>
              <div className="flex items-baseline justify-between gap-2">
                <div className="text-xl sm:text-2xl font-bold text-white font-mono tracking-tight leading-none">
                  {isLoading ? (
                    <div className="w-20 h-6 bg-zinc-800 animate-pulse rounded" />
                  ) : isBalanceHidden ? (
                    "*** Akun Gmail"
                  ) : (
                    `${stats.totalGmailCreated.toLocaleString("id-ID")} Akun Gmail`
                  )}
                </div>
                {timeframe !== "All" && stats.totalGmailCreated === 0 && (stats.allTimeGmailCreated || 0) > 0 && !isBalanceHidden && (
                  <span className="text-[10px] text-zinc-400 font-medium font-mono">
                    ({stats.allTimeGmailCreated} Total)
                  </span>
                )}
              </div>
            </div>

            <div className="border-t border-zinc-800/80 pt-3 mt-3.5 flex-1 flex items-center justify-between gap-1.5 text-[11px]">
              {/* Diterima (Kiri) */}
              <div className="flex-1 flex items-center justify-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 py-2 rounded-lg">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span className="text-zinc-400">Diterima:</span>
                <b className="text-emerald-400 font-mono">{isBalanceHidden ? "***" : (stats.gmailDiterima || 0)}</b>
              </div>

              {/* Dicek (Tengah) */}
              <div className="flex-1 flex items-center justify-center gap-1.5 bg-amber-500/10 border border-amber-500/20 py-2 rounded-lg">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                <span className="text-zinc-400">Dicek:</span>
                <b className="text-amber-400 font-mono">{isBalanceHidden ? "***" : (stats.gmailDicek || 0)}</b>
              </div>

              {/* Ditolak (Kanan) */}
              <div className="flex-1 flex items-center justify-center gap-1.5 bg-rose-500/10 border border-rose-500/20 py-2 rounded-lg">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                <span className="text-zinc-400">Ditolak:</span>
                <b className="text-rose-400 font-mono">{isBalanceHidden ? "***" : (stats.gmailDitolak || 0)}</b>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Full-Width Section (Unified Dashboard Tabs) */}
      <div id="dashboard-tabs-section" className="space-y-4">
        <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl overflow-hidden shadow-sm">
          {/* Tab Header (3 Tab: Daftar Pengguna, Setor Gmail, Transaksi) */}
          <div className="flex flex-wrap items-center justify-between border-b border-zinc-800 px-3 pt-2 pb-0 bg-zinc-950/40 no-scrollbar gap-2">
            <div className="flex items-center gap-1">
              {/* Tab 1: Daftar Pengguna (Sebelah Kiri) */}
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
                <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-zinc-800 text-zinc-300 font-mono">
                  {stats.totalUsers}
                </span>
              </button>

              {/* Tab 2: Setor Gmail (Sebelah Kiri Transaksi) */}
              <button
                type="button"
                onClick={() => setActiveTab("deposits")}
                className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-t-lg border-b-2 transition-colors cursor-pointer ${
                  activeTab === "deposits"
                    ? "border-sky-500 text-sky-400 bg-zinc-900/60"
                    : "border-transparent text-zinc-400 hover:text-zinc-200"
                }`}
              >
                <Mail className="w-3.5 h-3.5" />
                <span>Setor Gmail</span>
                <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-zinc-800 text-zinc-300 font-mono">
                  {stats.allTimeGmailCreated || stats.totalGmailCreated || (data?.recentDeposits || []).length}
                </span>
              </button>

              {/* Tab 3: Transaksi */}
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
                  <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-zinc-800 text-zinc-300 font-mono">
                    {data?.recentTransactions?.length || 0}
                  </span>
                )}
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
              <UsersTab onUserUpdated={handleUserUpdated} />
            )}

            {/* 3. Tab Setor Gmail (List Setor Gmail: Email, Penyetor, Status Diterima/Dicek/Ditolak) */}
            {activeTab === "deposits" && (
              <div className="space-y-4">
                {/* Fallback Banner jika periode pilihan tidak ada setoran tapi database memiliki data */}
                {data?.stats?.isDepositsHistoricalFallback && (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 px-3.5 py-2.5 rounded-xl bg-sky-500/10 border border-sky-500/20 text-xs text-sky-300">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-sky-400 shrink-0" />
                      <span>
                        Belum ada setoran akun baru dalam rentang <b>{timeframe}</b>. Menampilkan <b>{(data?.recentDeposits || []).length}</b> seluruh riwayat setoran sebelumnya.
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleTimeframeChange("All")}
                      className="px-2.5 py-1 rounded-lg bg-sky-500/20 hover:bg-sky-500/30 text-sky-200 text-[11px] font-semibold transition-colors cursor-pointer shrink-0 self-start sm:self-center"
                    >
                      Pilih Semua Waktu (All)
                    </button>
                  </div>
                )}

                {/* Search & Filter Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1">
                  <div className="flex items-center gap-2 flex-1 max-w-md relative">
                    <Search className="w-4 h-4 absolute left-3 top-2.5 text-zinc-400 pointer-events-none" />
                    <input
                      type="text"
                      placeholder="Cari email Gmail, nama penyetor..."
                      value={depositSearch}
                      onChange={(e) => setDepositSearch(e.target.value)}
                      className="w-full bg-zinc-950/80 border border-zinc-800 rounded-xl pl-9 pr-4 py-1.5 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-sky-500/50"
                    />
                  </div>

                  <div className="flex items-center gap-1.5 flex-wrap">
                    {(
                      [
                        { id: "all", label: "Semua", count: (data?.recentDeposits || []).length },
                        { id: "accepted", label: "Diterima", count: stats.gmailDiterima },
                        { id: "pending", label: "Dicek", count: stats.gmailDicek },
                        { id: "rejected", label: "Ditolak", count: stats.gmailDitolak },
                      ] as const
                    ).map((f) => (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => setDepositStatusFilter(f.id)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
                          depositStatusFilter === f.id
                            ? f.id === "accepted"
                              ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                              : f.id === "pending"
                              ? "bg-amber-500/20 text-amber-400 border border-amber-500/40"
                              : f.id === "rejected"
                              ? "bg-rose-500/20 text-rose-400 border border-rose-500/40"
                              : "bg-sky-500/20 text-sky-400 border border-sky-500/40"
                            : "bg-zinc-950 text-zinc-400 hover:text-zinc-200 border border-zinc-800"
                        }`}
                      >
                        <span>{f.label}</span>
                        <span className="text-[10px] font-mono bg-zinc-800/80 px-1.5 py-0.2 rounded-full">
                          {f.count}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Table List Setor Gmail */}
                <div className="overflow-x-auto rounded-xl border border-zinc-800 bg-zinc-950/40">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-zinc-800 bg-zinc-900/60 text-zinc-400 font-semibold uppercase tracking-wider text-[10px]">
                        <th className="py-2.5 px-3">Gmail Disetor</th>
                        <th className="py-2.5 px-3">Penyetor Akun</th>
                        <th className="py-2.5 px-3">Kategori</th>
                        <th className="py-2.5 px-3">Status Email</th>
                        <th className="py-2.5 px-3">Waktu Setor</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/60">
                      {isLoading ? (
                        <tr>
                          <td colSpan={5} className="py-8 text-center text-zinc-500">
                            <div className="flex items-center justify-center gap-2">
                              <RefreshCw className="w-4 h-4 animate-spin text-sky-400" />
                              <span>Memuat list setoran Gmail...</span>
                            </div>
                          </td>
                        </tr>
                      ) : filteredDepositsList.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-8 text-center text-zinc-500">
                            Belum ada setoran Gmail yang sesuai filter pada rentang waktu ini.
                          </td>
                        </tr>
                      ) : (
                        filteredDepositsList.map((d: any) => {
                          const statusStr = (d.status || "").toLowerCase();
                          const isDiterima = ["accepted", "diterima", "sukses", "approved"].includes(statusStr);
                          const isDicek = ["pending", "dicek", "proses", "menunggu"].includes(statusStr);
                          return (
                            <tr key={d.id} className="hover:bg-zinc-800/30 transition-colors">
                              {/* Gmail Disetor */}
                              <td className="py-2.5 px-3">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-mono text-zinc-100 font-medium text-xs select-all">
                                    {d.gmail}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => copyGmail(d.gmail, d.id)}
                                    className="p-1 rounded text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 transition-colors cursor-pointer"
                                    title="Salin Email"
                                  >
                                    {copiedGmail === d.id ? (
                                      <Check className="w-3 h-3 text-emerald-400" />
                                    ) : (
                                      <Copy className="w-3 h-3" />
                                    )}
                                  </button>
                                </div>
                              </td>

                              {/* Siapa yang Menyetor */}
                              <td className="py-2.5 px-3">
                                <div className="min-w-0">
                                  <span className="text-zinc-200 font-medium block truncate">
                                    {d.userName || "Pengguna"}
                                  </span>
                                  <span className="text-[10px] text-zinc-500 truncate block">
                                    {d.userEmail || "-"}
                                  </span>
                                </div>
                              </td>

                              {/* Kategori & Nominal */}
                              <td className="py-2.5 px-3">
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-zinc-900 border border-zinc-800 text-zinc-300">
                                  {d.categoryLabel || "Gmail Good"}
                                  <span className="text-emerald-400 font-mono">
                                    • Rp {Number(d.amount || 4500).toLocaleString("id-ID")}
                                  </span>
                                </span>
                              </td>

                              {/* Status Email: Diterima / Dicek / Ditolak */}
                              <td className="py-2.5 px-3">
                                {isDiterima ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                    Diterima
                                  </span>
                                ) : isDicek ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                                    Dicek
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                                    <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                                    Ditolak
                                  </span>
                                )}
                              </td>

                              {/* Waktu Setor */}
                              <td className="py-2.5 px-3 text-zinc-400 text-[11px] whitespace-nowrap">
                                {new Date(d.created_at).toLocaleDateString("id-ID", {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
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
