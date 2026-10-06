import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const filterStatus = searchParams.get("status") || "all";
    const filterCategory = searchParams.get("category") || "all";
    const search = searchParams.get("search")?.toLowerCase().trim() || "";

    // Build deposits query
    let depQuery = supabaseAdmin
      .from("deposits")
      .select("*")
      .order("created_at", { ascending: false });

    if (filterStatus !== "all") {
      depQuery = depQuery.eq("status", filterStatus);
    }
    if (filterCategory !== "all") {
      depQuery = depQuery.eq("category_id", filterCategory);
    }

    // Parallel fetch profiles, categories, and deposits
    const [
      { data: profiles },
      { data: categories },
      { data: depositsData, error: depError },
    ] = await Promise.all([
      supabaseAdmin.from("profiles").select("id, name, email, dana_number"),
      supabaseAdmin.from("setor_categories").select("*"),
      depQuery,
    ]);

    if (depError) throw depError;

    const userMap: Record<string, { name: string; email: string; dana: string }> = {};
    (profiles || []).forEach((p) => {
      userMap[p.id] = {
        name: p.name || p.email?.split("@")[0] || "Pengguna",
        email: p.email || "-",
        dana: p.dana_number || "-",
      };
    });

    const categoryMap: Record<string, any> = {};
    (categories || []).forEach((c) => {
      categoryMap[c.id] = c;
    });

    let items = (depositsData || []).map((d) => {
      const user = userMap[d.user_id] || {
        name: "Pengguna",
        email: "-",
        dana: "-",
      };
      const cat = categoryMap[d.category_id] || {
        label: d.category_id === "good" ? "Setor Gmail Good" : "Setor Gmail Bebas",
        price: d.amount || (d.category_id === "good" ? 4500 : 2500),
      };

      return {
        id: d.id,
        user_id: d.user_id,
        user_name: user.name,
        user_email: user.email,
        user_dana: user.dana,
        batch_id: d.batch_id,
        gmail: d.gmail || "-",
        normalized_gmail: d.normalized_gmail || d.gmail || "-",
        category_id: d.category_id || "good",
        category_label: cat.label,
        status: d.status || "pending",
        amount: Number(d.amount) || Number(cat.price) || 4500,
        note: d.note || "-",
        checked_at: d.checked_at,
        created_at: d.created_at,
      };
    });

    // Filter by search string if provided
    if (search) {
      items = items.filter(
        (it) =>
          it.gmail.toLowerCase().includes(search) ||
          it.user_name.toLowerCase().includes(search) ||
          it.user_email.toLowerCase().includes(search) ||
          it.user_dana.toLowerCase().includes(search) ||
          it.category_label.toLowerCase().includes(search)
      );
    }

    // Stats calculations
    const allDeposits = depositsData || [];
    const stats = {
      total: allDeposits.length,
      accepted: allDeposits.filter((d) => (d.status || "").toLowerCase() === "accepted").length,
      pending: allDeposits.filter((d) => (d.status || "").toLowerCase() === "pending").length,
      rejected: allDeposits.filter((d) => (d.status || "").toLowerCase() === "rejected").length,
      totalAmount: allDeposits
        .filter((d) => (d.status || "").toLowerCase() === "accepted")
        .reduce((sum, d) => sum + (Number(d.amount) || 0), 0),
    };

    return NextResponse.json({
      success: true,
      deposits: items,
      stats,
      categories: categories || [],
    });
  } catch (err: any) {
    console.error("Deposits GET API error:", err);
    return NextResponse.json(
      { success: false, error: err?.message || "Gagal mengambil data setoran Gmail" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, newStatus, adminNote } = body;

    if (!id || !newStatus) {
      return NextResponse.json(
        { success: false, error: "ID dan Status Baru diperlukan" },
        { status: 400 }
      );
    }

    // 1. Get deposit row
    const { data: deposit, error: fetchErr } = await supabaseAdmin
      .from("deposits")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (fetchErr || !deposit) {
      return NextResponse.json(
        { success: false, error: "Data setoran Gmail tidak ditemukan" },
        { status: 404 }
      );
    }

    const prevStatus = deposit.status;
    const nowStr = new Date().toISOString();

    // 2. Update deposit
    const updatePayload: any = {
      status: newStatus,
      checked_at: nowStr,
      updated_at: nowStr,
    };
    if (adminNote !== undefined) {
      updatePayload.note = adminNote;
    }

    const { error: updErr } = await supabaseAdmin
      .from("deposits")
      .update(updatePayload)
      .eq("id", id);

    if (updErr) throw updErr;

    // 3. If accepted and was pending, credit user's wallet & insert transaction
    if (newStatus === "accepted" && prevStatus !== "accepted") {
      const rewardAmount = Number(deposit.amount) || 4500;

      // Update wallet
      const { data: wallet } = await supabaseAdmin
        .from("wallets")
        .select("balance, total_earned")
        .eq("user_id", deposit.user_id)
        .maybeSingle();

      if (wallet) {
        await supabaseAdmin
          .from("wallets")
          .update({
            balance: Number(wallet.balance) + rewardAmount,
            total_earned: Number(wallet.total_earned) + rewardAmount,
            updated_at: nowStr,
          })
          .eq("user_id", deposit.user_id);
      }

      // Record transaction
      await supabaseAdmin.from("transactions").insert({
        user_id: deposit.user_id,
        type: "deposit",
        amount: rewardAmount,
        title: "Setoran Gmail Diterima",
        description: `Setoran akun Gmail (${deposit.gmail}) berhasil diverifikasi oleh Admin.`,
        status: "success",
      });
    }

    return NextResponse.json({
      success: true,
      message: `Status setoran Gmail berhasil diubah menjadi ${newStatus}`,
    });
  } catch (err: any) {
    console.error("Deposits PATCH API error:", err);
    return NextResponse.json(
      { success: false, error: err?.message || "Gagal mengubah status setoran Gmail" },
      { status: 500 }
    );
  }
}
