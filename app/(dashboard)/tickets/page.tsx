"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useAdminAuth } from "@/context/admin-auth-context";
import {
  MessageSquareText,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  XCircle,
  Send,
  Paperclip,
  Image as ImageIcon,
  User,
  RefreshCw,
  ExternalLink,
  MessageCircle,
  AlertCircle,
  ChevronRight,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Input, Textarea, Select } from "@/components/ui/input";

export const dynamic = "force-dynamic";

function TicketsContent() {
  const searchParams = useSearchParams();

  const urlTicketId = searchParams.get("id");
  const { profile, user } = useAdminAuth();

  const [tickets, setTickets] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Selected Ticket Modal
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [replyText, setReplyText] = useState("");
  const [isSendingReply, setIsSendingReply] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [replySuccess, setReplySuccess] = useState<string | null>(null);

  const fetchTickets = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (search) params.set("search", search);

      const res = await fetch(`/api/admin/tickets?${params.toString()}`);
      const json = await res.json();
      if (json.success) {
        setTickets(json.tickets || []);

        // Auto open if url param id is present
        if (urlTicketId && !selectedTicket) {
          const match = (json.tickets || []).find((t: any) => t.id === urlTicketId);
          if (match) setSelectedTicket(match);
        }
      }
    } catch (err) {
      console.error("Gagal memuat tiket:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchTickets();
    }, 300);
    return () => clearTimeout(timer);
  }, [statusFilter, search]);

  const handleUpdateStatus = async (ticketId: string, newStatus: string, note?: string) => {
    setIsUpdatingStatus(true);
    try {
      const res = await fetch("/api/admin/tickets", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticketId, status: newStatus, note }),
      });
      const json = await res.json();
      if (json.success) {
        if (selectedTicket && selectedTicket.id === ticketId) {
          setSelectedTicket({ ...selectedTicket, status: newStatus });
        }
        fetchTickets();
      } else {
        alert(json.error || "Gagal mengubah status tiket");
      }
    } catch (e: any) {
      alert(e?.message || "Terjadi kesalahan");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || !replyText.trim()) return;

    setIsSendingReply(true);
    setReplySuccess(null);

    try {
      const res = await fetch("/api/admin/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ticketId: selectedTicket.id,
          message: replyText.trim(),
          adminId: user?.id,
          adminName: profile?.name || "Admin Setor Gmail",
        }),
      });

      const json = await res.json();
      if (json.success) {
        setReplySuccess("Balasan berhasil disimpan dan diteruskan ke Telegram!");
        setReplyText("");
        const newReplies = [...(selectedTicket.replies || []), json.reply];
        setSelectedTicket({
          ...selectedTicket,
          status: selectedTicket.status === "baru" ? "proses" : selectedTicket.status,
          replies: newReplies,
        });
        fetchTickets();
        setTimeout(() => setReplySuccess(null), 3000);
      } else {
        alert(json.error || "Gagal mengirim balasan");
      }
    } catch (err: any) {
      alert(err?.message || "Terjadi kesalahan");
    } finally {
      setIsSendingReply(false);
    }
  };

  const stats = {
    total: tickets.length,
    baru: tickets.filter((t) => (t.status || "").toLowerCase() === "baru" || (t.status || "").toLowerCase() === "open").length,
    proses: tickets.filter((t) => (t.status || "").toLowerCase() === "proses" || (t.status || "").toLowerCase() === "in_progress").length,
    selesai: tickets.filter((t) => (t.status || "").toLowerCase() === "selesai" || (t.status || "").toLowerCase() === "resolved").length,
  };

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <MessageSquareText className="w-5 h-5 text-emerald-400" />
            Pusat Tiket Bantuan & Telegram
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            Pantau laporan kendala pengguna, tanggapi pesan, dan sinkronkan dengan Bot Telegram.
          </p>
        </div>

        <Button
          variant="secondary"
          size="sm"
          onClick={() => fetchTickets()}
          isLoading={isLoading}
          className="flex items-center gap-1.5 self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
          <span>Refresh Tiket</span>
        </Button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-4">
          <span className="text-xs text-zinc-400">Total Tiket Masuk</span>
          <p className="text-xl font-bold text-white mt-1">{stats.total}</p>
        </Card>
        <Card className="p-4">
          <span className="text-xs text-cyan-400 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            Tiket Baru
          </span>
          <p className="text-xl font-bold text-cyan-400 mt-1">{stats.baru}</p>
        </Card>
        <Card className="p-4">
          <span className="text-xs text-amber-400">Sedang Diproses</span>
          <p className="text-xl font-bold text-amber-400 mt-1">{stats.proses}</p>
        </Card>
        <Card className="p-4">
          <span className="text-xs text-emerald-400">Selesai Ditangani</span>
          <p className="text-xl font-bold text-emerald-400 mt-1">{stats.selesai}</p>
        </Card>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="w-full sm:flex-1 relative">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-zinc-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Cari kode tiket, email, subjek, atau keluhan..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-10 pr-4 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
          />
        </div>

        {/* Status filter tabs */}
        <div className="flex items-center gap-1 p-1 bg-zinc-900 border border-zinc-800 rounded-xl overflow-x-auto w-full sm:w-auto">
          {[
            { label: "Semua", value: "all" },
            { label: "Baru", value: "open" },
            { label: "Diproses", value: "in_progress" },
            { label: "Selesai", value: "resolved" },
            { label: "Ditolak", value: "closed" },
          ].map((tab) => (
            <button
              key={tab.value}
              onClick={() => setStatusFilter(tab.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                statusFilter === tab.value
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tickets List */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-zinc-950/80 border-b border-zinc-800 text-zinc-400 font-semibold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">Kode Tiket</th>
                <th className="py-3 px-4">Pengirim</th>
                <th className="py-3 px-4">Kategori</th>
                <th className="py-3 px-4">Subjek & Deskripsi</th>
                <th className="py-3 px-4">Lampiran</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4">Tanggal Masuk</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/80 text-zinc-200">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-zinc-500">
                    <div className="flex flex-col items-center gap-2">
                      <RefreshCw className="w-5 h-5 animate-spin text-emerald-400" />
                      <span>Memuat tiket bantuan...</span>
                    </div>
                  </td>
                </tr>
              ) : tickets.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-zinc-500">
                    Tidak ada tiket bantuan yang ditemukan.
                  </td>
                </tr>
              ) : (
                tickets.map((t) => (
                  <tr
                    key={t.id}
                    className="hover:bg-zinc-800/40 transition-colors"
                  >
                    {/* Ticket code */}
                    <td className="py-3.5 px-4 font-mono font-bold text-zinc-200 whitespace-nowrap">
                      {t.ticket_code}
                    </td>

                    {/* Sender */}
                    <td className="py-3.5 px-4">
                      <div className="min-w-0">
                        <p className="font-semibold text-zinc-200 truncate max-w-[150px]">
                          {t.user_name}
                        </p>
                        <p className="text-[11px] text-zinc-400 truncate max-w-[150px]">
                          {t.user_email}
                        </p>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <Badge variant="outline" className="text-[10px]">
                        {t.category}
                      </Badge>
                    </td>

                    {/* Subject & snippet */}
                    <td className="py-3.5 px-4 max-w-sm">
                      <p className="font-medium text-zinc-200 truncate">
                        {t.subject}
                      </p>
                      <p className="text-[11px] text-zinc-400 truncate mt-0.5">
                        {t.description}
                      </p>
                    </td>

                    {/* Attachment */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {t.attachment_name ? (
                        <span className="inline-flex items-center gap-1 text-[11px] text-zinc-300 bg-zinc-800 px-2 py-0.5 rounded border border-zinc-700">
                          <Paperclip className="w-3 h-3 text-zinc-400" />
                          <span className="truncate max-w-[90px]">{t.attachment_name}</span>
                        </span>
                      ) : (
                        <span className="text-zinc-600">-</span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <StatusBadge status={t.status} />
                    </td>

                    {/* Date */}
                    <td className="py-3.5 px-4 text-zinc-400 whitespace-nowrap">
                      {new Date(t.created_at).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setSelectedTicket(t)}
                        className="px-2.5 py-1 text-[11px] bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20"
                      >
                        Buka & Balas
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Ticket Details & Reply Modal */}
      <Modal
        isOpen={!!selectedTicket}
        onClose={() => setSelectedTicket(null)}
        title={`Tiket ${selectedTicket?.ticket_code || ""}`}
        subtitle={`Pengirim: ${selectedTicket?.user_name} (${selectedTicket?.user_email})`}
        maxWidth="2xl"
      >
        <div className="space-y-5">
          {/* Status and Action Buttons Header */}
          <div className="p-3 bg-zinc-950 border border-zinc-800 rounded-xl flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs text-zinc-400">Status Saat Ini:</span>
              <StatusBadge status={selectedTicket?.status} />
              <Badge variant="outline">{selectedTicket?.category}</Badge>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-zinc-500 mr-1">Ubah Status:</span>
              <button
                type="button"
                onClick={() => handleUpdateStatus(selectedTicket?.id, "proses")}
                disabled={isUpdatingStatus}
                className="px-2 py-1 text-[11px] rounded bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 border border-amber-500/30 transition-colors"
              >
                Diproses
              </button>
              <button
                type="button"
                onClick={() => handleUpdateStatus(selectedTicket?.id, "selesai")}
                disabled={isUpdatingStatus}
                className="px-2 py-1 text-[11px] rounded bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20 border border-emerald-500/30 transition-colors"
              >
                Selesai
              </button>
              <button
                type="button"
                onClick={() => handleUpdateStatus(selectedTicket?.id, "ditolak")}
                disabled={isUpdatingStatus}
                className="px-2 py-1 text-[11px] rounded bg-rose-500/10 text-rose-300 hover:bg-rose-500/20 border border-rose-500/30 transition-colors"
              >
                Tolak
              </button>
            </div>
          </div>

          {/* Ticket Subject & Description */}
          <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-xl space-y-2">
            <h4 className="font-semibold text-zinc-100 text-sm">
              {selectedTicket?.subject}
            </h4>
            <p className="text-zinc-300 text-xs whitespace-pre-wrap leading-relaxed">
              {selectedTicket?.description}
            </p>

            {/* Attachment preview */}
            {selectedTicket?.attachment_name && (
              <div className="mt-3 pt-3 border-t border-zinc-800/80 flex items-center justify-between text-xs text-zinc-400">
                <span className="flex items-center gap-1.5">
                  <Paperclip className="w-3.5 h-3.5 text-zinc-400" />
                  Lampiran: <b className="text-zinc-200">{selectedTicket.attachment_name}</b>
                </span>
                {selectedTicket.attachment_url && (
                  <a
                    href={selectedTicket.attachment_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
                  >
                    Buka File <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            )}
          </div>

          {/* Thread Replies */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              Riwayat Komunikasi & Balasan ({selectedTicket?.replies?.length || 0})
            </h4>

            {(!selectedTicket?.replies || selectedTicket.replies.length === 0) ? (
              <p className="text-xs text-zinc-500 italic p-3 bg-zinc-950/40 rounded-lg border border-zinc-900 text-center">
                Belum ada balasan untuk tiket ini. Tulis tanggapan di bawah untuk merespons pengguna.
              </p>
            ) : (
              <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                {selectedTicket.replies.map((rep: any) => (
                  <div
                    key={rep.id}
                    className={`p-3 rounded-xl border text-xs leading-relaxed ${
                      rep.sender_type === "admin"
                        ? "bg-emerald-950/20 border-emerald-500/30 text-zinc-200 ml-4"
                        : "bg-zinc-950 border-zinc-800 text-zinc-300 mr-4"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5 text-[10px] text-zinc-400">
                      <span className="font-semibold text-zinc-300">
                        {rep.sender_type === "admin" ? "🛡️ Administrator" : "👤 Pengguna"}
                      </span>
                      <span>
                        {new Date(rep.created_at).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <p className="whitespace-pre-wrap">{rep.message}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Admin Reply Form */}
          <form onSubmit={handleSendReply} className="space-y-3 pt-2 border-t border-zinc-800">
            {replySuccess && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{replySuccess}</span>
              </div>
            )}

            <Textarea
              label="Tulis Balasan Admin (Terkirim otomatis ke Pengguna & Telegram)"
              placeholder="Ketik pesan respon atau solusi untuk pengguna..."
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              required
            />

            <div className="flex items-center justify-between">
              <span className="text-[11px] text-zinc-500">
                Pesan akan otomatis diteruskan ke Telegram channel @setorgmail_bot
              </span>
              <Button
                type="submit"
                variant="primary"
                isLoading={isSendingReply}
                className="flex items-center gap-2 text-xs py-2 px-4"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Kirim Balasan</span>
              </Button>
            </div>
          </form>
        </div>
      </Modal>
    </div>
  );
}

export default function TicketsPage() {
  return (
    <Suspense
      fallback={
        <div className="py-12 text-center text-zinc-500 text-sm">
          Memuat pusat tiket bantuan...
        </div>
      }
    >
      <TicketsContent />
    </Suspense>
  );
}

