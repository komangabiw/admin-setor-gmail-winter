# Setor Gmail - Admin Dashboard (admin.setorgmail.com)

Dashboard resmi Administrator untuk platform **Setor Gmail** yang terhubung langsung ke database Supabase dan otentikasi yang sama dengan aplikasi utama Setor Gmail.

---

## 🚀 Fitur Lengkap

### 1. Sistem Autentikasi & Admin Guard
- **Halaman Login Khusus (`/login`)**: Mendukung login dengan Google OAuth dan Email & Password admin.
- **Admin Guard & Middleware Layout**: Memvalidasi hak akses admin berdasarkan kolom `role: 'Admin'` di tabel `profiles` Supabase dan daftar whitelist email administrator. Pengguna non-admin secara otomatis dicegah dengan pesan peringatan keamanan dan opsi keluar akun.

### 2. Dashboard Overview (`/`)
- Ringkasan live metric:
  - **Total Pengguna Terdaftar**
  - **Total Saldo Beredar & Akumulasi Penarikan**
  - **Status Penarikan Saldo Pending**
  - **Tiket Bantuan & Laporan Telegram Aktif**
- Tabel cuplikan tiket bantuan terbaru, transaksi mutasi terbaru, dan pengguna baru bergabung.
- Quick action button untuk input saldo cepat ke pengguna sasaran.

### 3. Manajemen Pengguna (`/users`)
- Tabel data pengguna lengkap dengan Avatar, Nama, Email, Role, Nomor DANA, Saldo Dompet, dan Tanggal Bergabung.
- **Edit Saldo Manual**: Modal untuk menambah (+), memotong (-), atau menetapkan (=) saldo pengguna secara langsung. Mutasi saldo otomatis tercatat di tabel `transactions`.
- **Ubah Role**: Beralih antara hak akses `Admin` dan `User`.
- **Blokir / Buka Blokir**: Menangguhkan akses akun pengguna.
- **Hapus Akun**: Penghapusan akun permanen dari Supabase Auth dan tabel relasional.

### 4. Manajemen Transaksi & Saldo (`/transactions`)
- Riwayat transaksi gabungan: Penarikan Saldo (`withdrawals`), Setoran (`deposits`), dan Mutasi Saldo (`transactions`).
- Filter status: Pending, Selesai (Success), dan Gagal/Ditolak (Failed).
- **Verifikasi Penarikan**: Admin dapat menyetujui transaksi atau menolak penarikan (dengan fitur otomatis refund saldo ke dompet pengguna jika ditolak).
- **Input Transaksi Manual**: Admin dapat memberikan saldo/deposit langsung ke pengguna manapun.

### 5. Pusat Tiket Bantuan & Telegram (`/tickets`)
- Integrasi tiket bantuan pengguna dari web dan laporan kendala yang masuk dari Bot Telegram.
- Filter status: Baru (Open), Sedang Diproses (In Progress), Selesai (Resolved), dan Ditolak (Closed).
- **Detail Tiket & Lampiran**: Melihat keluhan lengkap, nomor DANA pengirim, dan file lampiran bukti screenshot.
- **Fitur Balas Tiket & Telegram Forwarding**: Admin dapat menulis tanggapan balasan yang otomatis tersimpan di riwayat tiket (`ticket_replies`) dan secara real-time mengirimkan pesan balasan ke Bot Telegram via Telegram Bot API.

---

## 🛠️ Konfigurasi Environment (`.env.local` & `.dev.vars`)

```bash
NEXT_PUBLIC_SUPABASE_URL=https://kdjoeeehyahdgwgsfyal.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_...
SUPABASE_SERVICE_ROLE_KEY=sb_secret_...

# Integrasi Telegram Bot
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
TELEGRAM_CHAT_ID=your_telegram_chat_id

# Admin Email Whitelist
ADMIN_EMAILS=komangabi26@gmail.com,komangdev7@gmail.com
```

---

## 💻 Menjalankan Secara Lokal

```bash
# Jalankan dev server Next.js
npm run dev

# Jalankan build produksi
npm run build

# Preview di environment Cloudflare Worker
npm run preview

# Deploy ke Cloudflare Workers
npm run deploy
```
