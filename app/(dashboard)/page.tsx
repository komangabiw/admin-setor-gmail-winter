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
  const [timeframe, setTimeframe] = useState<string>("30 hari");

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
    totalWithdrawn: 0,
    totalEarned: 0,
    pendingWithdrawals: 0,
    pendingWithdrawalsAmount: 0,
    totalTransactionsCount: 0,
  };

  const totalFlow = stats.totalBalance + stats.totalWithdrawn;

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-10">
      {/* Revenue & Balance Flow Line Chart with Refresh Button */}
      <LineChart9 onRefresh={() => fetchStats(false)} isRefreshing={isRefreshing} />

      {/* 1 Kolom Terpadu: Ekosistem & Likuiditas User */}
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

          <div className="flex flex-col sm:items-end gap-2 shrink-0">
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

            {/* Filter Waktu: 1 hari, 3 hari, 7 hari, 14 hari, 30 hari */}
            <div className="flex items-center gap-1 bg-zinc-950/80 p-0.5 rounded-lg border border-zinc-800/80">
              {["1 hari", "3 hari", "7 hari", "14 hari", "30 hari"].map((period) => (
                <button
                  key={period}
                  type="button"
                  onClick={() => setTimeframe(period)}
                  className={`px-2 py-0.5 rounded-md text-[10px] font-medium transition-all cursor-pointer ${
                    timeframe === period
                      ? "bg-zinc-800 text-emerald-400 font-semibold shadow-xs border border-zinc-700/60"
                      : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"
                  }`}
                >
                  {period}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Data Terpadu Satu Tampilan: Pengguna (Kiri) | Total Saldo User (Tengah) | Jumlah Penarikan Saldo User (Kanan) */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 py-2">
          {/* 1. Pengguna (Paling Kiri, Tanpa Admin) */}
          <div className="space-y-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-blue-400" />
              Pengguna
            </span>
            <div className="text-2xl font-bold text-white font-mono tracking-tight">
              {isLoading ? (
                <div className="w-20 h-7 bg-zinc-800 animate-pulse rounded" />
              ) : (
                `${stats.totalMembers.toLocaleString("id-ID")} User`
              )}
            </div>
          </div>

          <div className="hidden md:block w-px h-12 bg-zinc-800" />

          {/* 2. Total Saldo User */}
          <div className="space-y-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
              <Wallet className="w-3.5 h-3.5 text-emerald-400" />
              Total Saldo User
            </span>
            <div className="text-2xl font-bold text-emerald-400 font-mono tracking-tight">
              {isLoading ? (
                <div className="w-28 h-7 bg-zinc-800 animate-pulse rounded" />
              ) : (
                `Rp ${stats.totalBalance.toLocaleString("id-ID")}`
              )}
            </div>
            <div className="text-[11px] text-zinc-400 flex items-center gap-2">
              <span>Sudah Ditarik: <b className="text-zinc-200 font-mono">Rp {stats.totalWithdrawn.toLocaleString("id-ID")}</b></span>
            </div>
          </div>

          <div className="hidden md:block w-px h-12 bg-zinc-800" />

          {/* 3. Jumlah Penarikan Saldo User */}
          <div className="space-y-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
              <ArrowLeftRight className="w-3.5 h-3.5 text-amber-400" />
              Jumlah Penarikan Saldo User
            </span>
            <div className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              {isLoading ? (
                <div className="w-16 h-7 bg-zinc-800 animate-pulse rounded" />
              ) : (
                <>
                  <span className="font-mono">{stats.pendingWithdrawals}</span>
                  {stats.pendingWithdrawals > 0 && (
                    <span className="text-[10px] font-bold px-2 py-0.5 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-full animate-pulse">
                      Pending Approval
                    </span>
                  )}
                </>
              )}
            </div>
            <div className="text-[11px] text-zinc-400 flex items-center gap-2">
              <span>Nominal Pending: <b className="text-amber-400 font-mono">Rp {stats.pendingWithdrawalsAmount.toLocaleString("id-ID")}</b></span>
              <span>•</span>
              <span>Total Sukses: <b className="text-zinc-200 font-mono">Rp {stats.totalWithdrawn.toLocaleString("id-ID")}</b></span>
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
