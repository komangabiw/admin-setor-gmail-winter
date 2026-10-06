"use client";

import React, { useEffect, useState } from "react";
import {
  ArrowLeftRight,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  RefreshCw,
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  FileText,
  Clock,
  ExternalLink,
  AlertTriangle,
  Mail,
  Copy,
  Check,
  ChevronRight,
  ShieldCheck,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Input, Select, Textarea } from "@/components/ui/input";

export default function TransactionsPage() {
  // Transactions State
  const [transactions, setTransactions] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Transaction Detail / Verification Modal
  const [verifyModalOpen, setVerifyModalOpen] = useState(false);
  const [selectedTx, setSelectedTx] = useState<any>(null);
  const [adminNote, setAdminNote] = useState("");
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Gmail Deposits State
  const [deposits, setDeposits] = useState<any[]>([]);
  const [depositStats, setDepositStats] = useState({
    total: 0,
    accepted: 0,
    pending: 0,
    rejected: 0,
    totalAmount: 0,
  });
  const [isLoadingDeposits, setIsLoadingDeposits] = useState(true);
  const [depositSearch, setDepositSearch] = useState("");
  const [depositCategoryFilter, setDepositCategoryFilter] = useState("all");
  const [depositStatusFilter, setDepositStatusFilter] = useState("all");
  const [copiedGmailId, setCopiedGmailId] = useState<string | null>(null);

  // Deposit Detail / Verification Modal
  const [depositModalOpen, setDepositModalOpen] = useState(false);
  const [selectedDeposit, setSelectedDeposit] = useState<any>(null);
  const [depositAdminNote, setDepositAdminNote] = useState("");
  const [isUpdatingDeposit, setIsUpdatingDeposit] = useState(false);

  // Fetch transactions
  const fetchTransactions = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (typeFilter !== "all") params.set("type", typeFilter);
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (search) params.set("search", search);

      const res = await fetch(`/api/admin/transactions?${params.toString()}`);
      const json = await res.json();
      if (json.success) {
        setTransactions(json.transactions || []);
      }
    } catch (err) {
      console.error("Gagal memuat transaksi:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch Gmail deposits
  const fetchDeposits = async () => {
    setIsLoadingDeposits(true);
    try {
      const params = new URLSearchParams();
      if (depositCategoryFilter !== "all") params.set("category", depositCategoryFilter);
      if (depositStatusFilter !== "all") params.set("status", depositStatusFilter);
      if (depositSearch) params.set("search", depositSearch);

      const res = await fetch(`/api/admin/deposits?${params.toString()}`);
      const json = await res.json();
      if (json.success) {
        setDeposits(json.deposits || []);
        if (json.stats) setDepositStats(json.stats);
      }
    } catch (err) {
      console.error("Gagal memuat data setoran Gmail:", err);
    } finally {
      setIsLoadingDeposits(false);
    }
  };

  const fetchUsersList = async () => {
    try {
      const res = await fetch("/api/admin/users");
      const json = await res.json();
      if (json.success) {
        setUsers(json.users || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchUsersList();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchTransactions();
    }, 300);
    return () => clearTimeout(timer);
  }, [typeFilter, statusFilter, search]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchDeposits();
    }, 300);
    return () => clearTimeout(timer);
  }, [depositCategoryFilter, depositStatusFilter, depositSearch]);

  const handleUpdateStatus = async (item: any, newStatus: string, customNote?: string) => {
    setIsUpdatingStatus(true);
    try {
      const res = await fetch("/api/admin/transactions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: item.id,
          sourceTable: item.source_table,
          newStatus,
          adminNote: customNote || adminNote,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setVerifyModalOpen(false);
        setSelectedTx(null);
        setAdminNote("");
        fetchTransactions();
      } else {
        alert(json.error || "Gagal mengubah status transaksi");
      }
    } catch (err: any) {
      alert(err?.message || "Terjadi kesalahan");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleUpdateDepositStatus = async (item: any, newStatus: string, customNote?: string) => {
    setIsUpdatingDeposit(true);
    try {
      const res = await fetch("/api/admin/deposits", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: item.id,
          newStatus,
          adminNote: customNote !== undefined ? customNote : depositAdminNote,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setDepositModalOpen(false);
        setSelectedDeposit(null);
        setDepositAdminNote("");
        fetchDeposits();
        fetchTransactions(); // in case reward added to transactions
      } else {
        alert(json.error || "Gagal mengubah status setoran Gmail");
      }
    } catch (err: any) {
      alert(err?.message || "Terjadi kesalahan");
    } finally {
      setIsUpdatingDeposit(false);
    }
  };

  const handleCopy = (text: string, id: string) => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedGmailId(id);
      setTimeout(() => setCopiedGmailId(null), 2000);
    }
  };

  const pendingCount = transactions.filter(
    (t) => (t.status || "").toLowerCase() === "pending"
  ).length;

  return (
    <div className="space-y-8">
      {/* SECTION 1: MANAJEMEN TRANSAKSI & SALDO */}
      <div className="space-y-4">
        {/* Header bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <ArrowLeftRight className="w-5 h-5 text-emerald-400" />
              Manajemen Transaksi & Saldo
            </h2>
            <p className="text-xs text-zinc-400 mt-1">
              Verifikasi penarikan saldo pengguna dan pantau mutasi dompet secara real-time.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                fetchTransactions();
                fetchDeposits();
              }}
              isLoading={isLoading || isLoadingDeposits}
              className="flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading || isLoadingDeposits ? "animate-spin" : ""}`} />
              <span>Refresh</span>
            </Button>
          </div>
        </div>

        {/* Filter and Tab Pills */}
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          {/* Type tabs (Penarikan tanpa (WD)) */}
          <div className="flex items-center gap-1.5 p-1 bg-zinc-900 border border-zinc-800 rounded-xl overflow-x-auto w-full md:w-auto">
            {[
              { label: "Semua", value: "all" },
              { label: "Penarikan", value: "withdrawal" },
              { label: "Deposit / Top-up", value: "deposit" },
              { label: "Mutasi Saldo", value: "transaction" },
            ].map((tab) => (
              <button
                key={tab.value}
                onClick={() => setTypeFilter(tab.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                  typeFilter === tab.value
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Status filter + Search */}
          <div className="flex items-center gap-2.5 w-full md:w-auto">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            >
              <option value="all">Semua Status</option>
              <option value="pending">Hanya Pending ({pendingCount})</option>
              <option value="success">Hanya Berhasil</option>
              <option value="failed">Hanya Gagal/Ditolak</option>
            </select>

            <div className="relative flex-1 md:w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-zinc-400" />
              <input
                type="text"
                placeholder="Cari transaksi, email, ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              />
            </div>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-zinc-950/80 border-b border-zinc-800 text-zinc-400 font-semibold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">Tanggal</th>
                  <th className="py-3 px-4">Pengguna</th>
                  <th className="py-3 px-4">Tipe Transaksi</th>
                  <th className="py-3 px-4">Rincian & Keterangan</th>
                  <th className="py-3 px-4 text-right">Nominal</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Aksi Verifikasi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/80 text-zinc-200">
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-zinc-500">
                      <div className="flex flex-col items-center gap-2">
                        <RefreshCw className="w-5 h-5 animate-spin text-emerald-400" />
                        <span>Memuat riwayat transaksi...</span>
                      </div>
                    </td>
                  </tr>
                ) : transactions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-zinc-500">
                      Tidak ada transaksi yang cocok dengan kriteria filter.
                    </td>
                  </tr>
                ) : (
                  transactions.map((tx) => (
                    <tr
                      key={`${tx.source_table}-${tx.id}`}
                      className="hover:bg-zinc-800/40 transition-colors"
                    >
                      <td className="py-3 px-4 text-zinc-400 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-zinc-500" />
                          <span>
                            {new Date(tx.created_at).toLocaleDateString("id-ID", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-medium text-zinc-200">{tx.user_name}</div>
                        <div className="text-[11px] text-zinc-500">{tx.user_email}</div>
                      </td>

                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold border ${
                            tx.type === "withdrawal"
                              ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                              : tx.type === "deposit"
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                              : "bg-blue-500/10 text-blue-400 border-blue-500/20"
                          }`}
                        >
                          {tx.type === "withdrawal" && <ArrowUpRight className="w-3 h-3" />}
                          {tx.type === "deposit" && <ArrowDownLeft className="w-3 h-3" />}
                          {tx.type === "withdrawal"
                            ? "Penarikan"
                            : tx.type === "deposit"
                            ? "Deposit"
                            : "Mutasi"}
                        </span>
                      </td>

                      <td className="py-3 px-4 max-w-xs">
                        <div className="font-medium text-zinc-300 truncate">{tx.title}</div>
                        <div className="text-[11px] text-zinc-500 truncate">{tx.description}</div>
                      </td>

                      <td className="py-3 px-4 text-right font-mono font-bold whitespace-nowrap">
                        <span
                          className={
                            tx.type === "withdrawal" ? "text-rose-400" : "text-emerald-400"
                          }
                        >
                          {tx.type === "withdrawal" ? "-" : "+"}Rp{" "}
                          {Number(tx.amount).toLocaleString("id-ID")}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <StatusBadge status={tx.status} />
                      </td>

                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {tx.status === "pending" ? (
                            <>
                              <Button
                                variant="success"
                                size="sm"
                                onClick={() => handleUpdateStatus(tx, "success")}
                                className="px-2 py-1 text-[11px] flex items-center gap-1"
                              >
                                <CheckCircle className="w-3 h-3" />
                                <span>Setujui</span>
                              </Button>
                              <Button
                                variant="danger"
                                size="sm"
                                onClick={() => {
                                  setSelectedTx(tx);
                                  setVerifyModalOpen(true);
                                }}
                                className="px-2 py-1 text-[11px] flex items-center gap-1"
                              >
                                <XCircle className="w-3 h-3" />
                                <span>Tolak</span>
                              </Button>
                            </>
                          ) : (
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => {
                                setSelectedTx(tx);
                                setVerifyModalOpen(true);
                              }}
                              className="px-2 py-1 text-[11px] text-zinc-400 hover:text-zinc-200"
                            >
                              Detail
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* SECTION 2: LIST GMAIL YANG SUDAH DIBUAT / DITERIMA ADMIN */}
      <div id="setoran-gmail" className="pt-6 border-t border-zinc-800/80 space-y-4">
        {/* Header bar for Gmails */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <Mail className="w-5 h-5 text-emerald-400" />
              Daftar Setoran Gmail & Email Diterima Admin
            </h2>
            <p className="text-xs text-zinc-400 mt-1">
              Pantau dan verifikasi akun Gmail yang telah dibuat dan disetor pengguna, status penerimaan, dan pencairan saldo reward.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => fetchDeposits()}
              isLoading={isLoadingDeposits}
              className="flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingDeposits ? "animate-spin" : ""}`} />
              <span>Refresh Gmail</span>
            </Button>
          </div>
        </div>

        {/* 4 KPI Summary Cards for Gmail Submissions */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-xl bg-zinc-900/80 border border-zinc-800 shadow-sm">
            <div className="flex items-center justify-between text-zinc-400">
              <span className="text-[11px] font-medium uppercase tracking-wider">Total Setoran</span>
              <div className="w-7 h-7 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
                <Mail className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="mt-2">
              <div className="text-xl font-bold text-white tracking-tight">
                {depositStats.total.toLocaleString("id-ID")}
              </div>
              <p className="text-[11px] text-zinc-400 mt-0.5">Semua akun Gmail disetor</p>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-zinc-900/80 border border-zinc-800 shadow-sm">
            <div className="flex items-center justify-between text-zinc-400">
              <span className="text-[11px] font-medium uppercase tracking-wider">Diterima (Approved)</span>
              <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <CheckCircle className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="mt-2">
              <div className="text-xl font-bold text-emerald-400 tracking-tight">
                {depositStats.accepted.toLocaleString("id-ID")}
              </div>
              <p className="text-[11px] text-zinc-400 mt-0.5">Tervalidasi & Reward Cair</p>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-zinc-900/80 border border-zinc-800 shadow-sm">
            <div className="flex items-center justify-between text-zinc-400">
              <span className="text-[11px] font-medium uppercase tracking-wider">Menunggu Cek</span>
              <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
                <Clock className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="mt-2">
              <div className="text-xl font-bold text-amber-400 tracking-tight">
                {depositStats.pending.toLocaleString("id-ID")}
              </div>
              <p className="text-[11px] text-zinc-400 mt-0.5">Butuh verifikasi admin</p>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-zinc-900/80 border border-zinc-800 shadow-sm">
            <div className="flex items-center justify-between text-zinc-400">
              <span className="text-[11px] font-medium uppercase tracking-wider">Reward Diberikan</span>
              <div className="w-7 h-7 rounded-lg bg-teal-500/10 border border-teal-500/20 text-teal-400 flex items-center justify-center">
                <Wallet className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="mt-2">
              <div className="text-xl font-bold text-emerald-400 font-mono tracking-tight">
                Rp {depositStats.totalAmount.toLocaleString("id-ID")}
              </div>
              <p className="text-[11px] text-zinc-400 mt-0.5">Total saldo reward masuk</p>
            </div>
          </div>
        </div>

        {/* Filter and Search for Gmails */}
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-zinc-900 border border-zinc-800 rounded-xl overflow-x-auto w-full md:w-auto">
            {[
              { label: "Semua Kategori", value: "all" },
              { label: "Gmail Good (Rp 4.500)", value: "good" },
              { label: "Gmail Bebas (Rp 2.500)", value: "bebas" },
            ].map((tab) => (
              <button
                key={tab.value}
                onClick={() => setDepositCategoryFilter(tab.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                  depositCategoryFilter === tab.value
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Status filter + Search */}
          <div className="flex items-center gap-2.5 w-full md:w-auto">
            <select
              value={depositStatusFilter}
              onChange={(e) => setDepositStatusFilter(e.target.value)}
              className="bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            >
              <option value="all">Semua Status</option>
              <option value="pending">Menunggu Verifikasi ({depositStats.pending})</option>
              <option value="accepted">Diterima ({depositStats.accepted})</option>
              <option value="rejected">Ditolak ({depositStats.rejected})</option>
            </select>

            <div className="relative flex-1 md:w-72">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-zinc-400" />
              <input
                type="text"
                placeholder="Cari alamat Gmail, penyetor, DANA..."
                value={depositSearch}
                onChange={(e) => setDepositSearch(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              />
            </div>
          </div>
        </div>

        {/* Gmails Table */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-zinc-950/80 border-b border-zinc-800 text-zinc-400 font-semibold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">Tanggal Setor</th>
                  <th className="py-3 px-4">Akun Gmail Disetor</th>
                  <th className="py-3 px-4">Penyetor (Member)</th>
                  <th className="py-3 px-4">Kategori</th>
                  <th className="py-3 px-4 text-right">Reward</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4">Catatan</th>
                  <th className="py-3 px-4 text-right">Aksi Verifikasi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/80 text-zinc-200">
                {isLoadingDeposits ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-zinc-500">
                      <div className="flex flex-col items-center gap-2">
                        <RefreshCw className="w-5 h-5 animate-spin text-emerald-400" />
                        <span>Memuat data setoran Gmail...</span>
                      </div>
                    </td>
                  </tr>
                ) : deposits.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-zinc-500">
                      <div className="flex flex-col items-center gap-2 max-w-sm mx-auto">
                        <Mail className="w-8 h-8 text-zinc-600" />
                        <p className="font-medium text-zinc-400">Belum ada akun Gmail yang disetor</p>
                        <p className="text-[11px] text-zinc-600">
                          Data setoran akun Gmail dari pengguna melalui website setorgmail.com akan otomatis tampil dan bisa diverifikasi di sini.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  deposits.map((dep) => (
                    <tr key={dep.id} className="hover:bg-zinc-800/40 transition-colors">
                      <td className="py-3 px-4 text-zinc-400 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-zinc-500" />
                          <span>
                            {new Date(dep.created_at).toLocaleDateString("id-ID", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                      </td>

                      <td className="py-3 px-4 font-mono font-medium text-zinc-100">
                        <div className="flex items-center gap-2">
                          <span className="text-emerald-400">{dep.gmail}</span>
                          <button
                            type="button"
                            onClick={() => handleCopy(dep.gmail, dep.id)}
                            title="Salin Gmail"
                            className="text-zinc-500 hover:text-zinc-200 transition-colors p-1 rounded hover:bg-zinc-800"
                          >
                            {copiedGmailId === dep.id ? (
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-medium text-zinc-200">{dep.user_name}</div>
                        <div className="text-[11px] text-zinc-500">
                          {dep.user_email} • DANA: {dep.user_dana}
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold border ${
                            dep.category_id === "good"
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                              : "bg-blue-500/10 text-blue-400 border-blue-500/20"
                          }`}
                        >
                          {dep.category_label}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right font-mono font-bold text-emerald-400 whitespace-nowrap">
                        Rp {Number(dep.amount).toLocaleString("id-ID")}
                      </td>

                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wider ${
                            dep.status === "accepted"
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                              : dep.status === "rejected"
                              ? "bg-rose-500/10 text-rose-400 border-rose-500/20"
                              : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                          }`}
                        >
                          {dep.status === "accepted"
                            ? "Diterima"
                            : dep.status === "rejected"
                            ? "Ditolak"
                            : "Menunggu Cek"}
                        </span>
                      </td>

                      <td className="py-3 px-4 max-w-xs text-zinc-400 truncate">
                        {dep.note || "-"}
                      </td>

                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {dep.status === "pending" ? (
                            <>
                              <Button
                                variant="success"
                                size="sm"
                                onClick={() => handleUpdateDepositStatus(dep, "accepted", "Disetujui Admin")}
                                className="px-2 py-1 text-[11px] flex items-center gap-1"
                              >
                                <CheckCircle className="w-3 h-3" />
                                <span>Terima</span>
                              </Button>
                              <Button
                                variant="danger"
                                size="sm"
                                onClick={() => {
                                  setSelectedDeposit(dep);
                                  setDepositModalOpen(true);
                                }}
                                className="px-2 py-1 text-[11px] flex items-center gap-1"
                              >
                                <XCircle className="w-3 h-3" />
                                <span>Tolak</span>
                              </Button>
                            </>
                          ) : (
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => {
                                setSelectedDeposit(dep);
                                setDepositModalOpen(true);
                              }}
                              className="px-2 py-1 text-[11px] text-zinc-400 hover:text-zinc-200"
                            >
                              Detail
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Detail & Verification Modal for Transactions */}
      <Modal
        isOpen={verifyModalOpen}
        onClose={() => setVerifyModalOpen(false)}
        title="Rincian & Verifikasi Transaksi"
        subtitle={`ID: ${selectedTx?.id || "-"}`}
        footer={
          <div className="flex items-center justify-between w-full">
            <div className="text-xs text-zinc-500">
              Tabel Sumber: <span className="font-mono text-zinc-400">{selectedTx?.source_table}</span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                onClick={() => setVerifyModalOpen(false)}
                disabled={isUpdatingStatus}
              >
                Tutup
              </Button>
              {selectedTx?.status === "pending" && (
                <>
                  <Button
                    variant="danger"
                    onClick={() => handleUpdateStatus(selectedTx, "failed")}
                    isLoading={isUpdatingStatus}
                  >
                    Tolak Transaksi
                  </Button>
                  <Button
                    variant="success"
                    onClick={() => handleUpdateStatus(selectedTx, "success")}
                    isLoading={isUpdatingStatus}
                  >
                    Setujui Transaksi
                  </Button>
                </>
              )}
            </div>
          </div>
        }
      >
        <div className="space-y-4 text-xs">
          <div className="p-3 bg-zinc-950 border border-zinc-800 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-zinc-500">Pengguna:</span>
              <span className="font-semibold text-zinc-200">
                {selectedTx?.user_name} ({selectedTx?.user_email})
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-zinc-500">Nominal:</span>
              <span className="font-bold text-emerald-400 font-mono text-sm">
                Rp {Number(selectedTx?.amount || 0).toLocaleString("id-ID")}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-zinc-500">Status Saat Ini:</span>
              <StatusBadge status={selectedTx?.status} />
            </div>
          </div>

          {selectedTx?.details && (
            <div className="p-3 bg-zinc-950 border border-zinc-800 rounded-xl space-y-2">
              <p className="font-semibold text-zinc-300">Detail Rekening Tujuan:</p>
              <div className="grid grid-cols-2 gap-2 text-zinc-400">
                <div>
                  <span className="text-zinc-500">Metode:</span>
                  <p className="font-mono text-zinc-200">{selectedTx.details.method || "DANA"}</p>
                </div>
                <div>
                  <span className="text-zinc-500">Nomor Akun:</span>
                  <p className="font-mono text-zinc-200">{selectedTx.details.account_number || "-"}</p>
                </div>
                <div>
                  <span className="text-zinc-500">Nama Penerima:</span>
                  <p className="font-medium text-zinc-200">{selectedTx.details.account_name || "-"}</p>
                </div>
                <div>
                  <span className="text-zinc-500">Biaya Admin:</span>
                  <p className="font-mono text-zinc-200">
                    Rp {Number(selectedTx.details.tax_fee || 0).toLocaleString("id-ID")}
                  </p>
                </div>
              </div>
            </div>
          )}

          {selectedTx?.status === "pending" && (
            <div>
              <Textarea
                label="Catatan Admin (Alasan penolakan / bukti transfer)"
                placeholder="Contoh: Nomor DANA tidak valid / Saldo berhasil ditransfer ke DANA"
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
              />
            </div>
          )}
        </div>
      </Modal>

      {/* Detail & Verification Modal for Gmail Deposit */}
      <Modal
        isOpen={depositModalOpen}
        onClose={() => setDepositModalOpen(false)}
        title="Rincian & Verifikasi Setoran Gmail"
        subtitle={`ID: ${selectedDeposit?.id || "-"}`}
        footer={
          <div className="flex items-center justify-between w-full">
            <div className="text-xs text-zinc-500">
              Kategori: <span className="font-semibold text-emerald-400">{selectedDeposit?.category_label}</span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                onClick={() => setDepositModalOpen(false)}
                disabled={isUpdatingDeposit}
              >
                Tutup
              </Button>
              {selectedDeposit?.status === "pending" && (
                <>
                  <Button
                    variant="danger"
                    onClick={() => handleUpdateDepositStatus(selectedDeposit, "rejected")}
                    isLoading={isUpdatingDeposit}
                  >
                    Tolak Setoran
                  </Button>
                  <Button
                    variant="success"
                    onClick={() => handleUpdateDepositStatus(selectedDeposit, "accepted")}
                    isLoading={isUpdatingDeposit}
                  >
                    Terima & Tambah Saldo
                  </Button>
                </>
              )}
            </div>
          </div>
        }
      >
        <div className="space-y-4 text-xs">
          <div className="p-3 bg-zinc-950 border border-zinc-800 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-zinc-500">Akun Gmail:</span>
              <span className="font-mono font-bold text-emerald-400 text-sm">
                {selectedDeposit?.gmail}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-zinc-500">Penyetor (Member):</span>
              <span className="font-semibold text-zinc-200">
                {selectedDeposit?.user_name} ({selectedDeposit?.user_email})
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-zinc-500">Nomor DANA:</span>
              <span className="font-mono text-zinc-300">{selectedDeposit?.user_dana || "-"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-zinc-500">Reward Saldo:</span>
              <span className="font-bold text-emerald-400 font-mono text-sm">
                Rp {Number(selectedDeposit?.amount || 0).toLocaleString("id-ID")}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-zinc-500">Status Saat Ini:</span>
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wider ${
                  selectedDeposit?.status === "accepted"
                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                    : selectedDeposit?.status === "rejected"
                    ? "bg-rose-500/10 text-rose-400 border-rose-500/20"
                    : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                }`}
              >
                {selectedDeposit?.status === "accepted"
                  ? "Diterima"
                  : selectedDeposit?.status === "rejected"
                  ? "Ditolak"
                  : "Menunggu Cek"}
              </span>
            </div>
          </div>

          <div>
            <Textarea
              label="Catatan Admin / Alasan"
              placeholder="Contoh: Email valid & password sesuai / Password salah"
              value={depositAdminNote}
              onChange={(e) => setDepositAdminNote(e.target.value)}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
