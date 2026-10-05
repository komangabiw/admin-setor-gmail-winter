"use client";

import React, { useEffect, useState } from "react";
import {
  Users,
  Search,
  Filter,
  Wallet,
  Shield,
  ShieldAlert,
  Ban,
  CheckCircle,
  Trash2,
  Edit3,
  UserCheck,
  UserX,
  RefreshCw,
  Plus,
  AlertCircle,
  CheckCircle2,
  ExternalLink,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Input, Select, Textarea } from "@/components/ui/input";

export default function UserManagementPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  // Edit Saldo Modal State
  const [saldoModalOpen, setSaldoModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [saldoActionType, setSaldoActionType] = useState<"set" | "add" | "subtract">("add");
  const [saldoAmountInput, setSaldoAmountInput] = useState("");
  const [saldoNote, setSaldoNote] = useState("");
  const [isUpdatingSaldo, setIsUpdatingSaldo] = useState(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  // Delete User Modal State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (roleFilter && roleFilter !== "all") params.set("role", roleFilter);

      const res = await fetch(`/api/admin/users?${params.toString()}`);
      const json = await res.json();
      if (json.success) {
        setUsers(json.users || []);
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
  }, [search, roleFilter]);

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
        setActionSuccessMsg(`Saldo ${selectedUser.name} berhasil diubah menjadi Rp ${targetBalance.toLocaleString("id-ID")}`);
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

  // Toggle Block
  const handleToggleBlock = async (u: any) => {
    const willBlock = !u.is_blocked;
    const confirm = window.confirm(
      willBlock
        ? `Blokir akun ${u.name || u.email}? Pengguna tidak akan bisa login ke aplikasi.`
        : `Buka blokir akun ${u.name || u.email}?`
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

  // Delete User
  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    setIsDeleting(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: userToDelete.id }),
      });
      const json = await res.json();
      if (json.success) {
        setDeleteModalOpen(false);
        setUserToDelete(null);
        fetchUsers();
      } else {
        alert(json.error || "Gagal menghapus user");
      }
    } catch (e: any) {
      alert(e?.message || "Terjadi kesalahan");
    } finally {
      setIsDeleting(false);
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
          className="flex items-center gap-1.5 self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
          <span>Refresh Pengguna</span>
        </Button>
      </div>

      {/* Summary Chips */}
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

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="w-full sm:flex-1 relative">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-zinc-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Cari berdasarkan nama, email, nomor DANA, atau kode referral..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-10 pr-4 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
          />
        </div>

        <div className="w-full sm:w-48">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
          >
            <option value="all">Semua Role</option>
            <option value="Admin">Hanya Admin</option>
            <option value="User">Hanya Pengguna</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-zinc-950/80 border-b border-zinc-800 text-zinc-400 font-semibold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">Pengguna</th>
                <th className="py-3 px-4">Kontak / DANA</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Saldo Dompet</th>
                <th className="py-3 px-4">Status Akun</th>
                <th className="py-3 px-4">Bergabung</th>
                <th className="py-3 px-4 text-right">Aksi Admin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/80 text-zinc-200">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-zinc-500">
                    <div className="flex flex-col items-center gap-2">
                      <RefreshCw className="w-5 h-5 animate-spin text-emerald-400" />
                      <span>Memuat data pengguna dari Supabase...</span>
                    </div>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-zinc-500">
                    Tidak ditemukan data pengguna yang cocok.
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr
                    key={u.id}
                    className="hover:bg-zinc-800/40 transition-colors"
                  >
                    {/* User profile */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 text-zinc-200 flex items-center justify-center font-bold shrink-0">
                          {(u.name || u.email).charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-zinc-100 truncate max-w-[180px]">
                            {u.name}
                          </p>
                          <p className="text-[11px] text-zinc-400 truncate max-w-[180px]">
                            {u.email}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Contact & Dana */}
                    <td className="py-3.5 px-4 font-mono">
                      <p className="text-zinc-200">{u.dana_number || "-"}</p>
                      {u.referral_code && (
                        <p className="text-[10px] text-zinc-500">
                          Ref: {u.referral_code}
                        </p>
                      )}
                    </td>

                    {/* Role */}
                    <td className="py-3.5 px-4">
                      {u.role === "Admin" ? (
                        <Badge variant="primary">Admin</Badge>
                      ) : (
                        <Badge variant="neutral">Pengguna</Badge>
                      )}
                    </td>

                    {/* Saldo */}
                    <td className="py-3.5 px-4">
                      <div className="font-mono">
                        <span className="font-bold text-emerald-400 text-sm">
                          Rp {Number(u.balance || 0).toLocaleString("id-ID")}
                        </span>
                        <p className="text-[10px] text-zinc-500">
                          Ditarik: Rp {Number(u.total_withdrawn || 0).toLocaleString("id-ID")}
                        </p>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4">
                      {u.is_blocked ? (
                        <Badge variant="danger">Diblokir</Badge>
                      ) : (
                        <Badge variant="success">Aktif</Badge>
                      )}
                    </td>

                    {/* Created date */}
                    <td className="py-3.5 px-4 text-zinc-400">
                      {new Date(u.created_at).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Edit Saldo */}
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleOpenEditSaldo(u)}
                          title="Ubah Saldo Pengguna"
                          className="px-2 py-1 text-[11px] bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
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

                        {/* Delete User */}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setUserToDelete(u);
                            setDeleteModalOpen(true);
                          }}
                          title="Hapus Akun Pengguna"
                          className="px-2 py-1 text-zinc-400 hover:text-rose-400"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
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
        title="Kelola Saldo Pengguna"
        subtitle={`Pengguna: ${selectedUser?.name} (${selectedUser?.email})`}
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
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{actionSuccessMsg}</span>
            </div>
          )}

          {/* Current Balance Card */}
          <div className="p-3 bg-zinc-950 border border-zinc-800 rounded-xl flex items-center justify-between">
            <div>
              <span className="text-xs text-zinc-500">Saldo Terkini Saat Ini</span>
              <p className="text-lg font-bold font-mono text-emerald-400">
                Rp {Number(selectedUser?.balance || 0).toLocaleString("id-ID")}
              </p>
            </div>
            <Badge variant="outline">Wallet ID: {selectedUser?.wallet_id?.slice(0, 8) || "Baru"}</Badge>
          </div>

          {/* Action Type Selector */}
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1.5">
              Metode Penyesuaian Saldo
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setSaldoActionType("add")}
                className={`py-2 px-3 text-xs font-semibold rounded-lg border transition-all ${
                  saldoActionType === "add"
                    ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/50"
                    : "bg-zinc-950 text-zinc-400 border-zinc-800 hover:text-zinc-200"
                }`}
              >
                + Tambah Saldo
              </button>
              <button
                type="button"
                onClick={() => setSaldoActionType("subtract")}
                className={`py-2 px-3 text-xs font-semibold rounded-lg border transition-all ${
                  saldoActionType === "subtract"
                    ? "bg-amber-500/20 text-amber-300 border-amber-500/50"
                    : "bg-zinc-950 text-zinc-400 border-zinc-800 hover:text-zinc-200"
                }`}
              >
                - Kurangi Saldo
              </button>
              <button
                type="button"
                onClick={() => setSaldoActionType("set")}
                className={`py-2 px-3 text-xs font-semibold rounded-lg border transition-all ${
                  saldoActionType === "set"
                    ? "bg-blue-500/20 text-blue-300 border-blue-500/50"
                    : "bg-zinc-950 text-zinc-400 border-zinc-800 hover:text-zinc-200"
                }`}
              >
                = Set Saldo Pas
              </button>
            </div>
          </div>

          <Input
            label={
              saldoActionType === "set"
                ? "Total Saldo Baru (Rp)"
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

      {/* Delete User Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Konfirmasi Hapus Pengguna"
        maxWidth="sm"
        footer={
          <>
            <Button
              variant="ghost"
              onClick={() => setDeleteModalOpen(false)}
              disabled={isDeleting}
            >
              Batal
            </Button>
            <Button
              variant="danger"
              onClick={handleDeleteUser}
              isLoading={isDeleting}
            >
              Hapus Permanen
            </Button>
          </>
        }
      >
        <div className="space-y-3 text-zinc-300 text-sm">
          <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto mb-2">
            <AlertCircle className="w-6 h-6" />
          </div>
          <p className="text-center">
            Apakah Anda yakin ingin menghapus akun <b>{userToDelete?.name || userToDelete?.email}</b>?
          </p>
          <p className="text-xs text-rose-400 text-center leading-relaxed">
            Peringatan: Seluruh data pengguna, dompet saldo, riwayat transaksi, dan tiket terkait akan dihapus secara permanen dari Supabase.
          </p>
        </div>
      </Modal>
    </div>
  );
}
