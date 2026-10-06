"use client";

import React, { useEffect, useState } from "react";
import {
  Users,
  Search,
  Filter,
  Wallet,
  Shield,
  Ban,
  CheckCircle,
  RefreshCw,
  UserCheck,
  CheckCircle2,
  ExternalLink,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Input, Select, Textarea } from "@/components/ui/input";

// Branded color mapper for e-wallets
function getEwalletBadgeStyle(method: string) {
  const m = (method || "").toUpperCase();
  if (m === "DANA") {
    return "bg-sky-500/15 text-sky-400 border-sky-500/30";
  }
  if (m === "GOPAY") {
    return "bg-teal-500/15 text-teal-400 border-teal-500/30";
  }
  if (m === "OVO") {
    return "bg-purple-500/15 text-purple-400 border-purple-500/30";
  }
  if (m === "SHOPEEPAY") {
    return "bg-orange-500/15 text-orange-400 border-orange-500/30";
  }
  if (m === "LINKAJA") {
    return "bg-rose-500/15 text-rose-400 border-rose-500/30";
  }
  if (
    m.includes("BCA") ||
    m.includes("BRI") ||
    m.includes("BNI") ||
    m.includes("MANDIRI") ||
    m.includes("BANK")
  ) {
    return "bg-blue-600/15 text-blue-400 border-blue-500/30";
  }
  return "bg-zinc-800 text-zinc-300 border-zinc-700";
}

