/**
 * Telegram notification helper for Admin Dashboard
 */

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "";
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || "";

export async function sendTelegramMessage(text: string): Promise<boolean> {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    console.warn("Telegram bot token or chat ID is not configured.");
    return false;
  }

  try {
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text,
        parse_mode: "HTML",
      }),
    });

    const data = await res.json();
    return !!data?.ok;
  } catch (err) {
    console.error("Failed to send telegram notification:", err);
    return false;
  }
}

export async function notifyTicketStatusChange(
  ticketCode: string,
  userEmail: string,
  newStatus: string,
  note?: string
) {
  const statusEmoji =
    newStatus.toLowerCase().includes("selesai") || newStatus.toLowerCase().includes("resolved")
      ? "✅"
      : newStatus.toLowerCase().includes("proses") || newStatus.toLowerCase().includes("progress")
      ? "⏳"
      : newStatus.toLowerCase().includes("ditolak") || newStatus.toLowerCase().includes("closed")
      ? "❌"
      : "ℹ️";

  const message = `
<b>${statusEmoji} Update Status Tiket Bantuan</b>
━━━━━━━━━━━━━━━━━━━━
<b>Kode Tiket:</b> <code>${ticketCode}</code>
<b>Pengguna:</b> ${userEmail || "-"}
<b>Status Baru:</b> <b>${newStatus.toUpperCase()}</b>
${note ? `<b>Catatan Admin:</b> <i>${note}</i>\n` : ""}
<i>Diperbarui via Dashboard Admin Setor Gmail</i>
`.trim();

  return sendTelegramMessage(message);
}

export async function notifyTicketReply(
  ticketCode: string,
  sender: string,
  replyText: string
) {
  const message = `
<b>💬 Balasan Baru Tiket Bantuan</b>
━━━━━━━━━━━━━━━━━━━━
<b>Kode Tiket:</b> <code>${ticketCode}</code>
<b>Pengirim:</b> ${sender}
<b>Isi Pesan:</b>
${replyText}

<i>Admin Dashboard Setor Gmail</i>
`.trim();

  return sendTelegramMessage(message);
}
