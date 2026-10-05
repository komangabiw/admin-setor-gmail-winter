"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Users,
  Wallet,
  ArrowLeftRight,
  MessageSquareText,
  TrendingUp,
  RefreshCw,
  PlusCircle,
  ArrowUpRight,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  Clock,
  AlertTriangle,
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

  const stats = data?.stats || {
    totalUsers: 0,
    totalAdmins: 0,
    totalBalance: 0,
    totalWithdrawn: 0,
    totalTickets: 0,
    activeTickets: 0,
    pendingWithdrawals: 0,
  };

  return (
    <div className="space-y-6">
      {/* Top Welcome Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-zinc-900 to-zinc-900/60 border border-zinc-800 p-5 rounded-2xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <h2 className="text-xl font-bold text-white tracking-tight">
              Ringkasan Operasional Setor Gmail
            </h2>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Data live terhubung ke Supabase Database & Telegram Bot Integration.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => fetchStats(false)}
            isLoading={isRefreshing}
            className="flex items-center gap-1.5 text-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
            <span>Segarkan Data</span>
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => setBalanceModalOpen(true)}
            className="flex items-center gap-1.5 text-xs"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Tambah Saldo User</span>
          </Button>
        </div>
      </div>

      {/* 4 Primary Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Pengguna */}
        <Card className="hover:border-zinc-700 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-400">Total Pengguna</span>
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-white tracking-tight">
              {isLoading ? (
                <div className="w-20 h-7 bg-zinc-800 animate-pulse rounded" />
              ) : (
                stats.totalUsers.toLocaleString("id-ID")
              )}
            </div>
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-zinc-800/80 text-xs">
              <span className="text-zinc-500">
                {stats.totalAdmins} Akun Admin
              </span>
              <Link
                href="/users"
                className="text-blue-400 hover:text-blue-300 font-medium flex items-center gap-0.5"
              >
                Lihat Semua <ArrowUpRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </Card>

        {/* Card 2: Total Saldo Pengguna */}
        <Card className="hover:border-zinc-700 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-400">Saldo Pengguna Beredar</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Wallet className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-emerald-400 tracking-tight">
              {isLoading ? (
                <div className="w-28 h-7 bg-zinc-800 animate-pulse rounded" />
              ) : (
                `Rp ${stats.totalBalance.toLocaleString("id-ID")}`
              )}
            </div>
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-zinc-800/80 text-xs">
              <span className="text-zinc-500">
                Total Ditarik: Rp {stats.totalWithdrawn.toLocaleString("id-ID")}
              </span>
              <Link
                href="/transactions"
                className="text-emerald-400 hover:text-emerald-300 font-medium flex items-center gap-0.5"
              >
                Mutasi <ArrowUpRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </Card>

        {/* Card 3: Penarikan Pending */}
        <Card className="hover:border-zinc-700 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-400">Penarikan Saldo</span>
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
              <ArrowLeftRight className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              {isLoading ? (
                <div className="w-16 h-7 bg-zinc-800 animate-pulse rounded" />
              ) : (
                <>
                  <span>{stats.pendingWithdrawals}</span>
                  {stats.pendingWithdrawals > 0 && (
                    <Badge variant="warning" className="text-[10px]">
                      Perlu Diproses
                    </Badge>
                  )}
                </>
              )}
            </div>
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-zinc-800/80 text-xs">
              <span className="text-zinc-500">Antrian Penarikan</span>
              <Link
                href="/transactions?type=withdrawal"
                className="text-amber-400 hover:text-amber-300 font-medium flex items-center gap-0.5"
              >
                Kelola <ArrowUpRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </Card>

        {/* Card 4: Tiket Bantuan & Telegram */}
        <Card className="hover:border-zinc-700 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-400">Tiket & Laporan Telegram</span>
            <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center">
              <MessageSquareText className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              {isLoading ? (
                <div className="w-16 h-7 bg-zinc-800 animate-pulse rounded" />
              ) : (
                <>
                  <span>{stats.activeTickets}</span>
                  <Badge variant={stats.activeTickets > 0 ? "info" : "neutral"} className="text-[10px]">
                    {stats.activeTickets > 0 ? "Tiket Aktif" : "Semua Beres"}
                  </Badge>
                </>
              )}
            </div>
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-zinc-800/80 text-xs">
              <span className="text-zinc-500">
                Total Masuk: {stats.totalTickets} Tiket
              </span>
              <Link
                href="/tickets"
                className="text-cyan-400 hover:text-cyan-300 font-medium flex items-center gap-0.5"
              >
                Buka Tiket <ArrowUpRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </Card>
      </div>

      {/* Main Grid: Latest Tickets & Users */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Latest Tickets & Recent Transactions */}
        <div className="lg:col-span-2 space-y-6">
          {/* Recent Support Tickets */}
          <Card>
            <CardHeader
              title="Laporan & Tiket Bantuan Terbaru"
              subtitle="Tiket bantuan dari bot Telegram dan portal pengguna"
              action={
                <Link
                  href="/tickets"
                  className="text-xs text-emerald-400 hover:text-emerald-300 font-medium flex items-center gap-1"
                >
                  Lihat Semua Tiket <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              }
            />

            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-16 bg-zinc-800/60 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : !data?.recentTickets || data.recentTickets.length === 0 ? (
              <div className="py-8 text-center text-zinc-500 text-xs">
                Belum ada tiket bantuan yang masuk.
              </div>
            ) : (
              <div className="divide-y divide-zinc-800">
                {data.recentTickets.map((t: any) => (
                  <div
                    key={t.id}
                    className="py-3.5 flex items-start justify-between gap-3 group hover:bg-zinc-900/40 px-2 rounded-lg transition-colors"
                  >
                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-zinc-200">
                          {t.ticket_code}
                        </span>
                        <StatusBadge status={t.status} />
                        <span className="text-[11px] text-zinc-500">
                          • {t.category}
                        </span>
                      </div>
                      <p className="text-sm font-medium text-zinc-300 truncate">
                        {t.subject}
                      </p>
                      <div className="flex items-center gap-2 text-[11px] text-zinc-400">
                        <span>Oleh: {t.userName} ({t.userEmail})</span>
                        <span>•</span>
                        <span>
                          {new Date(t.created_at).toLocaleDateString("id-ID", {
                            day: "numeric",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    </div>

                    <Link
                      href={`/tickets?id=${t.id}`}
                      className="shrink-0 text-xs font-medium text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 px-3 py-1.5 rounded-lg border border-emerald-500/20 transition-colors"
                    >
                      Buka & Balas
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Recent Financial Transactions */}
          <Card>
            <CardHeader
              title="Aktivitas Transaksi Terbaru"
              subtitle="Mutasi saldo, deposit dan riwayat penarikan"
              action={
                <Link
                  href="/transactions"
                  className="text-xs text-emerald-400 hover:text-emerald-300 font-medium flex items-center gap-1"
                >
                  Buka Transaksi <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              }
            />

            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-14 bg-zinc-800/60 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : !data?.recentTransactions || data.recentTransactions.length === 0 ? (
              <div className="py-8 text-center text-zinc-500 text-xs">
                Belum ada catatan transaksi.
              </div>
            ) : (
              <div className="divide-y divide-zinc-800">
                {data.recentTransactions.map((tx: any) => (
                  <div
                    key={tx.id}
                    className="py-3 flex items-center justify-between gap-3 px-2 hover:bg-zinc-900/40 rounded-lg transition-colors"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-zinc-200 truncate">
                          {tx.title}
                        </p>
                        <StatusBadge status={tx.status} />
                      </div>
                      <p className="text-xs text-zinc-400 truncate">
                        {tx.userName} ({tx.userEmail})
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <p
                        className={`text-sm font-bold font-mono ${
                          tx.type === "deposit" || tx.type === "manual_credit"
                            ? "text-emerald-400"
                            : "text-rose-400"
                        }`}
                      >
                        {tx.type === "deposit" || tx.type === "manual_credit" ? "+" : "-"}
                        Rp {Number(tx.amount).toLocaleString("id-ID")}
                      </p>
                      <p className="text-[10px] text-zinc-400">
                        {new Date(tx.created_at).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Right Column (1 Col): New Users & Infrastructure Status */}
        <div className="space-y-6">
          {/* 5 Newest Users */}
          <Card>
            <CardHeader
              title="Pengguna Baru Bergabung"
              subtitle="Akun terdaftar terbaru di database"
              action={
                <Link
                  href="/users"
                  className="text-xs text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1"
                >
                  Kelola <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              }
            />

            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-12 bg-zinc-800/60 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : !data?.recentUsers || data.recentUsers.length === 0 ? (
              <div className="py-6 text-center text-zinc-500 text-xs">
                Belum ada pengguna.
              </div>
            ) : (
              <div className="divide-y divide-zinc-800">
                {data.recentUsers.map((u: any) => (
                  <div
                    key={u.id}
                    className="py-2.5 flex items-center justify-between gap-2.5 px-1"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 text-zinc-300 flex items-center justify-center font-bold text-xs shrink-0">
                        {(u.name || u.email || "U").charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-zinc-200 truncate">
                          {u.name || "Pengguna"}
                        </p>
                        <p className="text-[11px] text-zinc-400 truncate">
                          {u.email}
                        </p>
                      </div>
                    </div>

                    <div className="shrink-0 flex items-center gap-1">
                      {u.role === "Admin" ? (
                        <Badge variant="primary" className="text-[10px]">
                          Admin
                        </Badge>
                      ) : (
                        <button
                          onClick={() => {
                            setTargetUserId(u.id);
                            setBalanceModalOpen(true);
                          }}
                          className="text-[11px] text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 px-2 py-1 rounded border border-emerald-500/20 transition-colors"
                        >
                          + Saldo
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Integration & Cloud Status */}
          <Card>
            <CardHeader
              title="Status Integrasi Sistem"
              subtitle="Konektivitas layanan & worker"
            />

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-950 border border-zinc-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  <div>
                    <p className="font-medium text-zinc-200">Supabase Database</p>
                    <p className="text-[10px] text-zinc-400">auth.setorgmail.com (kdjoeeehyahdgwgsfyal)</p>
                  </div>
                </div>
                <Badge variant="success">Connected</Badge>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-950 border border-zinc-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  <div>
                    <p className="font-medium text-zinc-200">Telegram Bot</p>
                    <p className="text-[10px] text-zinc-400">@setorgmail_bot (-1003715736899)</p>
                  </div>
                </div>
                <Badge variant="success">Active</Badge>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-950 border border-zinc-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  <div>
                    <p className="font-medium text-zinc-200">Cloudflare Worker</p>
                    <p className="text-[10px] text-zinc-400">admin-setor-gmail-winter</p>
                  </div>
                </div>
                <Badge variant="success">Deployed</Badge>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Quick Add Balance Modal */}
      <Modal
        isOpen={balanceModalOpen}
        onClose={() => setBalanceModalOpen(false)}
        title="Tambah Saldo Pengguna Manual"
        subtitle="Nominal akan langsung masuk ke dompet pengguna dan tercatat di riwayat mutasi"
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
                label: `${u.name || "User"} (${u.email})`,
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
            helperText="Masukkan angka tanpa titik atau koma"
            required
          />

          <Textarea
            label="Catatan / Keterangan (Opsional)"
            placeholder="Contoh: Bonus verifikasi setoran Gmail manual"
            value={balanceNote}
            onChange={(e) => setBalanceNote(e.target.value)}
          />
        </form>
      </Modal>
    </div>
  );
}
