import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const search = searchParams.get("search")?.toLowerCase().trim() || "";
    const roleFilter = searchParams.get("role") || "";

    // 1. Fetch profiles
    let query = supabaseAdmin
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });

    if (roleFilter && roleFilter !== "all") {
      query = query.eq("role", roleFilter);
    }

    // Parallel fetch: profiles, wallets, saved_ewallets, deposits, authUsers
    const [
      { data: profiles, error: pErr },
      { data: wallets },
      { data: ewallets },
      { data: deposits },
      authUsersRes,
    ] = await Promise.all([
      query,
      supabaseAdmin
        .from("wallets")
        .select("id, user_id, balance, total_earned, total_withdrawn, minimum_withdrawal"),
      supabaseAdmin
        .from("saved_ewallets")
        .select("id, user_id, method, account_number, account_name, is_default"),
      supabaseAdmin
        .from("deposits")
        .select("user_id, status"),
      supabaseAdmin.auth.admin
        .listUsers({ perPage: 1000 })
        .catch((e) => {
          console.warn("Could not list auth users for ban/avatar check:", e);
          return { data: null };
        }),
    ]);

    if (pErr) throw pErr;

    const walletMap: Record<string, any> = {};
    (wallets || []).forEach((w) => {
      walletMap[w.user_id] = w;
    });

    const ewalletMap: Record<string, any[]> = {};
    (ewallets || []).forEach((ew) => {
      if (!ewalletMap[ew.user_id]) ewalletMap[ew.user_id] = [];
      ewalletMap[ew.user_id].push(ew);
    });

    const authUserMap: Record<string, any> = {};
    let bannedMap: Record<string, boolean> = {};
    if (authUsersRes?.data?.users) {
      authUsersRes.data.users.forEach((u: any) => {
        authUserMap[u.id] = u;
        const isBanned = !!(u.banned_until && new Date(u.banned_until) > new Date());
        bannedMap[u.id] = isBanned;
      });
    }

    // 5. Build referral code map to resolve referrer (upline) names
    const refCodeToUserMap: Record<string, { id: string; name: string; email: string }> = {};
    (profiles || []).forEach((p) => {
      if (p.referral_code) {
        refCodeToUserMap[p.referral_code] = {
          id: p.id,
          name: p.name || p.email?.split("@")[0] || "User",
          email: p.email || "-",
        };
      }
    });

    // 5b. Build deposits count map per user (total, diterima, dicek, ditolak)
    const depositStatsMap: Record<
      string,
      { total: number; diterima: number; dicek: number; ditolak: number }
    > = {};
    (deposits || []).forEach((d: any) => {
      if (!d.user_id) return;
      if (!depositStatsMap[d.user_id]) {
        depositStatsMap[d.user_id] = { total: 0, diterima: 0, dicek: 0, ditolak: 0 };
      }
      const s = (d.status || "").toLowerCase();
      depositStatsMap[d.user_id].total++;
      if (["accepted", "diterima", "sukses", "approved"].includes(s)) {
        depositStatsMap[d.user_id].diterima++;
      } else if (["pending", "dicek", "proses", "menunggu"].includes(s)) {
        depositStatsMap[d.user_id].dicek++;
      } else if (["rejected", "ditolak", "batal"].includes(s)) {
        depositStatsMap[d.user_id].ditolak++;
      }
    });

    // 6. Merge profiles, wallets, ewallets, avatars, referral data, and deposits
    let users = (profiles || []).map((p) => {
      const w = walletMap[p.id];
      const authUser = authUserMap[p.id];

      // Priority for avatar: profile.avatar_url > auth metadata avatar_url > picture
      const avatarUrl =
        p.avatar_url ||
        authUser?.user_metadata?.avatar_url ||
        authUser?.user_metadata?.picture ||
        null;

      // E-wallets list
      const userEwallets = ewalletMap[p.id] ? [...ewalletMap[p.id]] : [];
      if (p.dana_number && !userEwallets.some((ew) => ew.account_number === p.dana_number)) {
        userEwallets.unshift({
          id: `profile-${p.id}`,
          user_id: p.id,
          method: "DANA",
          account_number: p.dana_number,
          account_name: p.name || null,
          is_default: userEwallets.length === 0,
        });
      }

      // Referrer (upline) info
      const referredByCode = p.referred_by_code || null;
      const referrer = referredByCode ? refCodeToUserMap[referredByCode] || null : null;

      const userDeposits = depositStatsMap[p.id] || {
        total: 0,
        diterima: 0,
        dicek: 0,
        ditolak: 0,
      };

      return {
        id: p.id,
        name: p.name || p.email?.split("@")[0] || "Pengguna",
        email: p.email || "-",
        role: p.role || "User",
        avatar_url: avatarUrl,
        dana_number: p.dana_number,
        whatsapp_channel_url: p.whatsapp_channel_url,
        referral_code: p.referral_code,
        referred_by_code: referredByCode,
        referred_by_id: p.referred_by_id,
        referred_by_user: referrer ? { name: referrer.name, email: referrer.email } : null,
        ewallets: userEwallets,
        created_at: p.created_at,
        balance: Number(w?.balance || 0),
        total_withdrawn: Number(w?.total_withdrawn || 0),
        total_earned: Number(w?.total_earned || 0),
        wallet_id: w?.id || null,
        is_blocked: !!bannedMap[p.id],
        deposits_count: userDeposits,
      };
    });

    if (search) {
      users = users.filter((u) => {
        const matchesBasic =
          u.name.toLowerCase().includes(search) ||
          u.email.toLowerCase().includes(search) ||
          (u.id && u.id.toLowerCase().includes(search)) ||
          (u.dana_number && u.dana_number.includes(search)) ||
          (u.referral_code && u.referral_code.toLowerCase().includes(search)) ||
          (u.referred_by_code && u.referred_by_code.toLowerCase().includes(search));

        const matchesEwallet = u.ewallets.some(
          (ew: any) =>
            ew.account_number?.includes(search) ||
            ew.method?.toLowerCase().includes(search)
        );

        return matchesBasic || matchesEwallet;
      });
    }

    // Always put Admin role on top, then sort by newest created_at
    users.sort((a, b) => {
      const aIsAdmin = a.role === "Admin" ? 1 : 0;
      const bIsAdmin = b.role === "Admin" ? 1 : 0;
      if (aIsAdmin !== bIsAdmin) {
        return bIsAdmin - aIsAdmin; // Admin first
      }
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    const total = users.length;
    const limitParam = searchParams.get("limit") || "50";
    let paginatedUsers = users;
    if (limitParam !== "all") {
      const limitNum = parseInt(limitParam, 10) || 50;
      paginatedUsers = users.slice(0, limitNum);
    }

    return NextResponse.json({ success: true, users: paginatedUsers, total });
  } catch (err: any) {
    console.error("Users GET API error:", err);
    return NextResponse.json(
      { success: false, error: err?.message || "Gagal memuat daftar pengguna" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, userId } = body;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "User ID diperlukan" },
        { status: 400 }
      );
    }

    // Aksi 1: Edit Saldo
    if (action === "update_balance") {
      const { newBalance, delta, type, note } = body;
      const targetBalance = Number(newBalance);

      if (isNaN(targetBalance) || targetBalance < 0) {
        return NextResponse.json(
          { success: false, error: "Nominal saldo tidak valid" },
          { status: 400 }
        );
      }

      // Check if wallet row exists
      const { data: existingWallet } = await supabaseAdmin
        .from("wallets")
        .select("id, balance")
        .eq("user_id", userId)
        .maybeSingle();

      const oldBalance = Number(existingWallet?.balance || 0);

      if (existingWallet) {
        const { error: updateErr } = await supabaseAdmin
          .from("wallets")
          .update({
            balance: targetBalance,
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", userId);

        if (updateErr) throw updateErr;
      } else {
        const { error: insertErr } = await supabaseAdmin.from("wallets").insert({
          user_id: userId,
          balance: targetBalance,
          total_earned: targetBalance,
          total_withdrawn: 0,
          minimum_withdrawal: 5000,
        });
        if (insertErr) throw insertErr;
      }

      // Record transaction history
      const diff = targetBalance - oldBalance;
      await supabaseAdmin.from("transactions").insert({
        user_id: userId,
        type: diff >= 0 ? "deposit" : "withdrawal",
        amount: Math.abs(diff),
        title: diff >= 0 ? "Penambahan Saldo oleh Admin" : "Pengurangan Saldo oleh Admin",
        description: note || `Penyesuaian saldo manual dari Rp ${oldBalance.toLocaleString("id-ID")} ke Rp ${targetBalance.toLocaleString("id-ID")}`,
        status: "success",
      });

      return NextResponse.json({
        success: true,
        message: "Saldo pengguna berhasil diperbarui",
        oldBalance,
        newBalance: targetBalance,
      });
    }

    // Proteksi agar tidak bisa memblokir sesama admin
    if (action === "toggle_block") {
      const { data: targetProfile } = await supabaseAdmin
        .from("profiles")
        .select("role")
        .eq("id", userId)
        .maybeSingle();

      if (targetProfile?.role === "Admin") {
        return NextResponse.json(
          { success: false, error: "Tidak dapat memblokir sesama Admin" },
          { status: 403 }
        );
      }
    }

    // Proteksi: Admin tidak bisa mengubah role pengguna menjadi admin
    if (action === "toggle_role") {
      return NextResponse.json(
        { success: false, error: "Admin tidak dapat mengubah role pengguna menjadi Admin" },
        { status: 403 }
      );
    }

    // Aksi 3: Blokir / Buka Blokir
    if (action === "toggle_block") {
      const { isBlocked } = body;
      try {
        await supabaseAdmin.auth.admin.updateUserById(userId, {
          ban_duration: isBlocked ? "876000h" : "none",
        });
      } catch (authBanErr) {
        console.warn("Auth ban error (ignorable if not in auth.users):", authBanErr);
      }

      return NextResponse.json({
        success: true,
        message: isBlocked
          ? "Akun pengguna berhasil diblokir"
          : "Blokir akun pengguna berhasil dibuka",
        is_blocked: isBlocked,
      });
    }

    return NextResponse.json(
      { success: false, error: "Aksi tidak dikenal" },
      { status: 400 }
    );
  } catch (err: any) {
    console.error("Users PATCH API error:", err);
    return NextResponse.json(
      { success: false, error: err?.message || "Gagal memperbarui pengguna" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    let userId = searchParams.get("userId");

    if (!userId) {
      try {
        const body = await req.json();
        userId = body.userId;
      } catch {}
    }

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "User ID diperlukan untuk penghapusan" },
        { status: 400 }
      );
    }

    // Delete user data from tables
    await supabaseAdmin.from("support_tickets").delete().eq("user_id", userId);
    await supabaseAdmin.from("transactions").delete().eq("user_id", userId);
    await supabaseAdmin.from("withdrawals").delete().eq("user_id", userId);
    await supabaseAdmin.from("deposits").delete().eq("user_id", userId);
    await supabaseAdmin.from("wallets").delete().eq("user_id", userId);
    const { error: pErr } = await supabaseAdmin
      .from("profiles")
      .delete()
      .eq("id", userId);

    if (pErr) throw pErr;

    // Delete from auth.users
    try {
      await supabaseAdmin.auth.admin.deleteUser(userId);
    } catch (e) {
      console.warn("Could not delete from auth.users:", e);
    }

    return NextResponse.json({
      success: true,
      message: "Pengguna berhasil dihapus secara permanen",
    });
  } catch (err: any) {
    console.error("Users DELETE API error:", err);
    return NextResponse.json(
      { success: false, error: err?.message || "Gagal menghapus pengguna" },
      { status: 500 }
    );
  }
}
