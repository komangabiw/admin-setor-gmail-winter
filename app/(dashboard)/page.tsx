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
  const [activeTab, setActiveTab] = useState<"transactions" | "withdrawals" | "users">("transactions");

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

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-10">
      {/* Revenue & Balance Flow Line Chart with Refresh Button */}
      <LineChart9 onRefresh={() => fetchStats(false)} isRefreshing={isRefreshing} />

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

      {/* 3 Metric KPI Cards (Order matches the tabs below) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Card 1: Saldo Beredar (Mutasi Transaksi) */}
        <div
          onClick={() => {
            setActiveTab("transactions");
            scrollToTabs();
          }}
          className="p-3.5 rounded-xl border bg-zinc-900/80 border-zinc-800 shadow-sm text-left cursor-pointer hover:border-emerald-500/40 hover:bg-zinc-900 transition-all group"
        >
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-[11px] font-medium uppercase tracking-wider group-hover:text-emerald-400 transition-colors">Saldo Beredar</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
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
              <span className="text-zinc-500 group-hover:text-emerald-400 transition-colors text-[10px]">Mutasi ↓</span>
            </div>
          </div>
        </div>

        {/* Card 2: Withdraw */}
        <div
          onClick={() => {
            setActiveTab("withdrawals");
            scrollToTabs();
          }}
          className="p-3.5 rounded-xl border bg-zinc-900/80 border-zinc-800 shadow-sm text-left cursor-pointer hover:border-amber-500/40 hover:bg-zinc-900 transition-all group"
        >
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-[11px] font-medium uppercase tracking-wider group-hover:text-amber-400 transition-colors">Withdraw</span>
            <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
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
              <span className="text-zinc-500 group-hover:text-amber-400 transition-colors text-[10px]">Proses ↓</span>
            </div>
          </div>
        </div>

        {/* Card 3: Total Pengguna */}
        <div
          onClick={() => {
            setActiveTab("users");
            scrollToTabs();
          }}
          className="p-3.5 rounded-xl border bg-zinc-900/80 border-zinc-800 shadow-sm text-left cursor-pointer hover:border-blue-500/40 hover:bg-zinc-900 transition-all group"
        >
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-[11px] font-medium uppercase tracking-wider group-hover:text-blue-400 transition-colors">Pengguna</span>
            <div className="w-7 h-7 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
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
              <span className="text-zinc-500 group-hover:text-blue-400 transition-colors text-[10px]">Lihat ↓</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Full-Width Section (Unified Dashboard Tabs) */}
      <div id="dashboard-tabs-section" className="space-y-4">
        <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl overflow-hidden shadow-sm">
          {/* Tab Header */}
          <div className="flex items-center justify-between border-b border-zinc-800 px-3 pt-2 pb-0 bg-zinc-950/40 overflow-x-auto">
            <div className="flex items-center gap-1">
              {/* Tab 1: Mutasi Transaksi */}
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

              {/* Tab 2: Withdraw */}
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
                <span>Withdraw</span>
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

              {/* Tab 3: Daftar Pengguna */}
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
            {/* 1. Tab Mutasi Transaksi */}
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

            {/* 2. Tab Withdraw */}
            {activeTab === "withdrawals" && (
              !data?.pendingWithdrawalsList || data.pendingWithdrawalsList.length === 0 ? (
                <div className="py-12 text-center space-y-2">
                  <div className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/20">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <p className="text-xs text-zinc-300 font-semibold">Semua Penarikan Telah Diproses</p>
                  <p className="text-[11px] text-zinc-500 max-w-sm mx-auto">
                    Saat ini tidak ada penarikan saldo pengguna yang pending.
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

            {/* 4. Tab Daftar Pengguna (Lengkap dengan Pencarian, Tabel Lengkap, dan Aksi Admin) */}
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