export default function UserManagementPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Edit Saldo Modal State
  const [saldoModalOpen, setSaldoModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [saldoActionType, setSaldoActionType] = useState<"set" | "add" | "subtract">("add");
  const [saldoAmountInput, setSaldoAmountInput] = useState("");
  const [saldoNote, setSaldoNote] = useState("");
  const [isUpdatingSaldo, setIsUpdatingSaldo] = useState(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);

      const res = await fetch(`/api/admin/users?${params.toString()}`);
      const json = await res.json();
      if (json.success) {
        const sorted = (json.users || []).sort((a: any, b: any) => {
          const aIsAdmin = a.role === "Admin" ? 1 : 0;
          const bIsAdmin = b.role === "Admin" ? 1 : 0;
          if (aIsAdmin !== bIsAdmin) return bIsAdmin - aIsAdmin;
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        });
        setUsers(sorted);
      }
    } catch (err) {
      console.error("Gagal memuat pengguna:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchUsers();
    }, 300);
    return () => clearTimeout(timeout);
  }, [search]);

  // Open Edit Saldo
  const handleOpenEditSaldo = (u: any) => {
    setSelectedUser(u);
    setSaldoActionType("add");
    setSaldoAmountInput("");
    setSaldoNote("");
    setActionSuccessMsg(null);
    setSaldoModalOpen(true);
  };

  // Submit Edit Saldo
  const handleSubmitSaldo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser || !saldoAmountInput) return;

    const numInput = Number(saldoAmountInput);
    if (isNaN(numInput) || numInput <= 0) {
      alert("Masukkan nominal yang valid");
      return;
    }

    let targetBalance = selectedUser.balance;
    if (saldoActionType === "set") {
      targetBalance = numInput;
    } else if (saldoActionType === "add") {
      targetBalance = selectedUser.balance + numInput;
    } else if (saldoActionType === "subtract") {
      targetBalance = Math.max(0, selectedUser.balance - numInput);
    }

    setIsUpdatingSaldo(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update_balance",
          userId: selectedUser.id,
          newBalance: targetBalance,
          note: saldoNote || `Penyesuaian saldo (${saldoActionType}) oleh admin`,
        }),
      });

      const resJson = await res.json();
      if (resJson.success) {
        setActionSuccessMsg(
          `Saldo ${selectedUser.name} berhasil diubah menjadi Rp ${targetBalance.toLocaleString("id-ID")}`
        );
        fetchUsers();
        setTimeout(() => {
          setSaldoModalOpen(false);
          setActionSuccessMsg(null);
        }, 1200);
      } else {
        alert(resJson.error || "Gagal memperbarui saldo");
      }
    } catch (err: any) {
      alert(err?.message || "Terjadi kesalahan");
    } finally {
      setIsUpdatingSaldo(false);
    }
  };

  // Toggle Role (Admin / User)
  const handleToggleRole = async (u: any) => {
    const targetRole = u.role === "Admin" ? "User" : "Admin";
    const confirm = window.confirm(
      `Apakah Anda yakin ingin mengubah role ${u.name || u.email} menjadi ${targetRole}?`
    );
    if (!confirm) return;

    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "toggle_role",
          userId: u.id,
          role: targetRole,
        }),
      });
      const json = await res.json();
      if (json.success) {
        fetchUsers();
      } else {
        alert(json.error || "Gagal mengubah role");
      }
    } catch (e: any) {
      alert(e?.message || "Terjadi kesalahan");
    }
  };

  // Toggle Block User
  const handleToggleBlock = async (u: any) => {
    const willBlock = !u.is_blocked;
    const confirm = window.confirm(
      `Apakah Anda yakin ingin ${willBlock ? "MEMBLOKIR" : "MEMBUKA BLOKIR"} akun ${
        u.name || u.email
      }?`
    );
    if (!confirm) return;

    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "toggle_block",
          userId: u.id,
          isBlocked: willBlock,
        }),
      });
      const json = await res.json();
      if (json.success) {
        fetchUsers();
      } else {
        alert(json.error || "Gagal mengubah status blokir");
      }
    } catch (e: any) {
      alert(e?.message || "Terjadi kesalahan");
    }
  };

  const totalBalanceAll = users.reduce((acc, u) => acc + (u.balance || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-400" />
            Manajemen Pengguna
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            Kelola data akun, sesuaikan saldo dompet pengguna, dan kontrol hak akses.
          </p>
        </div>

        <Button
          variant="secondary"
          size="sm"
          onClick={() => fetchUsers()}
          isLoading={isLoading}
          className="flex items-center gap-1.5"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
          <span>Refresh Pengguna</span>
        </Button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4">
          <span className="text-xs text-zinc-400">Total Pengguna Terdaftar</span>
          <p className="text-xl font-bold text-white mt-1">
            {users.length} Akun
          </p>
        </Card>
        <Card className="p-4">
          <span className="text-xs text-zinc-400">Total Saldo Terakumulasi</span>
          <p className="text-xl font-bold text-emerald-400 mt-1">
            Rp {totalBalanceAll.toLocaleString("id-ID")}
          </p>
        </Card>
        <Card className="p-4">
          <span className="text-xs text-zinc-400">Pengguna dengan Hak Admin</span>
          <p className="text-xl font-bold text-blue-400 mt-1">
            {users.filter((u) => u.role === "Admin").length} Admin
          </p>
        </Card>
      </div>

      {/* Search Bar */}
      <div className="w-full relative">
        <Search className="w-4 h-4 absolute left-3.5 top-3 text-zinc-400 pointer-events-none" />
        <input
          type="text"
          placeholder="Cari berdasarkan nama, email, e-wallet, kode referral, upline..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-10 pr-4 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
        />
      </div>

      {/* Table */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-zinc-950/80 border-b border-zinc-800 text-zinc-400 font-semibold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">Pengguna</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Kode Reff / Referral</th>
                <th className="py-3 px-4">E-Wallet Pengguna</th>
                <th className="py-3 px-4">Saldo Dompet</th>
                <th className="py-3 px-4">Status Akun</th>
                <th className="py-3 px-4">Bergabung</th>
                <th className="py-3 px-4 text-right">Aksi Admin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/80 text-zinc-200">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-zinc-500">
                    <div className="flex flex-col items-center gap-2">
                      <RefreshCw className="w-5 h-5 animate-spin text-emerald-400" />
                      <span>Memuat data pengguna dari Supabase...</span>
                    </div>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-zinc-500">
                    Tidak ditemukan data pengguna yang cocok.
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr
                    key={u.id}
                    className="hover:bg-zinc-800/40 transition-colors"
                  >
                    {/* User profile with Google/uploaded photo */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        {u.avatar_url ? (
                          <img
                            src={u.avatar_url}
                            alt={u.name}
                            className="w-8 h-8 rounded-full object-cover border border-zinc-700 shrink-0"
                            referrerPolicy="no-referrer"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = "none";
                              const fallback = (e.target as HTMLElement).nextElementSibling;
                              if (fallback) (fallback as HTMLElement).style.display = "flex";
                            }}
                          />
                        ) : null}
                        <div
                          className={`w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 text-zinc-200 items-center justify-center font-bold text-xs shrink-0 ${
                            u.avatar_url ? "hidden" : "flex"
                          }`}
                        >
                          {(u.name || u.email || "U").charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-zinc-100 truncate max-w-[170px]">
                            {u.name}
                          </p>
                          <p className="text-[11px] text-zinc-400 truncate max-w-[170px]">
                            {u.email}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Role (Sebelah Kiri Kode Reff) */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {u.role === "Admin" ? (
                        <Badge variant="primary">Admin</Badge>
                      ) : (
                        <Badge variant="neutral">Pengguna</Badge>
                      )}
                    </td>

                    {/* Kode Reff User & Reff Siapa (Upline) */}
                    <td className="py-3.5 px-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] text-zinc-500 font-medium">Reff:</span>
                          <span className="font-mono text-emerald-400 font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20 text-xs">
                            {u.referral_code || "-"}
                          </span>
                        </div>
                        <div className="text-[10px] text-zinc-400 flex items-center gap-1">
                          <span className="text-zinc-500">Upline:</span>
                          {u.referred_by_code ? (
                            <span className="text-zinc-200 font-mono font-medium">
                              {u.referred_by_code}
                              {u.referred_by_user ? ` (${u.referred_by_user.name})` : ""}
                            </span>
                          ) : (
                            <span className="text-zinc-600">- (Organik)</span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* E-Wallet Pengguna */}
                    <td className="py-3.5 px-4">
                      {!u.ewallets || u.ewallets.length === 0 ? (
                        <span className="text-zinc-600 text-[11px] italic">Belum diatur</span>
                      ) : (
                        <div className="space-y-1.5">
                          {u.ewallets.map((ew: any, idx: number) => (
                            <div key={`${ew.id || idx}`} className="flex items-center gap-1.5 flex-wrap">
                              <span
                                className={`px-1.5 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wider ${getEwalletBadgeStyle(
                                  ew.method
                                )}`}
                              >
                                {ew.method || "E-WALLET"}
                              </span>
                              <span className="font-mono text-zinc-200 font-medium text-xs">
                                {ew.account_number}
                              </span>
                              {ew.account_name && (
                                <span className="text-[10px] text-zinc-500 truncate max-w-[100px]">
                                  ({ew.account_name})
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </td>

                    {/* Saldo Dompet */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="font-mono">
                        <span className="font-bold text-emerald-400 text-sm">
                          Rp {Number(u.balance || 0).toLocaleString("id-ID")}
                        </span>
                        <p className="text-[10px] text-zinc-500">
                          Ditarik: Rp {Number(u.total_withdrawn || 0).toLocaleString("id-ID")}
                        </p>
                      </div>
                    </td>

                    {/* Status Akun */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {u.is_blocked ? (
                        <Badge variant="danger">Diblokir</Badge>
                      ) : (
                        <Badge variant="success">Aktif</Badge>
                      )}
                    </td>

                    {/* Bergabung */}
                    <td className="py-3.5 px-4 text-zinc-400 whitespace-nowrap">
                      {new Date(u.created_at).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>

                    {/* Aksi Admin (Tanpa Tombol Hapus Pengguna) */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Edit Saldo */}
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleOpenEditSaldo(u)}
                          title="Ubah Saldo Pengguna"
                          className="px-2 py-1 text-[11px] bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1"
                        >
                          <Wallet className="w-3.5 h-3.5" />
                          <span>Saldo</span>
                        </Button>

                        {/* Toggle Role */}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleRole(u)}
                          title={u.role === "Admin" ? "Turunkan ke Pengguna Biasa" : "Jadikan Admin"}
                          className="px-2 py-1 text-zinc-400 hover:text-blue-400"
                        >
                          {u.role === "Admin" ? (
                            <UserCheck className="w-3.5 h-3.5 text-blue-400" />
                          ) : (
                            <Shield className="w-3.5 h-3.5" />
                          )}
                        </Button>

                        {/* Toggle Block */}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleBlock(u)}
                          title={u.is_blocked ? "Buka Blokir" : "Blokir Akun"}
                          className={`px-2 py-1 ${
                            u.is_blocked ? "text-emerald-400 hover:text-emerald-300" : "text-zinc-400 hover:text-amber-400"
                          }`}
                        >
                          {u.is_blocked ? (
                            <CheckCircle className="w-3.5 h-3.5" />
                          ) : (
                            <Ban className="w-3.5 h-3.5" />
                          )}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Saldo Modal */}
      <Modal
        isOpen={saldoModalOpen}
        onClose={() => setSaldoModalOpen(false)}
        title={`Kelola Saldo: ${selectedUser?.name || "Pengguna"}`}
        subtitle={`Saldo Saat Ini: Rp ${Number(selectedUser?.balance || 0).toLocaleString("id-ID")}`}
        footer={
          <>
            <Button
              variant="ghost"
              onClick={() => setSaldoModalOpen(false)}
              disabled={isUpdatingSaldo}
            >
              Batal
            </Button>
            <Button
              variant="primary"
              onClick={handleSubmitSaldo}
              isLoading={isUpdatingSaldo}
            >
              Simpan Perubahan
            </Button>
          </>
        }
      >
        <form onSubmit={handleSubmitSaldo} className="space-y-4">
          {actionSuccessMsg && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{actionSuccessMsg}</span>
            </div>
          )}

          <div className="grid grid-cols-3 gap-2">
            {[
              { label: "+ Tambah", value: "add" },
              { label: "- Kurangi", value: "subtract" },
              { label: "= Set Langsung", value: "set" },
            ].map((opt) => (
              <button
                type="button"
                key={opt.value}
                onClick={() => setSaldoActionType(opt.value as any)}
                className={`py-2 text-xs font-semibold rounded-xl border transition-all ${
                  saldoActionType === opt.value
                    ? "bg-emerald-600 border-emerald-500 text-white shadow-sm"
                    : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:bg-zinc-800"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <Input
            label={
              saldoActionType === "set"
                ? "Saldo Baru (Rp)"
                : saldoActionType === "add"
                ? "Nominal Penambahan (Rp)"
                : "Nominal Pengurangan (Rp)"
            }
            type="number"
            placeholder="Contoh: 100000"
            value={saldoAmountInput}
            onChange={(e) => setSaldoAmountInput(e.target.value)}
            required
          />

          <Textarea
            label="Alasan / Catatan Transaksi"
            placeholder="Contoh: Penyesuaian bonus setoran Gmail tanggal 4 Oktober"
            value={saldoNote}
            onChange={(e) => setSaldoNote(e.target.value)}
          />
        </form>
      </Modal>
    </div>
  );
}
