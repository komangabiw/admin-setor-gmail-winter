import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function GET(req: NextRequest) {
  try {
    // 1. Fetch total users
    const { data: profiles, error: pErr } = await supabaseAdmin
      .from("profiles")
      .select("id, name, email, role, avatar_url, created_at")
      .order("created_at", { ascending: false });

    if (pErr) throw pErr;

    const totalUsers = profiles?.length || 0;
    const totalAdmins =
      profiles?.filter((p) => (p.role || "").toLowerCase() === "admin").length || 0;

    // 2. Fetch wallets summary
    const { data: wallets, error: wErr } = await supabaseAdmin
      .from("wallets")
      .select("balance, total_withdrawn, total_earned");

    if (wErr) throw wErr;

    const totalBalance = (wallets || []).reduce(
      (acc, w) => acc + (Number(w.balance) || 0),
      0
    );
    const totalWithdrawn = (wallets || []).reduce(
      (acc, w) => acc + (Number(w.total_withdrawn) || 0),
      0
    );

    // 3. Fetch support tickets summary
    const { data: tickets, error: tErr } = await supabaseAdmin
      .from("support_tickets")
      .select("id, ticket_code, user_id, category, subject, status, created_at")
      .order("created_at", { ascending: false });

    if (tErr) throw tErr;

    const totalTickets = tickets?.length || 0;
    const activeTickets = (tickets || []).filter((t) => {
      const s = (t.status || "").toLowerCase();
      return s === "baru" || s === "open" || s === "proses" || s === "in_progress";
    }).length;

    // 4. Fetch recent transactions & withdrawals
    const { data: transactions } = await supabaseAdmin
      .from("transactions")
      .select("id, user_id, type, amount, title, description, status, created_at")
      .order("created_at", { ascending: false })
      .limit(10);

    const { data: withdrawals } = await supabaseAdmin
      .from("withdrawals")
      .select("id, user_id, amount, method, status, created_at, account_name, account_number")
      .order("created_at", { ascending: false })
      .limit(10);

    const pendingWithdrawals = (withdrawals || []).filter(
      (w) => (w.status || "").toLowerCase() === "pending"
    ).length;

    // Build user map for fast name/email resolution
    const userMap: Record<string, { name: string; email: string }> = {};
    (profiles || []).forEach((p) => {
      userMap[p.id] = {
        name: p.name || p.email?.split("@")[0] || "User",
        email: p.email || "-",
      };
    });

    const recentTicketsWithUser = (tickets || []).slice(0, 5).map((t) => ({
      ...t,
      userName: userMap[t.user_id]?.name || "Pengguna",
      userEmail: userMap[t.user_id]?.email || "-",
    }));

    const recentTransactionsWithUser = (transactions || []).slice(0, 5).map((t) => ({
      ...t,
      userName: userMap[t.user_id]?.name || "Pengguna",
      userEmail: userMap[t.user_id]?.email || "-",
    }));

    return NextResponse.json({
      success: true,
      stats: {
        totalUsers,
        totalAdmins,
        totalBalance,
        totalWithdrawn,
        totalTickets,
        activeTickets,
        pendingWithdrawals,
      },
      recentUsers: (profiles || []).slice(0, 5),
      recentTickets: recentTicketsWithUser,
      recentTransactions: recentTransactionsWithUser,
    });
  } catch (err: any) {
    console.error("Stats API error:", err);
    return NextResponse.json(
      { success: false, error: err?.message || "Failed to load dashboard stats" },
      { status: 500 }
    );
  }
}
