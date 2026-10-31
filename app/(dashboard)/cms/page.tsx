"use client";

import React, { useState, useEffect } from "react";
import {
  DollarSign,
  FileText,
  Megaphone,
  Share2,
  ShieldAlert,
  Save,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  RefreshCw,
  Smartphone,
  Monitor,
  Copy,
  Check,
  Zap,
  Wrench,
  LogIn,
  UserPlus,
  Send,
  UserCheck,
  ChevronDown,
  ChevronUp,
  CreditCard,
  ShieldCheck,
  Lock,
  Mail,
  MessageCircle,
  Home,
  History,
  User,
  Wallet,
  Gift,
  ArrowUpRight,
  Clock,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { DEFAULT_CONFIG, SiteConfig } from "@/lib/site-config";
import { adminFetch } from "@/lib/api-client";

type CmsTab =
  | "landing"
  | "rules"
  | "pricing"
  | "contacts"
  | "features";

type PreviewDevice = "desktop" | "mobile";

export default function CmsPage() {
  const [config, setConfig] = useState<SiteConfig>(DEFAULT_CONFIG);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);

  // String state untuk input angka agar bisa diketik bebas tanpa panah counter (maks 6 digit)
  const [numericStrings, setNumericStrings] = useState<Record<string, string>>({});

  // Active form tab on the left: default Landing Page, langsung sinkron ke preview kanan
  const [activeTab, setActiveTab] = useState<CmsTab>("landing");

  // Device switcher for preview
  const [previewDevice, setPreviewDevice] = useState<PreviewDevice>("mobile");

  // Interactive controls within the live preview
  const [previewSelectedCount, setPreviewSelectedCount] = useState<number>(5);
  const [previewCopiedPassword, setPreviewCopiedPassword] = useState(false);
  const [previewShowRulesDetail, setPreviewShowRulesDetail] = useState(false);
  const [previewWithdrawMethod, setPreviewWithdrawMethod] = useState<
    "DANA" | "GOPAY" | "OVO" | "SHOPEEPAY"
  >("GOPAY");

  // Fetch initial configuration from database
  useEffect(() => {
    let isMounted = true;
    const fetchConfig = async () => {
      try {
        const res = await adminFetch("/api/admin/cms");
        const json = await res.json();
        if (json.success && json.config && isMounted) {
          setConfig(json.config);
          setNumericStrings({});
          setUpdatedAt(json.updatedAt || null);
        }
      } catch (err) {
        console.error("Gagal memuat konfigurasi CMS:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchConfig();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSaving(true);
    setSaveSuccess(null);
    setSaveError(null);

    try {
      const res = await adminFetch("/api/admin/cms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ config }),
      });
      const json = await res.json();

      if (json.success) {
        setSaveSuccess("Perubahan berhasil disimpan & disinkronkan ke web user!");
        setUpdatedAt(json.updatedAt || new Date().toISOString());
        setTimeout(() => setSaveSuccess(null), 4000);
      } else {
        setSaveError(json.error || "Gagal menyimpan perubahan CMS");
      }
    } catch (err: any) {
      setSaveError(err?.message || "Terjadi kesalahan saat menyimpan");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (confirm("Kembalikan seluruh konfigurasi ke nilai default awal?")) {
      setConfig(DEFAULT_CONFIG);
      setNumericStrings({});
    }
  };

  const updateField = <K extends keyof SiteConfig>(key: K, value: SiteConfig[K]) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
  };

  // Helper untuk input angka: bebas ketik tanpa panah counter, dibatasi maksimal 6 digit (0 - 999.999)
  const getNumberValue = (key: keyof SiteConfig): string => {
    if (numericStrings[key] !== undefined) {
      return numericStrings[key];
    }
    const val = config[key];
    return typeof val === "number" ? String(val) : "";
  };

  const handleNumberChange = (key: keyof SiteConfig, raw: string) => {
    const digits = raw.replace(/\D/g, "").slice(0, 6);
    setNumericStrings((prev) => ({ ...prev, [key]: digits }));
    const parsed = digits === "" ? 0 : parseInt(digits, 10);
    updateField(key, parsed as any);
  };

  const handleCopyPreviewPassword = () => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(config.default_password);
      setPreviewCopiedPassword(true);
      setTimeout(() => setPreviewCopiedPassword(false), 1500);
    }
  };

  // Helper for current withdraw tax in preview
  const previewTax = React.useMemo(() => {
    switch (previewWithdrawMethod) {
      case "GOPAY":
        return config.tax_gopay;
      case "OVO":
        return config.tax_ovo;
      case "DANA":
        return config.tax_dana;
      case "SHOPEEPAY":
        return config.tax_shopeepay;
      default:
        return 0;
    }
  }, [previewWithdrawMethod, config]);

  const activeTabLabels: Record<CmsTab, string> = {
    landing: "Landing Page",
    rules: "Rules",
    pricing: "Harga",
    contacts: "Kontak",
    features: "Fitur",
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-zinc-400 gap-3">
        <RefreshCw className="w-8 h-8 animate-spin text-emerald-400" />
        <span className="text-sm font-medium">Memuat Pengaturan CMS &amp; Live Preview...</span>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Toast Notifications */}
      {saveSuccess && (
        <div className="flex items-center gap-2.5 p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-950/40 text-emerald-300 text-xs sm:text-sm font-semibold animate-fade-down">
          <CheckCircle2 className="size-5 text-emerald-400 shrink-0" />
          <span>{saveSuccess}</span>
        </div>
      )}

      {saveError && (
        <div className="flex items-center gap-2.5 p-3.5 rounded-xl border border-rose-500/30 bg-rose-950/40 text-rose-300 text-xs sm:text-sm font-semibold animate-fade-down">
          <AlertCircle className="size-5 text-rose-400 shrink-0" />
          <span>{saveError}</span>
        </div>
      )}

      {/* Main Split Screen: Sisi Kiri (Form Controls) & Sisi Kanan (Interactive Live Preview) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* ========================================================= */}
        {/* SISI KIRI: FORM CONTROL CMS                               */}
        {/* ========================================================= */}
        <div className="xl:col-span-6 2xl:col-span-7 space-y-5">
          {/* Form Tabs Navigation - Responsive Grid, No Scrollbar / Slidebar */}
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-1.5 p-1.5 bg-zinc-900/60 border border-zinc-800/80 rounded-2xl">
            {[
              { key: "landing", label: "Landing Page", icon: Megaphone },
              { key: "rules", label: "Rules", icon: FileText },
              { key: "pricing", label: "Harga", icon: DollarSign },
              { key: "contacts", label: "Kontak", icon: Share2 },
              { key: "features", label: "Fitur", icon: ShieldAlert },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key as CmsTab)}
                  className={`flex items-center justify-center gap-1.5 sm:gap-2 px-2.5 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer text-center ${
                    isActive
                      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-xs font-bold"
                      : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50 border border-transparent"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{tab.label}</span>
                </button>
              );
            })}
          </div>

          <form onSubmit={handleSave} className="space-y-5">
            {/* TAB 1: LANDING PAGE */}
            {activeTab === "landing" && (
              <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-5 space-y-5">
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                    <Megaphone className="w-4 h-4 text-purple-400" />
                    Teks Landing Page &amp; Banner Pengumuman
                  </h3>
                  <p className="text-xs text-zinc-400 mt-1">
                    Sesuaikan headline besar, subheadline, badge status, dan teks running ticker (Maks 300 karakter per kolom).
                  </p>
                </div>

                <div className="space-y-4">
                  {/* Hero Headline 3 Baris */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-zinc-300">
                        Headline Utama (3 Baris Teks Besar)
                      </label>
                      <span className="text-[10px] text-zinc-500 font-mono">Maks 300 karakter</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      <div>
                        <span className="text-[10px] text-zinc-500 block mb-1">Baris 1</span>
                        <input
                          type="text"
                          maxLength={300}
                          value={config.hero_headline_1}
                          onChange={(e) => updateField("hero_headline_1", e.target.value.slice(0, 300))}
                          placeholder="Ubah Akun"
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] text-zinc-500 block mb-1">Baris 2</span>
                        <input
                          type="text"
                          maxLength={300}
                          value={config.hero_headline_2}
                          onChange={(e) => updateField("hero_headline_2", e.target.value.slice(0, 300))}
                          placeholder="Gmail Jadi"
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] text-zinc-500 block mb-1">Baris 3 (Gradient Sky)</span>
                        <input
                          type="text"
                          maxLength={300}
                          value={config.hero_headline_3}
                          onChange={(e) => updateField("hero_headline_3", e.target.value.slice(0, 300))}
                          placeholder="Penghasilan"
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-sky-400 font-bold focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Subheadline */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-zinc-300">
                        Subheadline (Penjelasan Singkat Bawah Headline)
                      </label>
                      <span className="text-[10px] text-zinc-500 font-mono">
                        {(config.hero_subheadline || "").length}/300
                      </span>
                    </div>
                    <textarea
                      rows={2}
                      maxLength={300}
                      value={config.hero_subheadline}
                      onChange={(e) => updateField("hero_subheadline", e.target.value.slice(0, 300))}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  {/* Platform Badge */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-zinc-300">
                        Micro-Badge Atas Headline
                      </label>
                      <span className="text-[10px] text-zinc-500 font-mono">Maks 300 karakter</span>
                    </div>
                    <input
                      type="text"
                      maxLength={300}
                      value={config.platform_badge}
                      onChange={(e) => updateField("platform_badge", e.target.value.slice(0, 300))}
                      placeholder="Platform Setor Gmail Terpercaya 2026"
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  {/* Running Marquee Text */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-zinc-300">
                        Running Marquee Ticker (Pemisah dengan titik tengah &bull;)
                      </label>
                      <span className="text-[10px] text-zinc-500 font-mono">
                        {(config.marquee_text || "").length}/300
                      </span>
                    </div>
                    <input
                      type="text"
                      maxLength={300}
                      value={config.marquee_text}
                      onChange={(e) => updateField("marquee_text", e.target.value.slice(0, 300))}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs font-mono text-zinc-200 focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  {/* Badge Pengumuman / Maintenance Status pada Showcase */}
                  <div className="pt-2 border-t border-zinc-800/80 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-xs font-bold text-white block">
                          Badge Pengumuman Showcase Card
                        </span>
                        <span className="text-[10px] text-zinc-400">
                          Tampilkan lencana status (misal tahap pengembangan) pada kartu tengah.
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => updateField("badge_status_active", !config.badge_status_active)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                          config.badge_status_active ? "bg-emerald-600" : "bg-zinc-800"
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            config.badge_status_active ? "translate-x-6" : "translate-x-1"
                          }`}
                        />
                      </button>
                    </div>

                    {config.badge_status_active && (
                      <div className="space-y-1.5 animate-fade-down">
                        <div className="flex items-center justify-between">
                          <label className="text-[11px] font-semibold text-zinc-300">
                            Teks Pengumuman Badge
                          </label>
                          <span className="text-[10px] text-zinc-500 font-mono">Maks 300 karakter</span>
                        </div>
                        <input
                          type="text"
                          maxLength={300}
                          value={config.badge_status_text}
                          onChange={(e) => updateField("badge_status_text", e.target.value.slice(0, 300))}
                          placeholder="Platform sedang dalam tahap pengembangan"
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-amber-300 focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: RULES */}
            {activeTab === "rules" && (
              <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-5 space-y-5">
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                    <FileText className="w-4 h-4 text-sky-400" />
                    Rules Setoran &amp; Parameter Generator
                  </h3>
                  <p className="text-xs text-zinc-400 mt-1">
                    Atur password default yang wajib dipakai user serta teks aturan 2x2 grid dan detail aturan (Maks 300 karakter per kolom).
                  </p>
                </div>

                <div className="space-y-4">
                  {/* Default Password */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-zinc-300">
                        Password Wajib (Default Password)
                      </label>
                      <span className="text-[10px] text-zinc-500 font-mono">Maks 300 karakter</span>
                    </div>
                    <input
                      type="text"
                      maxLength={300}
                      value={config.default_password}
                      onChange={(e) => updateField("default_password", e.target.value.slice(0, 300))}
                      placeholder="winter1212"
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-sm font-mono text-emerald-400 focus:outline-none focus:border-emerald-500"
                    />
                    <p className="text-[10px] text-zinc-500">
                      Password wajib yang disalin oleh user saat membuat akun Gmail di web user.
                    </p>
                  </div>

                  {/* 4 Cards Ringkas */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold text-zinc-300">1. Aturan Status</label>
                        <span className="text-[10px] text-zinc-500 font-mono">Maks 300</span>
                      </div>
                      <input
                        type="text"
                        maxLength={300}
                        value={config.rule_status}
                        onChange={(e) => updateField("rule_status", e.target.value.slice(0, 300))}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold text-zinc-300">2. Aturan Nama Akun</label>
                        <span className="text-[10px] text-zinc-500 font-mono">Maks 300</span>
                      </div>
                      <input
                        type="text"
                        maxLength={300}
                        value={config.rule_nama}
                        onChange={(e) => updateField("rule_nama", e.target.value.slice(0, 300))}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold text-zinc-300">3. Aturan Usia Akun</label>
                        <span className="text-[10px] text-zinc-500 font-mono">Maks 300</span>
                      </div>
                      <input
                        type="text"
                        maxLength={300}
                        value={config.rule_usia}
                        onChange={(e) => updateField("rule_usia", e.target.value.slice(0, 300))}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold text-zinc-300">4. Aturan Keamanan</label>
                        <span className="text-[10px] text-zinc-500 font-mono">Maks 300</span>
                      </div>
                      <input
                        type="text"
                        maxLength={300}
                        value={config.rule_keamanan}
                        onChange={(e) => updateField("rule_keamanan", e.target.value.slice(0, 300))}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  {/* Detail Aturan (4 baris penjelasan) */}
                  <div className="space-y-2 pt-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-zinc-300">
                        4 Poin Penjelasan Detail Aturan (Dropdown Collapsible)
                      </label>
                      <span className="text-[10px] text-zinc-500 font-mono">Maks 300 per poin</span>
                    </div>
                    {config.rules_detail_text.map((text, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <span className="flex size-6 shrink-0 items-center justify-center rounded-lg bg-zinc-800 text-[11px] font-bold text-zinc-300">
                          {idx + 1}
                        </span>
                        <input
                          type="text"
                          maxLength={300}
                          value={text}
                          onChange={(e) => {
                            const newRules = [...config.rules_detail_text];
                            newRules[idx] = e.target.value.slice(0, 300);
                            updateField("rules_detail_text", newRules);
                          }}
                          className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: HARGA */}
            {activeTab === "pricing" && (
              <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-5 space-y-5">
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-emerald-400" />
                    Pengaturan Harga Beli &amp; Biaya Penarikan
                  </h3>
                  <p className="text-xs text-zinc-400 mt-1">
                    Atur harga beli Gmail per akun, minimal withdraw, dan potongan pajak e-wallet (Isi angka langsung tanpa panah counter, maks 6 digit / 999.999).
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Harga per Gmail Fresh */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-zinc-300">
                        Harga Beli Gmail Fresh (Good)
                      </label>
                      <span className="text-[10px] text-zinc-500 font-mono">Maks 6 digit</span>
                    </div>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-xs font-bold text-zinc-500">Rp</span>
                      <input
                        type="text"
                        inputMode="numeric"
                        maxLength={6}
                        placeholder="0"
                        value={getNumberValue("price_per_gmail")}
                        onChange={(e) => handleNumberChange("price_per_gmail", e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-9 pr-3 py-2 text-sm font-mono text-zinc-100 focus:outline-none focus:border-emerald-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                    </div>
                    <p className="text-[10px] text-zinc-500">Harga standar setoran Fresh (Rp 4.500).</p>
                  </div>

                  {/* Harga per Gmail Bebas */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-zinc-300">
                        Harga Beli Gmail Bebas
                      </label>
                      <span className="text-[10px] text-zinc-500 font-mono">Maks 6 digit</span>
                    </div>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-xs font-bold text-zinc-500">Rp</span>
                      <input
                        type="text"
                        inputMode="numeric"
                        maxLength={6}
                        placeholder="0"
                        value={getNumberValue("price_bebas")}
                        onChange={(e) => handleNumberChange("price_bebas", e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-9 pr-3 py-2 text-sm font-mono text-zinc-100 focus:outline-none focus:border-emerald-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                    </div>
                    <p className="text-[10px] text-zinc-500">Harga untuk kategori Gmail bebas/cadangan.</p>
                  </div>

                  {/* Minimal Withdrawal */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-zinc-300">
                        Minimal Penarikan Saldo (Withdraw)
                      </label>
                      <span className="text-[10px] text-zinc-500 font-mono">Maks 6 digit</span>
                    </div>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-xs font-bold text-zinc-500">Rp</span>
                      <input
                        type="text"
                        inputMode="numeric"
                        maxLength={6}
                        placeholder="0"
                        value={getNumberValue("min_withdrawal")}
                        onChange={(e) => handleNumberChange("min_withdrawal", e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-9 pr-3 py-2 text-sm font-mono text-zinc-100 focus:outline-none focus:border-emerald-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                    </div>
                    <p className="text-[10px] text-zinc-500">Batas bawah pengajuan withdraw di web user.</p>
                  </div>

                  {/* Pajak GoPay */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-zinc-300">
                        Potongan Pajak Transfer GoPay
                      </label>
                      <span className="text-[10px] text-zinc-500 font-mono">Maks 6 digit</span>
                    </div>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-xs font-bold text-zinc-500">Rp</span>
                      <input
                        type="text"
                        inputMode="numeric"
                        maxLength={6}
                        placeholder="0"
                        value={getNumberValue("tax_gopay")}
                        onChange={(e) => handleNumberChange("tax_gopay", e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-9 pr-3 py-2 text-sm font-mono text-zinc-100 focus:outline-none focus:border-emerald-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                    </div>
                    <p className="text-[10px] text-zinc-500">Potongan otomatis penarikan ke GoPay.</p>
                  </div>

                  {/* Pajak OVO */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-zinc-300">
                        Potongan Pajak Transfer OVO
                      </label>
                      <span className="text-[10px] text-zinc-500 font-mono">Maks 6 digit</span>
                    </div>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-xs font-bold text-zinc-500">Rp</span>
                      <input
                        type="text"
                        inputMode="numeric"
                        maxLength={6}
                        placeholder="0"
                        value={getNumberValue("tax_ovo")}
                        onChange={(e) => handleNumberChange("tax_ovo", e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-9 pr-3 py-2 text-sm font-mono text-zinc-100 focus:outline-none focus:border-emerald-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                    </div>
                    <p className="text-[10px] text-zinc-500">Potongan otomatis penarikan ke OVO.</p>
                  </div>

                  {/* Pajak DANA */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-zinc-300">
                        Potongan Pajak Transfer DANA
                      </label>
                      <span className="text-[10px] text-zinc-500 font-mono">Maks 6 digit</span>
                    </div>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-xs font-bold text-zinc-500">Rp</span>
                      <input
                        type="text"
                        inputMode="numeric"
                        maxLength={6}
                        placeholder="0"
                        value={getNumberValue("tax_dana")}
                        onChange={(e) => handleNumberChange("tax_dana", e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-9 pr-3 py-2 text-sm font-mono text-zinc-100 focus:outline-none focus:border-emerald-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                    </div>
                    <p className="text-[10px] text-zinc-500">0 = Bebas biaya admin transfer DANA.</p>
                  </div>

                  {/* Pajak ShopeePay */}
                  <div className="space-y-1.5 sm:col-span-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-zinc-300">
                        Potongan Pajak Transfer ShopeePay
                      </label>
                      <span className="text-[10px] text-zinc-500 font-mono">Maks 6 digit</span>
                    </div>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-xs font-bold text-zinc-500">Rp</span>
                      <input
                        type="text"
                        inputMode="numeric"
                        maxLength={6}
                        placeholder="0"
                        value={getNumberValue("tax_shopeepay")}
                        onChange={(e) => handleNumberChange("tax_shopeepay", e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-9 pr-3 py-2 text-sm font-mono text-zinc-100 focus:outline-none focus:border-emerald-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                    </div>
                    <p className="text-[10px] text-zinc-500">0 = Bebas biaya admin transfer ShopeePay.</p>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: KONTAK */}
            {activeTab === "contacts" && (
              <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-5 space-y-5">
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                    <Share2 className="w-4 h-4 text-emerald-400" />
                    Tautan Saluran &amp; Kontak Komunitas
                  </h3>
                  <p className="text-xs text-zinc-400 mt-1">
                    Ubah link saluran WhatsApp resmi dan username Telegram CS tempat pengaduan user dialihkan (Maks 300 karakter).
                  </p>
                </div>

                <div className="space-y-4">
                  {/* WhatsApp Channel */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-zinc-300">
                        URL Saluran WhatsApp (Channel)
                      </label>
                      <span className="text-[10px] text-zinc-500 font-mono">
                        {(config.whatsapp_channel_url || "").length}/300
                      </span>
                    </div>
                    <div className="relative">
                      <MessageCircle className="w-4 h-4 text-emerald-400 absolute left-3 top-2.5" />
                      <input
                        type="url"
                        maxLength={300}
                        value={config.whatsapp_channel_url}
                        onChange={(e) => updateField("whatsapp_channel_url", e.target.value.slice(0, 300))}
                        placeholder="https://whatsapp.com/channel/..."
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-9 pr-3 py-2 text-xs font-mono text-zinc-100 focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  {/* Telegram Username */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-zinc-300">
                        Username Telegram Admin CS
                      </label>
                      <span className="text-[10px] text-zinc-500 font-mono">Maks 300 karakter</span>
                    </div>
                    <div className="relative">
                      <span className="text-xs font-bold text-sky-400 absolute left-3.5 top-2.5">@</span>
                      <input
                        type="text"
                        maxLength={300}
                        value={config.telegram_admin_username.replace("@", "")}
                        onChange={(e) =>
                          updateField(
                            "telegram_admin_username",
                            e.target.value.replace("@", "").trim().slice(0, 300)
                          )
                        }
                        placeholder="winterhere"
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-8 pr-3 py-2 text-xs font-mono text-zinc-100 focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <p className="text-[10px] text-zinc-500">
                      Tautan direct CS: https://t.me/{config.telegram_admin_username}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 5: FITUR */}
            {activeTab === "features" && (
              <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-5 space-y-5">
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-rose-400" />
                    Saklar Fitur &amp; Mode Pemeliharaan
                  </h3>
                  <p className="text-xs text-zinc-400 mt-1">
                    Aktifkan atau matikan fitur tertentu secara instan jika sedang terjadi gangguan server atau antrean penuh.
                  </p>
                </div>

                {/* Saklar Maintenance Global */}
                <div
                  className={`p-4 rounded-2xl border transition-all ${
                    config.is_maintenance_mode
                      ? "bg-rose-950/40 border-rose-500/50 shadow-lg shadow-rose-950/30"
                      : "bg-zinc-950 border-zinc-800"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
                        Mode Maintenance Global
                        {config.is_maintenance_mode && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500 text-white animate-pulse">
                            AKTIF
                          </span>
                        )}
                      </span>
                      <p className="text-[11px] text-zinc-400 mt-0.5">
                        Jika diaktifkan, seluruh akses web user akan menampilkan banner pemeliharaan.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => updateField("is_maintenance_mode", !config.is_maintenance_mode)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                        config.is_maintenance_mode ? "bg-rose-600" : "bg-zinc-800"
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          config.is_maintenance_mode ? "translate-x-6" : "translate-x-1"
                        }`}
                      />
                    </button>
                  </div>

                  {config.is_maintenance_mode && (
                    <div className="mt-3.5 space-y-1.5 animate-fade-down pt-3 border-t border-rose-500/30">
                      <div className="flex items-center justify-between">
                        <label className="text-[11px] font-semibold text-rose-300">
                          Pesan Pemeliharaan Untuk Pengguna
                        </label>
                        <span className="text-[10px] text-rose-400 font-mono">
                          {(config.maintenance_message || "").length}/300
                        </span>
                      </div>
                      <textarea
                        rows={2}
                        maxLength={300}
                        value={config.maintenance_message}
                        onChange={(e) => updateField("maintenance_message", e.target.value.slice(0, 300))}
                        className="w-full bg-zinc-900 border border-rose-500/40 rounded-xl px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-rose-400"
                      />
                    </div>
                  )}
                </div>

                {/* Saklar Fitur Parsial */}
                <div className="space-y-3 pt-2">
                  <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
                    Saklar Fitur Terpisah
                  </h4>

                  {/* Setor Akun */}
                  <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-950 border border-zinc-800">
                    <div>
                      <span className="text-xs font-bold text-white block">Penerimaan Setoran Akun</span>
                      <span className="text-[10px] text-zinc-400">
                        Izinkan user mengirim antrean setoran Gmail ke database.
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => updateField("is_setor_active", !config.is_setor_active)}
                      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors cursor-pointer ${
                        config.is_setor_active ? "bg-emerald-600" : "bg-zinc-800"
                      }`}
                    >
                      <span
                        className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                          config.is_setor_active ? "translate-x-4.5" : "translate-x-1"
                        }`}
                      />
                    </button>
                  </div>

                  {/* Checker Akun */}
                  <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-950 border border-zinc-800">
                    <div>
                      <span className="text-xs font-bold text-white block">Email Checker Otomatis</span>
                      <span className="text-[10px] text-zinc-400">
                        Izinkan pengecekan status Live / Die pada menu Checker.
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => updateField("is_checker_active", !config.is_checker_active)}
                      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors cursor-pointer ${
                        config.is_checker_active ? "bg-emerald-600" : "bg-zinc-800"
                      }`}
                    >
                      <span
                        className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                          config.is_checker_active ? "translate-x-4.5" : "translate-x-1"
                        }`}
                      />
                    </button>
                  </div>

                  {/* Penarikan Saldo */}
                  <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-950 border border-zinc-800">
                    <div>
                      <span className="text-xs font-bold text-white block">Penarikan Saldo (Withdrawal)</span>
                      <span className="text-[10px] text-zinc-400">
                        Izinkan user mengajukan pencairan saldo ke e-wallet.
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => updateField("is_withdrawal_active", !config.is_withdrawal_active)}
                      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors cursor-pointer ${
                        config.is_withdrawal_active ? "bg-emerald-600" : "bg-zinc-800"
                      }`}
                    >
                      <span
                        className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                          config.is_withdrawal_active ? "translate-x-4.5" : "translate-x-1"
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* In-Form Footer Bar: Terakhir Disimpan, Reset, Simpan Perubahan */}
            <div className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg">
              <div className="text-[11px] text-zinc-400">
                {updatedAt ? (
                  <span>
                    Terakhir disimpan:{" "}
                    <strong className="text-zinc-200 font-mono">
                      {new Date(updatedAt).toLocaleTimeString("id-ID", {
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                      })}
                    </strong>
                  </span>
                ) : (
                  <span>Konfigurasi aktif di sistem</span>
                )}
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleReset}
                  disabled={saving}
                  className="text-xs text-zinc-400 hover:text-white"
                >
                  <RotateCcw className="w-3.5 h-3.5 mr-1" />
                  Reset
                </Button>
                <Button
                  type="submit"
                  disabled={saving}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm px-5 py-2 rounded-xl shadow-lg shadow-emerald-950/40"
                >
                  {saving ? (
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  Simpan Perubahan
                </Button>
              </div>
            </div>
          </form>
        </div>

        {/* ========================================================= */}
        {/* SISI KANAN: INTERACTIVE LIVE PREVIEW                      */}
        {/* ========================================================= */}
        <div className="xl:col-span-6 2xl:col-span-5 xl:sticky xl:top-20 space-y-3">
          {/* Preview Control Header: Tanpa tombol screen manual, otomatis sinkron dengan tab kiri */}
          <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-3 backdrop-blur-md shadow-xl flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="flex size-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <div className="leading-tight">
                <span className="text-xs font-black text-white flex items-center gap-1.5 uppercase tracking-wider">
                  Live Preview
                </span>
                <span className="text-[10px] text-zinc-400">setorgmail.com</span>
              </div>
            </div>

            {/* Sync Badge & Device Switcher */}
            <div className="flex items-center gap-2">
              <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <span>Sinkron:</span>
                <strong className="text-white">{activeTabLabels[activeTab]}</strong>
              </span>

              {/* Device Selector */}
              <div className="flex items-center bg-zinc-950 border border-zinc-800 rounded-lg p-0.5">
                <button
                  type="button"
                  onClick={() => setPreviewDevice("desktop")}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-bold transition-all cursor-pointer ${
                    previewDevice === "desktop"
                      ? "bg-emerald-600 text-white shadow-xs"
                      : "text-zinc-400 hover:text-zinc-200"
                  }`}
                  title="Desktop View"
                >
                  <Monitor className="size-3" />
                  <span className="hidden sm:inline">Desktop</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewDevice("mobile")}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-bold transition-all cursor-pointer ${
                    previewDevice === "mobile"
                      ? "bg-emerald-600 text-white shadow-xs"
                      : "text-zinc-400 hover:text-zinc-200"
                  }`}
                  title="Mobile Frame View"
                >
                  <Smartphone className="size-3" />
                  <span className="hidden sm:inline">Mobile</span>
                </button>
              </div>
            </div>
          </div>

          {/* ========================================================= */}
          {/* DEVICE SHELL CONTAINER                                    */}
          {/* ========================================================= */}
          <div
            className={`transition-all duration-300 mx-auto ${
              previewDevice === "mobile"
                ? "max-w-[340px] sm:max-w-[360px] rounded-[36px] border-[6px] border-zinc-800 bg-[#09090b] shadow-2xl p-2.5 overflow-hidden"
                : "w-full rounded-2xl border border-zinc-800 bg-[#09090b] shadow-2xl overflow-hidden"
            }`}
          >
            {/* Desktop Window Top Header */}
            {previewDevice === "desktop" ? (
              <div className="flex items-center justify-between px-3 py-2 bg-zinc-950 border-b border-zinc-800/80 text-zinc-400 text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="size-2.5 rounded-full bg-rose-500/80" />
                  <span className="size-2.5 rounded-full bg-amber-500/80" />
                  <span className="size-2.5 rounded-full bg-emerald-500/80" />
                </div>
                <div className="flex items-center gap-1.5 bg-zinc-900 border border-zinc-800/80 px-2.5 py-0.5 rounded-md text-[10px] font-mono text-zinc-300">
                  <Lock className="size-2.5 text-emerald-400" />
                  <span>https://setorgmail.com</span>
                </div>
                <div className="text-[10px] text-zinc-500 font-mono">100% Real-time</div>
              </div>
            ) : (
              /* Mobile Dynamic Island / Notch */
              <div className="flex items-center justify-center pb-2">
                <div className="w-24 h-3.5 bg-zinc-800 rounded-full flex items-center justify-end px-2">
                  <span className="size-1.5 rounded-full bg-zinc-950" />
                </div>
              </div>
            )}

            {/* Viewport Content Area: 100% Mengikuti setorgmail.com Asli */}
            <div className="h-[520px] sm:h-[580px] overflow-y-auto bg-[#09090b] text-[#f8fafc] text-xs select-none relative no-scrollbar flex flex-col justify-between">
              <div className="space-y-4">
                {/* Global Emergency Maintenance Notification Bar if active and not on features tab */}
                {config.is_maintenance_mode && activeTab !== "features" && (
                  <div className="sticky top-0 z-30 bg-rose-600/90 text-white px-3 py-1.5 text-[10px] font-bold flex items-center justify-between backdrop-blur-md">
                    <span className="flex items-center gap-1">
                      <ShieldAlert className="size-3 shrink-0" />
                      <span>Mode Maintenance Aktif</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setActiveTab("features")}
                      className="underline text-[10px] cursor-pointer"
                    >
                      Buka Saklar
                    </button>
                  </div>
                )}

                {/* TopBar Asli setorgmail.com (Ditampilkan pada semua tab selain landing) */}
                {activeTab !== "landing" && (
                  <div className="sticky top-0 z-20 flex items-center justify-between px-3.5 py-2.5 border-b border-white/10 bg-[#09090b]/90 backdrop-blur-md">
                    {/* Brand Name & Logo Asli */}
                    <div className="flex items-baseline gap-1.5 text-[0.85rem] tracking-tight">
                      <span className="font-black text-white tracking-tight">SETOR GMAIL</span>
                      <span className="text-[9px] font-bold text-zinc-400 lowercase">by</span>
                      <span className="font-black tracking-tight bg-gradient-to-r from-sky-400 via-cyan-300 to-blue-500 bg-clip-text text-transparent">
                        Winter
                      </span>
                      <img
                        src="/logo_removebg.png"
                        alt="Logo"
                        className="h-5 w-auto object-contain inline-block ml-1"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = "none";
                        }}
                      />
                    </div>

                    {/* Saluran WA Pill */}
                    <a
                      href={config.whatsapp_channel_url}
                      target="_blank"
                      rel="noreferrer"
                      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold transition-all shadow-2xs ${
                        activeTab === "contacts"
                          ? "border-emerald-400/60 bg-emerald-500/20 text-emerald-300 ring-2 ring-emerald-500/30"
                          : "border-white/10 bg-white/5 text-zinc-200 hover:bg-white/10"
                      }`}
                    >
                      <span className="flex size-3.5 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
                        <MessageCircle className="size-2" />
                      </span>
                      <span>Saluran WA</span>
                    </a>
                  </div>
                )}

                {/* =================================================== */}
                {/* 1. VIEW UNTUK TAB: HARGA & SALDO                    */}
                {/* =================================================== */}
                {activeTab === "pricing" && (
                  <div className="p-3.5 space-y-3.5">
                    {/* Saldo Akun Card Asli */}
                    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#121217]/85 p-4 shadow-xl backdrop-blur-xl">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-[10px] font-semibold tracking-wide text-zinc-400 uppercase">
                            Saldo Kamu
                          </p>
                          <p className="mt-1 text-2xl font-black tracking-tight text-white tabular-nums">
                            Rp 50.000
                          </p>
                        </div>
                        <span className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-sky-400 via-sky-500 to-blue-600 text-white shadow-md shadow-sky-500/30">
                          <Wallet className="size-4" />
                        </span>
                      </div>

                      {/* Tag Harga / Gmail Sesuai CMS */}
                      <div className="mt-3 flex flex-wrap items-center gap-1.5">
                        <span className="inline-flex items-center rounded-full bg-sky-500/10 border border-sky-500/20 px-2 py-0.5 text-[9px] font-semibold text-sky-400">
                          Fresh: Rp {config.price_per_gmail.toLocaleString("id-ID")}/akun
                        </span>
                        <span className="inline-flex items-center rounded-full bg-zinc-800 border border-zinc-700 px-2 py-0.5 text-[9px] font-semibold text-zinc-300">
                          Bebas: Rp {config.price_bebas.toLocaleString("id-ID")}/akun
                        </span>
                      </div>
                    </div>

                    {/* Modal Tarik Saldo E-Wallet Asli */}
                    <div className="rounded-2xl border border-sky-500/30 bg-sky-950/20 p-3.5 space-y-3 backdrop-blur-md">
                      <div className="flex items-center justify-between border-b border-sky-500/20 pb-2">
                        <div>
                          <span className="text-[9px] uppercase font-bold tracking-wider text-sky-400 block">
                            Tarik Saldo E-Wallet
                          </span>
                          <span className="text-xs font-bold text-white">
                            Penarikan ke {previewWithdrawMethod}
                          </span>
                        </div>
                        <span className="text-[10px] text-zinc-400 font-mono">
                          Min: Rp {config.min_withdrawal.toLocaleString("id-ID")}
                        </span>
                      </div>

                      {/* Input Nominal Tarik */}
                      <div className="space-y-1">
                        <span className="text-[9px] text-zinc-400 font-medium">Nominal Penarikan:</span>
                        <div className="flex items-center gap-1.5">
                          <span className="flex h-9 items-center justify-center px-2.5 rounded-xl border border-sky-500/30 bg-sky-500/10 font-bold text-xs text-sky-300">
                            Rp
                          </span>
                          <div className="flex-1 bg-black/50 border border-white/10 rounded-xl px-3 py-1.5 font-bold text-sm text-white font-mono">
                            20.000
                          </div>
                        </div>
                      </div>

                      {/* Pilihan 4 E-Wallet dengan Pajak Real-time */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[9px]">
                          <span className="font-semibold text-zinc-300">Pilih E-Wallet:</span>
                          <span className="text-amber-400 font-bold">
                            {previewWithdrawMethod} pajak Rp {previewTax.toLocaleString("id-ID")}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-1.5">
                          {[
                            { id: "DANA", label: "DANA", tax: config.tax_dana },
                            { id: "GOPAY", label: "GoPay", tax: config.tax_gopay },
                            { id: "OVO", label: "OVO", tax: config.tax_ovo },
                            { id: "SHOPEEPAY", label: "ShopeePay", tax: config.tax_shopeepay },
                          ].map((item) => (
                            <button
                              key={item.id}
                              type="button"
                              onClick={() => setPreviewWithdrawMethod(item.id as any)}
                              className={`p-2 rounded-xl border text-left transition-all cursor-pointer ${
                                previewWithdrawMethod === item.id
                                  ? "border-sky-500 bg-sky-500/20 text-white font-bold shadow-xs"
                                  : "border-white/5 bg-black/30 text-zinc-400 hover:border-white/10 hover:text-white"
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-xs">{item.label}</span>
                                {previewWithdrawMethod === item.id && (
                                  <CheckCircle2 className="size-3 text-sky-400" />
                                )}
                              </div>
                              <span className="text-[8px] text-zinc-500 font-mono block mt-0.5">
                                {item.tax === 0 ? "Bebas Pajak" : `Pajak: Rp ${item.tax.toLocaleString("id-ID")}`}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Kalkulasi Diterima */}
                      <div className="p-2 rounded-xl bg-black/40 border border-white/5 flex items-center justify-between text-[11px]">
                        <span className="text-zinc-400">Diterima Bersih:</span>
                        <span className="font-mono font-black text-emerald-400">
                          Rp {(20000 - previewTax).toLocaleString("id-ID")}
                        </span>
                      </div>

                      <button
                        type="button"
                        className="w-full py-2 rounded-xl bg-gradient-to-r from-sky-400 via-sky-500 to-blue-600 text-white font-bold text-xs shadow-md shadow-sky-500/20 cursor-pointer"
                      >
                        Konfirmasi Tarik Saldo
                      </button>
                    </div>
                  </div>
                )}

                {/* =================================================== */}
                {/* 2. VIEW UNTUK TAB: RULES & GENERATOR                */}
                {/* =================================================== */}
                {activeTab === "rules" && (
                  <div className="p-3.5 space-y-3.5">
                    {/* Unified Section: Rules & Generate Gmail */}
                    <div className="rounded-2xl border border-white/10 bg-[#121217]/85 p-3.5 shadow-xl space-y-3">
                      {/* Header Rules */}
                      <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                        <div className="flex items-center gap-2">
                          <span className="flex size-7 items-center justify-center rounded-lg bg-gradient-to-br from-sky-400 via-sky-500 to-blue-600 text-white shadow-xs">
                            <FileText className="size-4" />
                          </span>
                          <div>
                            <h4 className="text-xs font-bold text-white">Rules Setoran Gmail</h4>
                            <p className="text-[9px] text-zinc-400">Patuhi aturan agar di-ACC admin</p>
                          </div>
                        </div>

                        {/* Collapsible Trigger */}
                        <button
                          type="button"
                          onClick={() => setPreviewShowRulesDetail(!previewShowRulesDetail)}
                          className="text-[10px] font-bold text-sky-400 hover:text-sky-300 flex items-center gap-1 cursor-pointer"
                        >
                          <span>{previewShowRulesDetail ? "[-] Sembunyikan" : "[+] Detail Aturan"}</span>
                          {previewShowRulesDetail ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
                        </button>
                      </div>

                      {/* 2x2 Grid Cards Visual & Ringkas */}
                      <div className="grid grid-cols-2 gap-2">
                        {/* 1. Status */}
                        <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/40 p-2">
                          <span className="flex size-6 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            <Sparkles className="size-3" />
                          </span>
                          <div className="min-w-0">
                            <span className="text-[8px] font-semibold text-zinc-400 uppercase block">Status</span>
                            <span className="text-[10px] font-bold text-white truncate block">
                              {config.rule_status}
                            </span>
                          </div>
                        </div>

                        {/* 2. Nama Akun */}
                        <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/40 p-2">
                          <span className="flex size-6 shrink-0 items-center justify-center rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20">
                            <UserCheck className="size-3" />
                          </span>
                          <div className="min-w-0">
                            <span className="text-[8px] font-semibold text-zinc-400 uppercase block">Nama Akun</span>
                            <span className="text-[10px] font-bold text-white truncate block">
                              {config.rule_nama}
                            </span>
                          </div>
                        </div>

                        {/* 3. Usia Akun */}
                        <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/40 p-2">
                          <span className="flex size-6 shrink-0 items-center justify-center rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
                            <Clock className="size-3" />
                          </span>
                          <div className="min-w-0">
                            <span className="text-[8px] font-semibold text-zinc-400 uppercase block">Usia Akun</span>
                            <span className="text-[10px] font-bold text-white truncate block">
                              {config.rule_usia}
                            </span>
                          </div>
                        </div>

                        {/* 4. Keamanan */}
                        <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/40 p-2">
                          <span className="flex size-6 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                            <ShieldAlert className="size-3" />
                          </span>
                          <div className="min-w-0">
                            <span className="text-[8px] font-semibold text-zinc-400 uppercase block">Keamanan</span>
                            <span className="text-[10px] font-bold text-white truncate block">
                              {config.rule_keamanan}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Detail Aturan Collapsible */}
                      {previewShowRulesDetail && (
                        <div className="space-y-1.5 p-2 rounded-xl bg-black/50 border border-white/10 animate-fade-down text-[10px] text-zinc-300">
                          {config.rules_detail_text.map((text, idx) => (
                            <div key={idx} className="flex items-start gap-1.5">
                              <span className="flex size-3.5 shrink-0 items-center justify-center rounded-full bg-sky-500/20 text-sky-400 font-bold text-[8px] mt-0.5">
                                {idx + 1}
                              </span>
                              <span className="leading-tight">{text}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Generator Nama Gmail Card */}
                      <div className="pt-2 border-t border-white/10 space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-white flex items-center gap-1.5">
                            <Sparkles className="size-3 text-sky-400" />
                            Generator Nama Gmail
                          </span>
                          <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full font-mono">
                            Rp {config.price_per_gmail.toLocaleString("id-ID")}/akun
                          </span>
                        </div>

                        {/* Presets Jumlah Akun */}
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] text-zinc-400">Pilih:</span>
                          {[1, 3, 5, 10].map((num) => (
                            <button
                              key={num}
                              type="button"
                              onClick={() => setPreviewSelectedCount(num)}
                              className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                                previewSelectedCount === num
                                  ? "bg-gradient-to-r from-sky-400 to-blue-600 text-white shadow-xs"
                                  : "bg-white/5 text-zinc-400 hover:text-white border border-white/10"
                              }`}
                            >
                              {num} Akun
                            </button>
                          ))}
                        </div>

                        {/* Password Wajib Card */}
                        <div className="flex items-center justify-between p-2 rounded-xl bg-black/40 border border-emerald-500/30">
                          <div>
                            <span className="text-[8px] uppercase font-bold text-emerald-400 block">Password Wajib:</span>
                            <span className="font-mono text-xs font-black text-white">{config.default_password}</span>
                          </div>
                          <button
                            type="button"
                            onClick={handleCopyPreviewPassword}
                            className="px-2 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 text-[10px] font-bold flex items-center gap-1 hover:bg-emerald-500/30 cursor-pointer"
                          >
                            {previewCopiedPassword ? <Check className="size-3" /> : <Copy className="size-3" />}
                            <span>{previewCopiedPassword ? "Tersalin" : "Salin"}</span>
                          </button>
                        </div>

                        {/* Estimasi Saldo */}
                        <div className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-between text-[11px]">
                          <span className="text-zinc-400">Estimasi Saldo ({previewSelectedCount} Akun):</span>
                          <span className="font-mono font-black text-emerald-400">
                            Rp {(previewSelectedCount * config.price_per_gmail).toLocaleString("id-ID")}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* =================================================== */}
                {/* 3. VIEW UNTUK TAB: LANDING & BANNER                 */}
                {/* =================================================== */}
                {activeTab === "landing" && (
                  <div className="p-4 flex flex-col justify-between min-h-[460px] space-y-5 relative">
                    {/* Marquee Ticker Bar Asli */}
                    <div className="overflow-hidden border-y border-white/10 bg-black/60 py-2 -mx-4 shadow-md">
                      <div className="whitespace-nowrap font-mono text-[9px] font-bold tracking-widest text-zinc-300 uppercase animate-marquee">
                        {config.marquee_text} &bull; {config.marquee_text}
                      </div>
                    </div>

                    {/* Hero Left: Micro-badge, Headlines, Subtitle, Buttons */}
                    <div className="space-y-3 text-center">
                      <div className="inline-flex items-center gap-1.5 rounded-full border border-sky-400/20 bg-sky-950/40 px-3 py-0.5 backdrop-blur-md">
                        <span className="size-1.5 rounded-full bg-sky-400 animate-ping" />
                        <span className="text-[10px] font-bold text-sky-300">
                          {config.platform_badge || "Platform Setor Gmail Terpercaya 2026"}
                        </span>
                      </div>

                      <h2 className="text-2xl sm:text-3xl font-black tracking-tight leading-[1.1]">
                        <span className="block text-white">{config.hero_headline_1}</span>
                        <span className="block text-white mt-0.5">{config.hero_headline_2}</span>
                        <span className="inline-block mt-0.5 bg-gradient-to-r from-sky-400 via-cyan-300 to-blue-500 bg-clip-text text-transparent drop-shadow-[0_0_20px_rgba(56,189,248,0.5)]">
                          {config.hero_headline_3}
                        </span>
                      </h2>

                      <p className="text-[11px] text-zinc-400 leading-relaxed max-w-xs mx-auto">
                        {config.hero_subheadline}
                      </p>

                      <div className="flex items-center justify-center gap-2 pt-1">
                        <button
                          type="button"
                          className="px-4 py-2 rounded-full font-bold text-xs bg-white/5 border border-white/10 text-white flex items-center gap-1.5 shadow-md shadow-sky-500/10 hover:border-sky-400/40"
                        >
                          <LogIn className="size-3.5 text-sky-400" />
                          <span>Login</span>
                        </button>
                        <button
                          type="button"
                          className="px-4 py-2 rounded-full font-bold text-xs bg-white/5 border border-white/10 text-white flex items-center gap-1.5 shadow-md shadow-emerald-500/10 hover:border-emerald-400/40"
                        >
                          <UserPlus className="size-3.5 text-emerald-400" />
                          <span>Daftar</span>
                        </button>
                      </div>
                    </div>

                    {/* Center Showcase Card Asli dengan Logo Amplop */}
                    <div className="rounded-3xl border border-white/10 bg-[#121217]/90 p-4 text-center space-y-2 shadow-2xl relative">
                      <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-sky-500 to-blue-600 shadow-xl shadow-sky-500/30 p-2 overflow-hidden">
                        <img
                          src="/envelope-icon.png"
                          alt="Setor Gmail"
                          className="size-full object-contain"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = "none";
                          }}
                        />
                      </div>

                      <h3 className="text-sm font-black text-white">Setor Gmail</h3>
                      <p className="text-[10px] text-zinc-400">
                        Platform setor gmail tercepat &amp; terpercaya
                      </p>

                      {/* Badge Status Pengumuman */}
                      {config.badge_status_active && (
                        <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/40 bg-gradient-to-r from-amber-950/80 via-amber-900/60 to-amber-950/80 px-3 py-1 text-[10px] font-bold text-amber-300 shadow-[0_0_20px_-3px_rgba(245,158,11,0.4)]">
                          <span className="size-1.5 rounded-full bg-amber-400 animate-ping" />
                          <Wrench className="size-3 text-amber-300" />
                          <span>{config.badge_status_text}</span>
                        </div>
                      )}

                      {/* 4 Floating Mini Cards */}
                      <div className="grid grid-cols-2 gap-2 pt-2 text-left">
                        <div className="p-2 rounded-xl bg-black/40 border border-white/5 flex items-center gap-2">
                          <Zap className="size-3.5 text-amber-400 fill-amber-400" />
                          <div>
                            <div className="text-[10px] font-bold text-white">Cair Instan</div>
                            <div className="text-[8px] text-zinc-400">E-wallet &amp; Bank</div>
                          </div>
                        </div>

                        <div className="p-2 rounded-xl bg-black/40 border border-white/5 flex items-center gap-2">
                          <DollarSign className="size-3.5 text-emerald-400" />
                          <div>
                            <div className="text-[10px] font-bold text-white">
                              Rp {config.price_per_gmail.toLocaleString("id-ID")}
                            </div>
                            <div className="text-[8px] text-zinc-400">Per Akun Fresh</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Giant Background Text Masking */}
                    <div className="text-center font-black text-3xl tracking-tighter text-transparent bg-gradient-to-b from-white/10 to-transparent bg-clip-text select-none pb-1 pointer-events-none">
                      SETOR GMAIL
                    </div>
                  </div>
                )}

                {/* =================================================== */}
                {/* 4. VIEW UNTUK TAB: KONTAK & WA                      */}
                {/* =================================================== */}
                {activeTab === "contacts" && (
                  <div className="p-3.5 space-y-3.5">
                    {/* WhatsApp Channel Card */}
                    <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/20 p-4 space-y-3 backdrop-blur-md">
                      <div className="flex items-center gap-2.5">
                        <span className="flex size-9 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          <MessageCircle className="size-5" />
                        </span>
                        <div>
                          <h4 className="text-xs font-bold text-white">Saluran WhatsApp Resmi</h4>
                          <p className="text-[10px] text-zinc-400">Update harga &amp; kuota setoran</p>
                        </div>
                      </div>

                      <p className="text-[11px] text-zinc-300 leading-relaxed">
                        Bergabung ke saluran resmi kami untuk mendapatkan informasi terbaru secara berkala.
                      </p>

                      <a
                        href={config.whatsapp_channel_url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors"
                      >
                        <MessageCircle className="size-3.5" />
                        <span>Kunjungi Saluran WhatsApp</span>
                      </a>
                    </div>

                    {/* Telegram CS Admin Card */}
                    <div className="rounded-2xl border border-sky-500/30 bg-sky-950/20 p-4 space-y-3 backdrop-blur-md">
                      <div className="flex items-center gap-2.5">
                        <span className="flex size-9 items-center justify-center rounded-xl bg-sky-500/20 text-sky-400 border border-sky-500/30">
                          <Send className="size-4.5" />
                        </span>
                        <div>
                          <h4 className="text-xs font-bold text-white">Customer Service Telegram</h4>
                          <p className="text-[10px] text-zinc-400">Bantuan kendala akun &amp; penarikan</p>
                        </div>
                      </div>

                      <p className="text-[11px] text-zinc-300 leading-relaxed">
                        Hubungi admin secara langsung jika mengalami kendala saat menyetor atau mencairkan saldo.
                      </p>

                      <a
                        href={`https://t.me/${config.telegram_admin_username.replace("@", "")}`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-gradient-to-r from-sky-400 via-sky-500 to-blue-600 text-white font-bold text-xs shadow-md shadow-sky-500/20"
                      >
                        <Send className="size-3.5" />
                        <span>Chat CS: @{config.telegram_admin_username.replace("@", "")}</span>
                      </a>
                    </div>
                  </div>
                )}

                {/* =================================================== */}
                {/* 5. VIEW UNTUK TAB: FITUR & SAKLAR                   */}
                {/* =================================================== */}
                {activeTab === "features" && (
                  <div className="p-3.5 space-y-3.5">
                    {config.is_maintenance_mode ? (
                      /* Mode Maintenance Aktif */
                      <div className="p-5 flex flex-col items-center justify-center text-center space-y-3.5 rounded-2xl border border-rose-500/30 bg-rose-950/30">
                        <div className="flex size-14 items-center justify-center rounded-2xl bg-rose-500/20 border border-rose-500/40 text-rose-400 animate-bounce">
                          <ShieldAlert className="size-7" />
                        </div>

                        <div className="space-y-1">
                          <span className="px-2.5 py-0.5 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-300 text-[10px] font-bold uppercase tracking-wider">
                            Mode Pemeliharaan Aktif
                          </span>
                          <h3 className="text-base font-black text-white">
                            Sistem Sedang Dalam Pemeliharaan
                          </h3>
                        </div>

                        <div className="p-3 rounded-xl bg-black/60 border border-rose-500/30 text-xs text-zinc-300 max-w-xs leading-relaxed">
                          {config.maintenance_message}
                        </div>

                        <a
                          href={`https://t.me/${config.telegram_admin_username}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs text-sky-400 hover:underline pt-1 font-semibold"
                        >
                          <Send className="size-3.5" />
                          <span>Hubungi CS Telegram: @{config.telegram_admin_username}</span>
                        </a>
                      </div>
                    ) : (
                      /* Status Layanan Normal */
                      <div className="space-y-2.5">
                        <div className="p-3 rounded-2xl bg-emerald-950/30 border border-emerald-500/30 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <ShieldCheck className="size-5 text-emerald-400" />
                            <div>
                              <span className="text-xs font-bold text-white block">Sistem Beroperasi Penuh</span>
                              <span className="text-[10px] text-zinc-400">Mode maintenance sedang nonaktif.</span>
                            </div>
                          </div>
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold">
                            Normal
                          </span>
                        </div>

                        <div className="grid grid-cols-3 gap-2 text-[11px]">
                          <div className="p-2.5 rounded-xl bg-black/40 border border-white/5 space-y-1">
                            <span className="text-zinc-400 block text-[9px] uppercase font-bold">Setor Akun</span>
                            <span className={`font-bold block ${config.is_setor_active ? "text-emerald-400" : "text-rose-400"}`}>
                              {config.is_setor_active ? "Buka (Menerima)" : "Tutup Sementara"}
                            </span>
                          </div>

                          <div className="p-2.5 rounded-xl bg-black/40 border border-white/5 space-y-1">
                            <span className="text-zinc-400 block text-[9px] uppercase font-bold">Checker Akun</span>
                            <span className={`font-bold block ${config.is_checker_active ? "text-emerald-400" : "text-rose-400"}`}>
                              {config.is_checker_active ? "Online Aktif" : "Maintenance"}
                            </span>
                          </div>

                          <div className="p-2.5 rounded-xl bg-black/40 border border-white/5 space-y-1">
                            <span className="text-zinc-400 block text-[9px] uppercase font-bold">Tarik Saldo</span>
                            <span className={`font-bold block ${config.is_withdrawal_active ? "text-emerald-400" : "text-rose-400"}`}>
                              {config.is_withdrawal_active ? "Bisa Ditarik" : "Tutup Sementara"}
                            </span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => updateField("is_maintenance_mode", true)}
                          className="w-full py-2 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 text-xs font-bold transition-colors cursor-pointer"
                        >
                          Simulasikan Nyalakan Maintenance
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* BottomNav Asli setorgmail.com (Ditampilkan di bagian bawah preview bila bukan landing) */}
              {activeTab !== "landing" && (
                <div className="sticky bottom-0 z-20 px-3 py-2 bg-[#09090b]/90 border-t border-white/10 backdrop-blur-md">
                  <div className="flex items-center justify-around gap-1 rounded-2xl border border-white/10 bg-[#121215]/95 p-1.5 shadow-xl">
                    <div
                      className={`flex flex-col items-center py-1 px-2 rounded-xl text-[9px] font-semibold transition-colors ${
                        activeTab === "pricing" ? "text-sky-400 bg-sky-400/10 font-bold" : "text-zinc-400"
                      }`}
                    >
                      <Home className="size-3.5 mb-0.5" />
                      <span>Beranda</span>
                    </div>

                    <div className="flex flex-col items-center py-1 px-2 rounded-xl text-[9px] font-semibold text-zinc-400">
                      <History className="size-3.5 mb-0.5" />
                      <span>Riwayat</span>
                    </div>

                    {/* Elevated Setor Button */}
                    <div
                      className={`flex items-center justify-center size-8 rounded-full text-white shadow-md transition-all ${
                        activeTab === "rules"
                          ? "bg-gradient-to-tr from-sky-400 via-sky-500 to-blue-600 ring-2 ring-sky-400 shadow-sky-500/50 scale-105"
                          : "bg-gradient-to-tr from-sky-400 via-sky-500 to-blue-600"
                      }`}
                    >
                      <Send className="size-3.5" />
                    </div>

                    <div className="flex flex-col items-center py-1 px-2 rounded-xl text-[9px] font-semibold text-zinc-400">
                      <ShieldCheck className="size-3.5 mb-0.5" />
                      <span>Checker</span>
                    </div>

                    <div
                      className={`flex flex-col items-center py-1 px-2 rounded-xl text-[9px] font-semibold transition-colors ${
                        activeTab === "contacts"
                          ? "text-sky-400 bg-sky-400/10 font-bold"
                          : "text-zinc-400"
                      }`}
                    >
                      <User className="size-3.5 mb-0.5" />
                      <span>Profil</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Mobile Home Bar */}
            {previewDevice === "mobile" && (
              <div className="pt-2 pb-0.5 flex justify-center">
                <div className="w-24 h-1 bg-zinc-700 rounded-full" />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
