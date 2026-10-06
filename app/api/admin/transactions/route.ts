import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const filterType = searchParams.get("type") || "all";
    const filterStatus = searchParams.get("status") || "all";
    const search = searchParams.get("search")?.toLowerCase().trim() || "";

    // Build queries
    const profilesPromise = supabaseAdmin
      .from("profiles")
      .select("id, name, email, dana_number");

    let txPromise: any = Promise.resolve({ data: [] });
    if (filterType === "all" || filterType === "transaction" || filterType === "deposit" || filterType === "adjustment") {
      let q = supabaseAdmin
        .from("transactions")
        .select("*")
        .order("created_at", { ascending: false });

      if (filterStatus !== "all") {
        q = q.eq("status", filterStatus);
      }
      txPromise = q;
    }

    let wdPromise: any = Promise.resolve({ data: [] });
    if (filterType === "all" || filterType === "withdrawal") {
      let q = supabaseAdmin
        .from("withdrawals")
        .select("*")
        .order("created_at", { ascending: false });

      if (filterStatus !== "all") {
        q = q.eq("status", filterStatus);
      }
      wdPromise = q;
    }

    // Parallel fetch
    const [
      { data: profiles },
      { data: txs },
      { data: wds },
    ] = await Promise.all([profilesPromise, txPromise, wdPromise]);

    const userMap: Record<string, { name: string; email: string; dana: string }> = {};
    (profiles || []).forEach((p) => {
      userMap[p.id] = {
        name: p.name || p.email?.split("@")[0] || "Pengguna",
        email: p.email || "-",
        dana: p.dana_number || "-",
      };
    });

    const items: any[] = [];

    (txs || []).forEach((t: any) => {
      items.push({
        id: t.id,
        source_table: "transactions",
        user_id: t.user_id,
        user_name: userMap[t.user_id]?.name || "Pengguna",
        user_email: userMap[t.user_id]?.email || "-",
        type: t.type || "transaction",
        amount: Number(t.amount) || 0,
        title: t.title || "Transaksi Saldo",
        description: t.description || "-",
        status: t.status || "success",
        created_at: t.created_at,
        details: null,
      });
    });

    (wds || []).forEach((w: any) => {
      items.push({
        id: w.id,
        source_table: "withdrawals",
        user_id: w.user_id,
        user_name: userMap[w.user_id]?.name || "Pengguna",
        user_email: userMap[w.user_id]?.email || "-",
        type: "withdrawal",
        amount: Number(w.amount) || 0,
        title: `Penarikan (${w.method || "DANA"})`,
        description: `Rekening: ${w.account_number || "-"} a/n ${w.account_name || "-"}`,
        status: w.status || "pending",
        created_at: w.created_at,
        details: {
          method: w.method,
          account_number: w.account_number,
          account_name: w.account_name,
          tax_fee: w.tax_fee,
          net_amount: w.net_amount,
          admin_note: w.admin_note,
          proof_url: w.proof_url,
        },
      });
    });

    // Sort combined items by created_at desc
    items.sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    let filtered = items;
    if (search) {
      filtered = filtered.filter(
        (i) =>
          i.user_name.toLowerCase().includes(search) ||
          i.user_email.toLowerCase().includes(search) ||
          i.title.toLowerCase().includes(search) ||
          i.description.toLowerCase().includes(search) ||
          i.id.toLowerCase().includes(search)
      );
    }

    return NextResponse.json({ success: true, transactions: filtered });
  } catch (err: any) {
    console.error("Transactions GET API error:", err);
    return NextResponse.json(
      { success: false, error: err?.message || "Gagal memuat transaksi" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, sourceTable, newStatus, adminNote } = body;

    if (!id || !newStatus) {
      return NextResponse.json(
        { success: false, error: "ID dan Status Baru diperlukan" },
        { status: 400 }
      );
    }

    if (sourceTable === "withdrawals") {
      // 1. Fetch current withdrawal
      const { data: wd, error: getErr } = await supabaseAdmin
        .from("withdrawals")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (getErr || !wd) {
        return NextResponse.json(
          { success: false, error: "Data penarikan tidak ditemukan" },
          { status: 404 }
        );
      }

      const updatePayload: any = {
        status: newStatus,
        updated_at: new Date().toISOString(),
      };
      if (adminNote) updatePayload.admin_note = adminNote;
      if (newStatus === "success") {
        updatePayload.processed_at = new Date().toISOString();
      }

      const { error: updErr } = await supabaseAdmin
        .from("withdrawals")
        .update(updatePayload)
        .eq("id", id);

      if (updErr) throw updErr;

      // Also update matching transaction row if any
      await supabaseAdmin
        .from("transactions")
        .update({ status: newStatus })
        .eq("reference_id", id);

      // If rejected/failed, refund user's wallet balance
      if ((newStatus === "failed" || newStatus === "rejected") && wd.status === "pending") {
        const { data: wallet } = await supabaseAdmin
          .from("wallets")
          .select("balance, total_withdrawn")
          .eq("user_id", wd.user_id)
          .maybeSingle();

        if (wallet) {
          await supabaseAdmin
            .from("wallets")
            .update({
              balance: Number(wallet.balance) + Number(wd.amount),
              total_withdrawn: Math.max(0, Number(wallet.total_withdrawn) - Number(wd.amount)),
              updated_at: new Date().toISOString(),
            })
            .eq("user_id", wd.user_id);

          await supabaseAdmin.from("transactions").insert({
            user_id: wd.user_id,
            type: "deposit",
            amount: wd.amount,
            title: "Pengembalian Dana Penarikan",
            description: `Refund penarikan #${wd.id.slice(0, 8)} (${adminNote || "Penarikan ditolak oleh Admin"})`,
            status: "success",
          });
        }
      }

      return NextResponse.json({
        success: true,
        message: `Status penarikan berhasil diubah ke ${newStatus}`,
      });
    }

    // Default to transactions table
    const { error: tErr } = await supabaseAdmin
      .from("transactions")
      .update({ status: newStatus })
      .eq("id", id);

    if (tErr) throw tErr;

    return NextResponse.json({
      success: true,
      message: `Status transaksi berhasil diubah ke ${newStatus}`,
    });
  } catch (err: any) {
    console.error("Transactions PATCH API error:", err);
    return NextResponse.json(
      { success: false, error: err?.message || "Gagal memperbarui status transaksi" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, type, amount, title, description } = body;

    if (!userId || !amount) {
      return NextResponse.json(
        { success: false, error: "User ID dan Nominal wajib diisi" },
        { status: 400 }
      );
    }

    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return NextResponse.json(
        { success: false, error: "Nominal harus lebih dari 0" },
        { status: 400 }
      );
    }

    // Insert transaction
    const { data: tx, error: txErr } = await supabaseAdmin
      .from("transactions")
      .insert({
        user_id: userId,
        type: type || "deposit",
        amount: numAmount,
        title: title || "Deposit Saldo Manual oleh Admin",
        description: description || "Ditambahkan melalui dashboard admin",
        status: "success",
      })
      .select()
      .single();

    if (txErr) throw txErr;

    // Update wallet balance
    const { data: wallet } = await supabaseAdmin
      .from("wallets")
      .select("balance, total_earned")
      .eq("user_id", userId)
      .maybeSingle();

    if (wallet) {
      await supabaseAdmin
        .from("wallets")
        .update({
          balance: Number(wallet.balance) + numAmount,
          total_earned: Number(wallet.total_earned) + numAmount,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", userId);
    } else {
      await supabaseAdmin.from("wallets").insert({
        user_id: userId,
        balance: numAmount,
        total_earned: numAmount,
        total_withdrawn: 0,
        minimum_withdrawal: 5000,
      });
    }

    return NextResponse.json({
      success: true,
      message: "Transaksi dan saldo pengguna berhasil ditambahkan",
      transaction: tx,
    });
  } catch (err: any) {
    console.error("Transactions POST API error:", err);
    return NextResponse.json(
      { success: false, error: err?.message || "Gagal menambahkan transaksi" },
      { status: 500 }
    );
  }
}
