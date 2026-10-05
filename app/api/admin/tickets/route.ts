import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { notifyTicketStatusChange, notifyTicketReply } from "@/lib/telegram";

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const filterStatus = searchParams.get("status") || "all";
    const search = searchParams.get("search")?.toLowerCase().trim() || "";

    // 1. Fetch user map
    const { data: profiles } = await supabaseAdmin
      .from("profiles")
      .select("id, name, email, dana_number, avatar_url");

    const userMap: Record<string, any> = {};
    (profiles || []).forEach((p) => {
      userMap[p.id] = p;
    });

    // 2. Fetch support tickets
    let q = supabaseAdmin
      .from("support_tickets")
      .select("*")
      .order("created_at", { ascending: false });

    if (filterStatus !== "all") {
      if (filterStatus === "open") {
        q = q.in("status", ["baru", "open"]);
      } else if (filterStatus === "in_progress") {
        q = q.in("status", ["proses", "in_progress"]);
      } else if (filterStatus === "resolved") {
        q = q.in("status", ["selesai", "resolved"]);
      } else if (filterStatus === "closed") {
        q = q.in("status", ["ditolak", "closed"]);
      } else {
        q = q.eq("status", filterStatus);
      }
    }

    const { data: tickets, error: tErr } = await q;
    if (tErr) throw tErr;

    // 3. Fetch all replies
    const { data: replies } = await supabaseAdmin
      .from("ticket_replies")
      .select("*")
      .order("created_at", { ascending: true });

    const replyMap: Record<string, any[]> = {};
    (replies || []).forEach((r) => {
      if (!replyMap[r.ticket_id]) {
        replyMap[r.ticket_id] = [];
      }
      replyMap[r.ticket_id].push(r);
    });

    // Merge ticket data
    let formatted = (tickets || []).map((t) => {
      const user = userMap[t.user_id];
      return {
        id: t.id,
        ticket_code: t.ticket_code || `LPR-${t.id.slice(0, 6)}`,
        user_id: t.user_id,
        user_name: user?.name || user?.email?.split("@")[0] || "Pengguna",
        user_email: user?.email || "-",
        user_dana: user?.dana_number || "-",
        user_avatar: user?.avatar_url || null,
        category: t.category || "Lainnya",
        subject: t.subject || "Tanpa Judul",
        description: t.description || "-",
        status: t.status || "baru",
        attachment_name: t.attachment_name,
        attachment_url: t.attachment_url,
        telegram_sent: !!t.telegram_sent,
        created_at: t.created_at,
        updated_at: t.updated_at,
        replies: replyMap[t.id] || [],
      };
    });

    if (search) {
      formatted = formatted.filter(
        (t) =>
          t.ticket_code.toLowerCase().includes(search) ||
          t.subject.toLowerCase().includes(search) ||
          t.description.toLowerCase().includes(search) ||
          t.user_name.toLowerCase().includes(search) ||
          t.user_email.toLowerCase().includes(search) ||
          t.category.toLowerCase().includes(search)
      );
    }

    return NextResponse.json({ success: true, tickets: formatted });
  } catch (err: any) {
    console.error("Tickets GET API error:", err);
    return NextResponse.json(
      { success: false, error: err?.message || "Gagal memuat tiket bantuan" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { ticketId, status, note } = body;

    if (!ticketId || !status) {
      return NextResponse.json(
        { success: false, error: "Ticket ID dan Status baru diperlukan" },
        { status: 400 }
      );
    }

    // 1. Fetch current ticket
    const { data: ticket, error: getErr } = await supabaseAdmin
      .from("support_tickets")
      .select("*")
      .eq("id", ticketId)
      .maybeSingle();

    if (getErr || !ticket) {
      return NextResponse.json(
        { success: false, error: "Tiket tidak ditemukan" },
        { status: 404 }
      );
    }

    // 2. Update status in database
    const { error: updErr } = await supabaseAdmin
      .from("support_tickets")
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", ticketId);

    if (updErr) throw updErr;

    // 3. Get user email for telegram notification
    let userEmail = "";
    if (ticket.user_id) {
      const { data: p } = await supabaseAdmin
        .from("profiles")
        .select("email")
        .eq("id", ticket.user_id)
        .maybeSingle();
      userEmail = p?.email || "";
    }

    // Dispatch Telegram update
    await notifyTicketStatusChange(
      ticket.ticket_code || ticket.id.slice(0, 8),
      userEmail,
      status,
      note
    );

    return NextResponse.json({
      success: true,
      message: `Status tiket berhasil diubah ke ${status}`,
    });
  } catch (err: any) {
    console.error("Tickets PATCH API error:", err);
    return NextResponse.json(
      { success: false, error: err?.message || "Gagal memperbarui tiket" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { ticketId, message, adminId, adminName } = body;

    if (!ticketId || !message?.trim()) {
      return NextResponse.json(
        { success: false, error: "Pesan balasan tidak boleh kosong" },
        { status: 400 }
      );
    }

    // 1. Insert reply
    const { data: reply, error: repErr } = await supabaseAdmin
      .from("ticket_replies")
      .insert({
        ticket_id: ticketId,
        sender_type: "admin",
        sender_id: adminId || null,
        message: message.trim(),
      })
      .select()
      .single();

    if (repErr) throw repErr;

    // 2. If status was 'baru', update to 'proses'
    const { data: currentTicket } = await supabaseAdmin
      .from("support_tickets")
      .select("ticket_code, status")
      .eq("id", ticketId)
      .maybeSingle();

    if (currentTicket && (currentTicket.status === "baru" || currentTicket.status === "open")) {
      await supabaseAdmin
        .from("support_tickets")
        .update({
          status: "proses",
          updated_at: new Date().toISOString(),
        })
        .eq("id", ticketId);
    }

    // 3. Forward to Telegram
    const ticketCode = currentTicket?.ticket_code || ticketId.slice(0, 8);
    await notifyTicketReply(ticketCode, `Admin (${adminName || "Setor Gmail"})`, message.trim());

    return NextResponse.json({
      success: true,
      message: "Balasan berhasil dikirim",
      reply,
    });
  } catch (err: any) {
    console.error("Tickets POST API error:", err);
    return NextResponse.json(
      { success: false, error: err?.message || "Gagal mengirim balasan tiket" },
      { status: 500 }
    );
  }
}
