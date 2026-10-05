"use client";

import React, { useEffect, useState } from "react";
import {
  ArrowLeftRight,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  PlusCircle,
  RefreshCw,
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  FileText,
  Clock,
  ExternalLink,
  AlertTriangle,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Input, Select, Textarea } from "@/components/ui/input";

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // New Transaction Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [targetUserId, setTargetUserId] = useState("");
  const [txType, setTxType] = useState<"deposit" | "withdrawal" | "adjustment">("deposit");
  const [txAmount, setTxAmount] = useState("");
  const [txTitle, setTxTitle] = useState("");
  const [txDescription, setTxDescription] = useState("");
  const [isSubmittingTx, setIsSubmittingTx] = useState(false);

  // Detail / Verification Modal
  const [verifyModalOpen, setVerifyModalOpen] = useState(false);
  const [selectedTx, setSelectedTx] = useState<any>(null);
  const [adminNote, setAdminNote] = useState("");
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

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

  const handleCreateManualTx = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetUserId || !txAmount) return;

    setIsSubmittingTx(true);
    try {
      const res = await fetch("/api/admin/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: targetUserId,
          type: txType,
          amount: Number(txAmount),
          title: txTitle || (txType === "deposit" ? "Deposit Saldo Manual" : "Penyesuaian Saldo"),
          description: txDescription || "Dibuat oleh admin melalui menu transaksi",
        }),
      });

      const json = await res.json();
      if (json.success) {
        setModalOpen(false);
        setTxAmount("");
        setTxTitle("");
        setTxDescription("");
        fetchTransactions();
      } else {
        alert(json.error || "Gagal membuat transaksi");
      }
    } catch (e: any) {
      alert(e?.message || "Terjadi kesalahan");
    } finally {
      setIsSubmittingTx(false);
    }
  };

  const pendingCount = transactions.filter(
    (t) => (t.status || "").toLowerCase() === "pending"
  ).length;

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <ArrowLeftRight className="w-5 h-5 text-emerald-400" />
            Manajemen Transaksi & Saldo
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            Verifikasi penarikan saldo pengguna, pantau mutasi dompet, dan input transaksi manual.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => fetchTransactions()}
            isLoading={isLoading}
            className="flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-1.5"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Input Transaksi Manual</span>
          </Button>
        </div>
      </div>

      {/* Filter and Tab Pills */}
      <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
        {/* Type tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-zinc-900 border border-zinc-800 rounded-xl overflow-x-auto w-full md:w-auto">
          {[
            { label: "Semua", value: "all" },
            { label: "Penarikan (WD)", value: "withdrawal" },
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

      {/* Table */}
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
                  <tr key={`${tx.source_table}-${tx.id}`} className="hover:bg-zinc-800/40 transition-colors">
                    {/* Date */}
                    <td className="py-3.5 px-4 text-zinc-400 whitespace-nowrap">
                      {new Date(tx.created_at).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>

                    {/* User */}
                    <td className="py-3.5 px-4">
                      <div className="min-w-0">
                        <p className="font-semibold text-zinc-200 truncate max-w-[160px]">
                          {tx.user_name}
                        </p>
                        <p className="text-[11px] text-zinc-400 truncate max-w-[160px]">
                          {tx.user_email}
                        </p>
                      </div>
                    </td>

                    {/* Type */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {tx.type === "withdrawal" ? (
                        <span className="inline-flex items-center gap-1 text-amber-400 font-medium">
                          <ArrowDownLeft className="w-3.5 h-3.5" />
                          Penarikan
                        </span>
                      ) : tx.type === "deposit" || tx.type === "manual_credit" ? (
                        <span className="inline-flex items-center gap-1 text-emerald-400 font-medium">
                          <ArrowUpRight className="w-3.5 h-3.5" />
                          Deposit / Top-up
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-blue-400 font-medium">
                          <ArrowLeftRight className="w-3.5 h-3.5" />
                          {tx.type}
                        </span>
                      )}
                    </td>

                    {/* Details */}
                    <td className="py-3.5 px-4 max-w-xs">
                      <p className="font-medium text-zinc-200 truncate">
                        {tx.title}
                      </p>
                      <p className="text-[11px] text-zinc-400 truncate">
                        {tx.description}
                      </p>
                    </td>

                    {/* Amount */}
                    <td className="py-3.5 px-4 text-right font-mono font-bold whitespace-nowrap">
                      <span
                        className={
                          tx.type === "deposit" || tx.type === "manual_credit"
                            ? "text-emerald-400"
                            : "text-zinc-200"
                        }
                      >
                        {tx.type === "deposit" || tx.type === "manual_credit" ? "+" : "-"}
                        Rp {Number(tx.amount).toLocaleString("id-ID")}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <StatusBadge status={tx.status} />
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        {tx.status === "pending" ? (
                          <>
                            <Button
                              variant="success"
                              size="sm"
                              onClick={() => handleUpdateStatus(tx, "success")}
                              className="px-2.5 py-1 text-[11px] flex items-center gap-1"
                              title="Setujui transaksi"
                            >
                              <CheckCircle className="w-3.5 h-3.5" />
                              <span>Setujui</span>
                            </Button>
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() => {
                                setSelectedTx(tx);
                                setVerifyModalOpen(true);
                              }}
                              className="px-2.5 py-1 text-[11px] flex items-center gap-1"
                              title="Tolak transaksi"
                            >
                              <XCircle className="w-3.5 h-3.5" />
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

      {/* Manual Transaction Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Input Transaksi Saldo Manual"
        subtitle="Saldo pengguna akan otomatis terupdate di Supabase"
        footer={
          <>
            <Button
              variant="ghost"
              onClick={() => setModalOpen(false)}
              disabled={isSubmittingTx}
            >
              Batal
            </Button>
            <Button
              variant="primary"
              onClick={handleCreateManualTx}
              isLoading={isSubmittingTx}
            >
              Proses Transaksi
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreateManualTx} className="space-y-4">
          <Select
            label="Pilih Pengguna"
            value={targetUserId}
            onChange={(e) => setTargetUserId(e.target.value)}
            options={[
              { label: "-- Pilih Akun Pengguna --", value: "" },
              ...users.map((u) => ({
                label: `${u.name || "User"} (${u.email}) - Saldo: Rp ${Number(u.balance).toLocaleString("id-ID")}`,
                value: u.id,
              })),
            ]}
            required
          />

          <Select
            label="Tipe Transaksi"
            value={txType}
            onChange={(e: any) => setTxType(e.target.value)}
            options={[
              { label: "Deposit / Top-up Saldo (+)", value: "deposit" },
              { label: "Penarikan / Pemotongan Saldo (-)", value: "withdrawal" },
              { label: "Penyesuaian Saldo Sistem", value: "adjustment" },
            ]}
          />

          <Input
            label="Nominal (Rp)"
            type="number"
            placeholder="Contoh: 75000"
            value={txAmount}
            onChange={(e) => setTxAmount(e.target.value)}
            required
          />

          <Input
            label="Judul Transaksi"
            placeholder="Contoh: Bonus Setoran Gmail"
            value={txTitle}
            onChange={(e) => setTxTitle(e.target.value)}
          />

          <Textarea
            label="Keterangan / Catatan Admin"
            placeholder="Tuliskan alasan penambahan/pemotongan saldo..."
            value={txDescription}
            onChange={(e) => setTxDescription(e.target.value)}
          />
        </form>
      </Modal>

      {/* Detail & Verification Modal */}
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
              <span className="font-semibold text-zinc-200">{selectedTx?.user_name} ({selectedTx?.user_email})</span>
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
                  <p className="font-mono text-zinc-200">Rp {Number(selectedTx.details.tax_fee || 0).toLocaleString("id-ID")}</p>
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
    </div>
  );
}
