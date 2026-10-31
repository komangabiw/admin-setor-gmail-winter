export interface SiteConfig {
  // 1. Harga & Transaksi
  price_per_gmail: number;        // Default: 4500
  price_bebas: number;            // Default: 2500
  min_withdrawal: number;         // Default: 5000
  tax_gopay: number;              // Default: 1000
  tax_ovo: number;                // Default: 1000
  tax_dana: number;               // Default: 0
  tax_shopeepay: number;          // Default: 0

  // 2. Rules & Generator
  default_password: string;       // Default: "winter1212"
  rule_status: string;            // Default: "Wajib Fresh (baru dibuat)"
  rule_nama: string;              // Default: "Wajib sama persis hasil generate"
  rule_usia: string;              // Default: "Lahir 18+ tahun"
  rule_keamanan: string;          // Default: "Tanpa No HP / Email Pemulihan"
  rules_detail_text: string[];    // Array 4 baris penjelasan detail aturan

  // 3. Landing Page & Pengumuman
  hero_headline_1: string;        // Default: "Ubah Akun"
  hero_headline_2: string;        // Default: "Gmail Jadi"
  hero_headline_3: string;        // Default: "Penghasilan"
  hero_subheadline: string;       // Default: "Buat akun Gmail dan dapatkan saldo. Pencairan instan via E-wallet dan Bank."
  platform_badge: string;         // Default: "Platform Setor Gmail Terpercaya 2026"
  badge_status_text: string;      // Default: "Platform sedang dalam tahap pengembangan"
  badge_status_active: boolean;   // Default: true
  marquee_text: string;           // Default: "PROSES CEPAT • AMAN TERPERCAYA • PENCAIRAN INSTAN • SETOR SEKARANG •"

  // 4. Kontak & Komunitas
  whatsapp_channel_url: string;   // Default: "https://whatsapp.com/channel/0029VbEImqX7j6gFzKU9Qy1Y"
  telegram_admin_username: string;// Default: "winterhere"

  // 5. Fitur & Maintenance (Feature Flags)
  is_setor_active: boolean;       // Default: true
  is_checker_active: boolean;     // Default: true
  is_withdrawal_active: boolean;  // Default: true
  is_maintenance_mode: boolean;   // Default: false
  maintenance_message: string;    // Default: "Platform sedang dalam pemeliharaan berkala..."
}

export const DEFAULT_CONFIG: SiteConfig = {
  price_per_gmail: 4500,
  price_bebas: 2500,
  min_withdrawal: 5000,
  tax_gopay: 1000,
  tax_ovo: 1000,
  tax_dana: 0,
  tax_shopeepay: 0,

  default_password: "winter1212",
  rule_status: "Wajib Fresh (baru dibuat)",
  rule_nama: "Wajib sama persis hasil generate",
  rule_usia: "Lahir 18+ tahun",
  rule_keamanan: "Tanpa No HP / Email Pemulihan",
  rules_detail_text: [
    "Wajib Fresh: Akun harus baru dibuat secara manual dan belum pernah didaftarkan ke platform/jasa lain.",
    "Nama Akun Sama Persis: Karakter, angka, dan huruf pada Gmail wajib 100% sama dengan hasil yang di-generate di situs ini. Dilarang mengubah atau menambah karakter apa pun.",
    "Usia 18+ Tahun: Atur tanggal dan tahun kelahiran akun Gmail di Google agar umur akun minimal 18 tahun (contoh: tahun 2000–2005).",
    "Tanpa Pemulihan: Akun dilarang menautkan nomor HP pemulihan atau email pemulihan agar peninjauan oleh admin lancar tanpa kendala OTP.",
  ],

  hero_headline_1: "Ubah Akun",
  hero_headline_2: "Gmail Jadi",
  hero_headline_3: "Penghasilan",
  hero_subheadline:
    "Buat akun Gmail dan dapatkan saldo. Pencairan instan via E-wallet dan Bank.",
  platform_badge: "Platform Setor Gmail Terpercaya 2026",
  badge_status_text: "Platform sedang dalam tahap pengembangan",
  badge_status_active: true,
  marquee_text:
    "PROSES CEPAT • AMAN TERPERCAYA • PENCAIRAN INSTAN • SETOR SEKARANG •",

  whatsapp_channel_url:
    "https://whatsapp.com/channel/0029VbEImqX7j6gFzKU9Qy1Y",
  telegram_admin_username: "winterhere",

  is_setor_active: true,
  is_checker_active: true,
  is_withdrawal_active: true,
  is_maintenance_mode: false,
  maintenance_message:
    "Platform sedang dalam pemeliharaan berkala untuk peningkatan sistem. Mohon kembali beberapa saat lagi.",
};

