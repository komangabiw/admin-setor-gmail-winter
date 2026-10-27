"use client";

import React, { useEffect, useState } from "react";
import {
  Users,
  Search,
  Wallet,
  Ban,
  CheckCircle,
  RefreshCw,
  UserCheck,
  CheckCircle2,
  Copy,
  Check,
  ChevronRight,
  ExternalLink,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Input, Textarea } from "@/components/ui/input";

type SortField = "created_at" | "balance";
type SortOrder = "asc" | "desc";

function getEwalletBadgeStyle(method: string) {
  const m = (method || "").toUpperCase();
  if (m === "DANA") return "bg-sky-500/15 text-sky-400 border-sky-500/30";
  if (m === "GOPAY") return "bg-teal-500/15 text-teal-400 border-teal-500/30";
  if (m === "OVO") return "bg-purple-500/15 text-purple-400 border-purple-500/30";
  if (m === "SHOPEEPAY") return "bg-orange-500/15 text-orange-400 border-orange-500/30";
  if (m === "LINKAJA") return "bg-rose-500/15 text-rose-400 border-rose-500/30";
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

export const UsersTab = React.memo(function UsersTab({
  onUserUpdated,
}: {
  onUserUpdated?: () => void;
}) {
  const [users, setUsers] = useState<any[]>([]);
  const [totalUsers, setTotalUsers] = useState<number>(0);
  const [limit, setLimit] = useState<"50" | "100" | "all">("50");
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Sorting state (Saldo & Bergabung)
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder | null>(null);

  // Detail User Popup Modal State
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [detailUser, setDetailUser] = useState<any>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedUid, setCopiedUid] = useState(false);
  const [copiedUidMap, setCopiedUidMap] = useState<Record<string, boolean>>({});

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
      params.set("limit", limit);

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
        setTotalUsers(typeof json.total === "number" ? json.total : sorted.length);
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
  }, [search, limit]);

  useEffect(() => {
    const handleGlobalRefresh = () => {
      fetchUsers();
    };
    window.addEventListener("admin_refresh_all", handleGlobalRefresh);
    return () => window.removeEventListener("admin_refresh_all", handleGlobalRefresh);
  }, []);

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

    let targetBalance = selectedUser.balance || 0;
    if (saldoActionType === "set") {
      targetBalance = numInput;
    } else if (saldoActionType === "add") {
      targetBalance = (selectedUser.balance || 0) + numInput;
    } else if (saldoActionType === "subtract") {
      targetBalance = Math.max(0, (selectedUser.balance || 0) - numInput);
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
        if (onUserUpdated) onUserUpdated();
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


  // Toggle Block User
  const handleToggleBlock = async (u: any) => {
    if (u.role === "Admin") {
      alert("Tidak dapat memblokir akun sesama Admin");
      return;
    }
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
        if (onUserUpdated) onUserUpdated();
      } else {
        alert(json.error || "Gagal mengubah status blokir");
      }
    } catch (e: any) {
      alert(e?.message || "Terjadi kesalahan");
    }
  };

  const handleToggleSort = (field: SortField) => {
    if (sortField === field) {
      if (sortOrder === "asc") {
        setSortOrder("desc"); // ke bawah
      } else if (sortOrder === "desc") {
        setSortField(null); // normal
        setSortOrder(null);
      } else {
        setSortOrder("asc");
      }
    } else {
      setSortField(field);
      setSortOrder("asc"); // ke atas dlu
    }
  };

  const sortedUsers = React.useMemo(() => {
    return [...users].sort((a: any, b: any) => {
      // 1. Admin SELALU tetap di atas, tidak terpengaruh sort saldo atau bergabung!
      const aIsAdmin = a.role === "Admin" ? 1 : 0;
      const bIsAdmin = b.role === "Admin" ? 1 : 0;
      if (aIsAdmin !== bIsAdmin) return bIsAdmin - aIsAdmin;

      // 2. Sort jika aktif
      if (sortField === "balance" && sortOrder) {
        const balA = Number(a.balance || 0);
        const balB = Number(b.balance || 0);
        return sortOrder === "asc" ? balA - balB : balB - balA;
      }
      if (sortField === "created_at" && sortOrder) {
        const timeA = new Date(a.created_at).getTime();
        const timeB = new Date(b.created_at).getTime();
        return sortOrder === "asc" ? timeA - timeB : timeB - timeA;
      }

      // 3. Normal / default (terbaru ke terlama)
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }, [users, sortField, sortOrder]);

  return (
    <div className="space-y-4">
      {/* Search & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="w-full sm:max-w-md relative">
          <Search className="w-4 h-4 absolute left-3.5 top-2.5 text-zinc-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Cari berdasarkan nama, email, e-wallet, kode referral, upline..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-zinc-950/80 border border-zinc-800 rounded-xl pl-10 pr-4 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {/* Limit selector: 50, 100, all */}
          <div className="flex items-center gap-1 bg-zinc-950/80 border border-zinc-800 rounded-lg p-1 text-xs">
            <span className="text-[11px] text-zinc-400 px-1 font-medium">Tampilkan:</span>
            {(["50", "100", "all"] as const).map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => setLimit(opt)}
                className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-colors cursor-pointer ${
                  limit === opt
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
                }`}
              >
                {opt === "all" ? "Semua" : opt}
              </button>
            ))}
          </div>

          <span className="text-[11px] text-zinc-400">
            {limit !== "all" && totalUsers > users.length ? (
              <>
                <b className="text-white font-mono">{users.length}</b> dari{" "}
                <b className="text-white font-mono">{totalUsers}</b>
              </>
            ) : (
              <>
                Total: <b className="text-white font-mono">{totalUsers || users.length}</b>
              </>
            )}{" "}
            pengguna
          </span>
        </div>
      </div>

      {/* Table Sederhana Pengguna (Pengguna, Role, UID, Saldo, Bergabung) */}
      <div className="bg-zinc-950/60 border border-zinc-800/80 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-zinc-950 border-b border-zinc-800 text-zinc-400 font-semibold uppercase tracking-wider text-[10px]">
                <th className="py-3.5 px-4">Pengguna</th>
                <th className="py-3.5 px-4">UID</th>
                <th className="py-3.5 px-4">Role</th>
                <th
                  onClick={() => handleToggleSort("balance")}
                  className="py-3.5 px-4 cursor-pointer hover:text-zinc-200 transition-colors select-none group"
                  title="Klik untuk mengurutkan saldo (atas / bawah / normal)"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Saldo</span>
                    {sortField === "balance" ? (
                      sortOrder === "asc" ? (
                        <ArrowUp className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <ArrowDown className="w-3.5 h-3.5 text-emerald-400" />
                      )
                    ) : (
                      <ArrowUpDown className="w-3.5 h-3.5 text-zinc-500 group-hover:text-zinc-300 transition-colors" />
                    )}
                  </div>
                </th>
                <th
                  onClick={() => handleToggleSort("created_at")}
                  className="py-3.5 px-4 cursor-pointer hover:text-zinc-200 transition-colors select-none group"
                  title="Klik untuk mengurutkan tanggal bergabung (atas / bawah / normal)"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Bergabung</span>
                    {sortField === "created_at" ? (
                      sortOrder === "asc" ? (
                        <ArrowUp className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <ArrowDown className="w-3.5 h-3.5 text-emerald-400" />
                      )
                    ) : (
                      <ArrowUpDown className="w-3.5 h-3.5 text-zinc-500 group-hover:text-zinc-300 transition-colors" />
                    )}
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/70 text-zinc-200">
              {isLoading && users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-zinc-500">
                    <div className="flex flex-col items-center gap-2">
                      <RefreshCw className="w-5 h-5 animate-spin text-emerald-400" />
                      <span>Memuat data pengguna dari database...</span>
                    </div>
                  </td>
                </tr>
              ) : sortedUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-zinc-500">
                    Tidak ditemukan data pengguna yang cocok.
                  </td>
                </tr>
              ) : (
                sortedUsers.map((u) => (
                  <tr
                    key={u.id}
                    onClick={() => {
                      setDetailUser(u);
                      setDetailModalOpen(true);
                    }}
                    className="hover:bg-zinc-900/80 transition-colors cursor-pointer group"
                    title="Klik untuk melihat detail lengkap pengguna"
                  >
                    {/* 1. Pengguna */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        {u.avatar_url ? (
                          <img
                            src={u.avatar_url}
                            alt={u.name}
                            className="w-9 h-9 rounded-full object-cover border border-zinc-700 shrink-0"
                            referrerPolicy="no-referrer"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = "none";
                              const fallback = (e.target as HTMLElement).nextElementSibling;
                              if (fallback) (fallback as HTMLElement).style.display = "flex";
                            }}
                          />
                        ) : null}
                        <div
                          className={`w-9 h-9 rounded-full bg-zinc-800 border border-zinc-700 text-zinc-200 items-center justify-center font-bold text-xs shrink-0 ${
                            u.avatar_url ? "hidden" : "flex"
                          }`}
                        >
                          {(u.name || u.email || "U").charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-zinc-100 group-hover:text-emerald-400 transition-colors truncate max-w-[200px] sm:max-w-[280px]">
                            {u.name}
                          </p>
                          <p className="text-[11px] text-zinc-400 truncate max-w-[200px] sm:max-w-[280px]">
                            {u.email}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* 2. UID (Full, disebelah kiri role) */}
                    <td className="py-3.5 px-4 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-1.5">
                        <span
                          className="font-mono text-[11px] text-zinc-300 bg-zinc-900/90 px-2 py-0.5 rounded border border-zinc-800 select-all"
                          title={u.id}
                        >
                          {u.id || "-"}
                        </span>
                        {u.id && (
                          <button
                            type="button"
                            onClick={() => {
                              if (navigator?.clipboard) {
                                navigator.clipboard.writeText(u.id);
                                setCopiedUidMap((prev) => ({ ...prev, [u.id]: true }));
                                setTimeout(() => setCopiedUidMap((prev) => ({ ...prev, [u.id]: false })), 1500);
                              }
                            }}
                            className="p-1 rounded text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 transition-colors shrink-0"
                            title="Salin UID"
                          >
                            {copiedUidMap[u.id] ? (
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        )}
                      </div>
                    </td>

                    {/* 3. Role */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {u.role === "Admin" ? (
                        <Badge variant="primary" className="text-[10px]">Admin</Badge>
                      ) : (
                        <Badge variant="neutral" className="text-[10px]">User</Badge>
                      )}
                    </td>

                    {/* 4. Saldo */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="font-mono">
                        <span className="font-bold text-emerald-400 text-xs sm:text-sm">
                          Rp {Number(u.balance || 0).toLocaleString("id-ID")}
                        </span>
                        <p className="text-[10px] text-zinc-500">
                          Ditarik: Rp {Number(u.total_withdrawn || 0).toLocaleString("id-ID")}
                        </p>
                      </div>
                    </td>

                    {/* 5. Bergabung */}
                    <td className="py-3.5 px-4 text-zinc-400 whitespace-nowrap text-[11px]">
                      {new Date(u.created_at).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {limit !== "all" && totalUsers > users.length && (
          <div className="p-3 bg-zinc-950/90 border-t border-zinc-800/80 text-xs text-zinc-400">
            Menampilkan <b className="text-zinc-200">{users.length}</b> dari{" "}
            <b className="text-zinc-200">{totalUsers}</b> pengguna (Klik baris pengguna untuk informasi lebih lanjut)
          </div>
        )}
      </div>

      {/* Popup Informasi Lebih Lanjut Pengguna */}
      <Modal
        isOpen={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        title="Informasi Lengkap Pengguna"
        subtitle={detailUser?.email}
        maxWidth="lg"
      >
        {detailUser && (
          <div className="space-y-4">
            {/* Header Profil User */}
            <div className="flex items-center gap-3 p-3.5 bg-zinc-950/80 rounded-xl border border-zinc-800">
              {detailUser.avatar_url ? (
                <img
                  src={detailUser.avatar_url}
                  alt={detailUser.name}
                  className="w-12 h-12 rounded-full object-cover border border-zinc-700 shrink-0"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-zinc-800 border border-zinc-700 text-zinc-200 flex items-center justify-center font-bold text-base shrink-0">
                  {(detailUser.name || detailUser.email || "U").charAt(0).toUpperCase()}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="font-bold text-white text-sm truncate">{detailUser.name}</h4>
                  <Badge variant={detailUser.role === "Admin" ? "primary" : "neutral"} className="text-[10px]">
                    {detailUser.role === "Admin" ? "Admin" : "User"}
                  </Badge>
                  <Badge variant={detailUser.is_blocked ? "danger" : "success"} className="text-[10px]">
                    {detailUser.is_blocked ? "Diblokir" : "Aktif"}
                  </Badge>
                </div>
                <p className="text-xs text-zinc-400 truncate mt-0.5">{detailUser.email}</p>
                <p className="text-[10px] text-zinc-500 mt-1">
                  Bergabung: {new Date(detailUser.created_at).toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              </div>
            </div>

            {/* User ID (UID) */}
            <div className="flex items-center justify-between p-3 bg-zinc-950/60 rounded-xl border border-zinc-800/80 text-xs">
              <span className="text-zinc-400 font-medium">User ID (UID):</span>
              <div className="flex items-center gap-1.5">
                <span className="font-mono text-zinc-300 font-semibold select-all text-[11px] bg-zinc-900/90 px-2 py-0.5 rounded border border-zinc-800">
                  {detailUser.id}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    if (navigator?.clipboard) {
                      navigator.clipboard.writeText(detailUser.id);
                      setCopiedUid(true);
                      setTimeout(() => setCopiedUid(false), 1500);
                    }
                  }}
                  className="p-1 rounded text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
                  title="Salin UID"
                >
                  {copiedUid ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Saldo Dompet & Keuangan */}
            <div className="grid grid-cols-2 gap-3 p-3.5 bg-zinc-950/60 rounded-xl border border-zinc-800/80">
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">Saldo Dompet Saat Ini</span>
                <p className="text-lg font-bold font-mono text-emerald-400 mt-0.5">
                  Rp {Number(detailUser.balance || 0).toLocaleString("id-ID")}
                </p>
              </div>
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">Total Telah Ditarik</span>
                <p className="text-lg font-bold font-mono text-zinc-200 mt-0.5">
                  Rp {Number(detailUser.total_withdrawn || 0).toLocaleString("id-ID")}
                </p>
              </div>
            </div>

            {/* Kode Referral & Upline */}
            <div className="p-3.5 bg-zinc-950/60 rounded-xl border border-zinc-800/80 space-y-2.5">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">Referral & Afiliasi</span>
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-400">Kode Reff Sendiri:</span>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                    {detailUser.referral_code || "-"}
                  </span>
                  {detailUser.referral_code && (
                    <button
                      type="button"
                      onClick={() => {
                        if (navigator?.clipboard) {
                          navigator.clipboard.writeText(detailUser.referral_code);
                          setCopiedCode(true);
                          setTimeout(() => setCopiedCode(false), 1500);
                        }
                      }}
                      className="p-1 rounded text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
                      title="Salin Kode Reff"
                    >
                      {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-400">Upline (Direkrut Oleh):</span>
                <span className="font-mono text-zinc-200">
                  {detailUser.referred_by_code ? (
                    `${detailUser.referred_by_code} ${detailUser.referred_by_user?.name ? `(${detailUser.referred_by_user.name})` : ""}`
                  ) : (
                    <span className="text-zinc-500">- (Organik)</span>
                  )}
                </span>
              </div>
            </div>

            {/* E-Wallet Pengguna */}
            <div className="p-3.5 bg-zinc-950/60 rounded-xl border border-zinc-800/80 space-y-2">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">E-Wallet / Rekening Tersimpan</span>
              {!detailUser.ewallets || detailUser.ewallets.length === 0 ? (
                <p className="text-zinc-500 text-xs italic">Pengguna belum mengatur akun e-wallet / rekening bank.</p>
              ) : (
                <div className="space-y-1.5">
                  {detailUser.ewallets.map((ew: any, idx: number) => (
                    <div key={`${ew.id || idx}`} className="flex items-center justify-between p-2.5 rounded-lg bg-zinc-900/60 border border-zinc-800 text-xs">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wider ${getEwalletBadgeStyle(ew.method)}`}>
                          {ew.method || "E-WALLET"}
                        </span>
                        <span className="font-mono text-white font-semibold">{ew.account_number}</span>
                      </div>
                      {ew.account_name && (
                        <span className="text-zinc-400 text-[11px]">a.n. {ew.account_name}</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Aksi Admin */}
            <div className="pt-2 flex items-center justify-between gap-2.5">
              <Button
                variant="secondary"
                onClick={() => {
                  setDetailModalOpen(false);
                  handleOpenEditSaldo(detailUser);
                }}
                className="flex-1 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30 font-semibold text-xs flex items-center justify-center gap-1.5 h-9"
              >
                <Wallet className="w-4 h-4" />
                <span>Kelola Saldo Pengguna</span>
              </Button>

              {detailUser.role !== "Admin" && (
                <Button
                  variant="ghost"
                  onClick={async () => {
                    await handleToggleBlock(detailUser);
                    setDetailUser((prev: any) => (prev ? { ...prev, is_blocked: !prev?.is_blocked } : prev));
                  }}
                  className={`px-3.5 text-xs h-9 border font-semibold ${
                    detailUser.is_blocked
                      ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20"
                      : "bg-rose-500/10 border-rose-500/30 text-rose-400 hover:bg-rose-500/20"
                  }`}
                >
                  {detailUser.is_blocked ? (
                    <>
                      <CheckCircle className="w-4 h-4 mr-1.5" />
                      <span>Buka Blokir</span>
                    </>
                  ) : (
                    <>
                      <Ban className="w-4 h-4 mr-1.5" />
                      <span>Blokir Akun</span>
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        )}
      </Modal>

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
});
