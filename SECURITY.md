# Security Policy

Setor Gmail Admin Dashboard (`admin-setor-gmail`) mengadopsi standar keamanan ketat berbasis **OWASP Top 10**, **Zero-Trust Architecture**, dan perlindungan Edge dari **Cloudflare**.

---

## 1. Versi yang Didukung

| Versi | Didukung Keamanan |
| :--- | :--- |
| `0.1.x` (Main / Production) | :white_check_mark: Ya |
| Versi Lama | :x: Tidak |

---

## 2. Arsitektur Pertahanan Berlapis (Defense-in-Depth)

1. **A01: Broken Access Control**:
   - Seluruh endpoint API administratif (`/api/admin/*`) diverifikasi secara kriptografis di server via token Supabase Auth JWT.
   - Hak akses admin divalidasi terhadap daftar email terverifikasi (`ADMIN_EMAILS`) dan tabel role Supabase.
   - Cross-Site Request Forgery (CSRF) dicegah dengan validasi header `Origin`, `Referer`, dan `X-Requested-With`.

2. **A02: Cryptographic Failures**:
   - HTTP Strict Transport Security (HSTS) aktif dengan `max-age=63072000; includeSubDomains; preload`.
   - Token ditransmisikan hanya melalui HTTPS dan session cookie `Secure`, `SameSite=Lax`.

3. **A03: Injection**:
   - Input disanitasi terhadap skrip XSS, entitas HTML berbahaya, dan karakter kontrol.
   - Seluruh query database di-parameterisasi via Supabase ORM.

4. **A04: Insecure Design & Anti-Brute Force**:
   - Rate limiting bertingkat pada Edge/Server:
     - Auth Check: 20 req / menit / IP.
     - Mutasi Data (PATCH/POST/DELETE): 40 req / menit / IP.
     - Read Endpoints: 120 req / menit / IP.
   - Peringatan instan dikirim via Telegram jika terdeteksi anomali.

5. **A05: Security Misconfiguration**:
   - Header keamanan lengkap: `Content-Security-Policy`, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `X-XSS-Protection`, `Permissions-Policy`.
   - `poweredByHeader: false` untuk menyembunyikan identitas framework.
   - Header edge diaktifkan pada Cloudflare Pages/Workers via `public/_headers`.

6. **A06: Vulnerable and Outdated Components**:
   - GitHub Dependabot memindai kerentanan dependensi secara otomatis setiap minggu.
   - CI build melakukan `npm audit` sebelum penggabungan kode.

7. **A07: Identification and Authentication Failures**:
   - Pemanggilan API tanpa token JWT yang sah langsung ditolak (401 Unauthorized). Tidak ada fallback body spoofing.

8. **A08: Software and Data Integrity Failures**:
   - GitHub CodeQL Advanced Security memindai kerentanan semantik pada setiap Pull Request dan Push ke branch `main`.
   - Gitleaks Secret Scanning mencegah kebocoran API Key dan kredensial privat.

9. **A09: Security Logging and Monitoring**:
   - Audit trail mencatat mutasi saldo, blokir akun, penghapusan data, dan perubahan CMS.
   - Notifikasi keamanan real-time dikirim langsung ke Telegram Admin.

10. **A10: Server-Side Request Forgery (SSRF)**:
    - Seluruh URL eksternal (misal: WhatsApp Channel, avatar) divalidasi ketat: wajib berprotokol `https:` dan menolak seluruh IP privat/lokal (127.0.0.1, 10.0.0.0/8, 192.168.0.0/16, AWS/GCP metadata 169.254.169.254).

---

## 3. Pelaporan Kerentanan (Vulnerability Reporting)

Jika Anda menemukan celah keamanan, **JANGAN** membuat isu publik di GitHub.
Laporkan secara bertanggung jawab ke:
- **Email:** `security@setorgmail.com` / `komangabiw@gmail.com`
- **Telegram:** `@winterhere`

Setiap laporan yang valid akan ditinjau dan ditindaklanjuti dalam waktu maksimal 24 jam.

