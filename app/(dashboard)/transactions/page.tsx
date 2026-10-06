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

  const pendingCount = transactions.filter(
    (t) => (t.status || "").toLowerCase() === "pending"
  ).length;

  return (
    <div className="space-y-6">
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
              onClick={() => fetchTransactions()}
              isLoading={isLoading}
              className="flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
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
    </div>
  );
}
