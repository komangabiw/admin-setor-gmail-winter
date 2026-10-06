import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getAdminEmails } from "@/lib/auth-helpers";

export async function GET(req: NextRequest) {
  const startTime = Date.now();
  try {
    // 1. Fetch all profiles
    const { data: profiles, error: pErr } = await supabaseAdmin
      .from("profiles")
      .select("id, name, email, role, avatar_url, dana_number, created_at")
      .order("created_at", { ascending: false });

    if (pErr) throw pErr;

    const totalUsers = profiles?.length || 0;
    const totalAdmins =
      profiles?.filter((p) => (p.role || "").toLowerCase() === "admin").length || 0;
    const totalMembers = totalUsers - totalAdmins;

    // 2. Fetch all wallets
    const { data: wallets, error: wErr } = await supabaseAdmin
      .from("wallets")
      .select("user_id, balance, total_withdrawn, total_earned");

    if (wErr) throw wErr;

    const walletMap: Record<string, { balance: number; total_withdrawn: number; total_earned: number }> = {};
    let totalBalance = 0;
    let totalWithdrawn = 0;
    let totalEarned = 0;

    (wallets || []).forEach((w) => {
      const b = Number(w.balance) || 0;
      const tw = Number(w.total_withdrawn) || 0;
      const te = Number(w.total_earned) || 0;
      walletMap[w.user_id] = { balance: b, total_withdrawn: tw, total_earned: te };
      totalBalance += b;
      totalWithdrawn += tw;
      totalEarned += te;
    });

    // 3. Fetch all support tickets
    const { data: tickets, error: tErr } = await supabaseAdmin
      .from("support_tickets")
      .select("id, ticket_code, user_id, category, subject, status, created_at")
      .order("created_at", { ascending: false });

    if (tErr) throw tErr;

    const totalTickets = tickets?.length || 0;
    let activeTickets = 0;
    let resolvedTickets = 0;

    (tickets || []).forEach((t) => {
      const s = (t.status || "").toLowerCase();
      if (s === "baru" || s === "open" || s === "proses" || s === "in_progress") {
        activeTickets++;
      } else if (s === "selesai" || s === "resolved") {
        resolvedTickets++;
      }
    });

    // 4. Fetch transactions
    const { data: transactions, count: txCount } = await supabaseAdmin
      .from("transactions")
      .select("id, user_id, type, amount, title, description, status, created_at", { count: "exact" })
      .order("created_at", { ascending: false })
      .limit(10);

    // 5. Fetch withdrawals
    const { data: withdrawals, count: wdCount } = await supabaseAdmin
      .from("withdrawals")
      .select("id, user_id, amount, method, status, created_at, account_name, account_number", { count: "exact" })
      .order("created_at", { ascending: false })
      .limit(10);

    let pendingWithdrawals = 0;
    let pendingWithdrawalsAmount = 0;
    (withdrawals || []).forEach((w) => {
      if ((w.status || "").toLowerCase() === "pending") {
        pendingWithdrawals++;
        pendingWithdrawalsAmount += Number(w.amount) || 0;
      }
    });

    // Build user map for fast name/email resolution
    const userMap: Record<string, { name: string; email: string; dana: string }> = {};
    (profiles || []).forEach((p) => {
      userMap[p.id] = {
        name: p.name || p.email?.split("@")[0] || "User",
        email: p.email || "-",
        dana: p.dana_number || "-",
      };
    });

    // Recent tickets with populated user info
    const recentTicketsWithUser = (tickets || []).slice(0, 5).map((t) => ({
      ...t,
      userName: userMap[t.user_id]?.name || "Pengguna",
      userEmail: userMap[t.user_id]?.email || "-",
    }));

    // Recent transactions with populated user info
    const recentTransactionsWithUser = (transactions || []).slice(0, 6).map((t) => ({
      ...t,
      userName: userMap[t.user_id]?.name || "Pengguna",
      userEmail: userMap[t.user_id]?.email || "-",
    }));

    // Recent withdrawals needing review
    const pendingWithdrawalsList = (withdrawals || [])
      .filter((w) => (w.status || "").toLowerCase() === "pending")
      .slice(0, 5)
      .map((w) => ({
        ...w,
        userName: userMap[w.user_id]?.name || "Pengguna",
        userEmail: userMap[w.user_id]?.email || "-",
      }));

    // Recent users with their REAL live wallet balances
    const recentUsersWithWallet = (profiles || []).slice(0, 6).map((p) => ({
      id: p.id,
      name: p.name || p.email?.split("@")[0] || "Pengguna",
      email: p.email || "-",
      role: p.role || "User",
      avatar_url: p.avatar_url,
      created_at: p.created_at,
      balance: walletMap[p.id]?.balance || 0,
      total_withdrawn: walletMap[p.id]?.total_withdrawn || 0,
    }));

    const latencyMs = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      stats: {
        totalUsers,
        totalAdmins,
        totalMembers,
        totalBalance,
        totalWithdrawn,
        totalEarned,
        totalTickets,
        activeTickets,
        resolvedTickets,
        pendingWithdrawals,
        pendingWithdrawalsAmount,
        totalTransactionsCount: txCount || transactions?.length || 0,
        totalWithdrawalsCount: wdCount || withdrawals?.length || 0,
      },
      systemHealth: {
        supabaseConnected: true,
        latencyMs,
        telegramConfigured: !!process.env.TELEGRAM_BOT_TOKEN,
        adminCount: getAdminEmails().length,
        timestamp: new Date().toISOString(),
      },
      recentUsers: recentUsersWithWallet,
      recentTickets: recentTicketsWithUser,
      recentTransactions: recentTransactionsWithUser,
      pendingWithdrawalsList,
    });
  } catch (err: any) {
    console.error("Stats API error:", err);
    return NextResponse.json(
      { success: false, error: err?.message || "Failed to load dashboard stats" },
      { status: 500 }
    );
  }
}
