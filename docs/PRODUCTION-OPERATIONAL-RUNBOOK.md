# Panduan Operasional & Runbook Produksi (Production Operational Runbook)

Dokumen ini merupakan panduan resmi standar operasional prosedur (SOP), konfigurasi infrastruktur produksi, manajemen domain dan HTTPS, pencadangan dan pemulihan basis data (*backup & disaster recovery*), serta buku petunjuk tanggap insiden (*incident response playbook*) untuk platform **Patemon — Bali Hindu Wedding Planner** ([Issue #44](https://github.com/andresanjaya/patemon/issues/44)).

---

## 1. Arsitektur Produksi & Perjanjian Tingkat Layanan (SLA)

Sistem Patemon dirancang dengan prinsip keandalan tinggi (*high availability*), isolasi tenant ketat, dan nol downtime:

| Komponen Infrastruktur | Penyedia / Layanan | Spesifikasi / Konfigurasi Produksi |
| :--- | :--- | :--- |
| **Frontend & API Routes** | Vercel Edge Network | Next.js 16 (Turbopack, Server Components, Route Handlers) |
| **Database Relasional** | Supabase Enterprise Postgres | PostgreSQL v15+ dengan Connection Pooler (Supavisor) |
| **Otentikasi & Sesi** | Supabase Auth (GoTrue) | Email/Password, Google OAuth 2.0, Secure HTTP-Only Cookies |
| **Gerbang Pembayaran** | Midtrans Production | Snap API, Webhook Idempotent, SHA-512 Signature Defense |
| **Uptime Monitoring** | Endpoint `/api/health` | Pengecekan sintetik berkala (setiap 60 detik) |
| **Penyimpanan Berkas** | Supabase Storage | Bucket privat kuitansi dan media pendukung |

### Target Tingkat Layanan (Service Level Objectives):
- **Target Ketersediaan Sistem (Uptime):** 99.9%
- **Recovery Time Objective (RTO):** &lt; 15 menit (Waktu pemulihan maksimum setelah insiden kritis)
- **Recovery Point Objective (RPO):** &lt; 1 jam (Batas toleransi kehilangan data transaksional)

---

## 2. Manajemen Domain, DNS & Sertifikat SSL/TLS

### 2.1 Konfigurasi Rekor DNS Produksi
Untuk mengarahkan domain kustom resmi (`patemon.com` / `patemon.id`) ke Vercel:

| Tipe Rekor | Nama / Host | Nilai Sasaran (Target) | TTL | Keterangan |
| :--- | :--- | :--- | :--- | :--- |
| **A** | `@` (apex) | `76.76.21.21` | Auto / 300 | Vercel Edge Anycast IP |
| **CNAME** | `www` | `cname.vercel-dns.com` | Auto / 300 | Canonical alias |
| **TXT** | `@` | `v=spf1 include:_spf.google.com ~all` | 3600 | SPF Anti-Spoofing Email |
| **TXT** | `_dmarc` | `v=DMARC1; p=quarantine;` | 3600 | Kebijakan DMARC |

### 2.2 Pengelolaan HTTPS & Enkripsi
- **Sertifikat SSL/TLS:** Diterbitkan secara otomatis oleh Let's Encrypt melalui Vercel Edge dengan perpanjangan otomatis (*auto-renewal*) setiap 90 hari.
- **Enkripsi Transit:** Seluruh koneksi HTTP dipaksa mengalihkan (*redirect*) ke HTTPS dengan *HTTP Strict Transport Security* (HSTS `max-age=63072000; includeSubDomains; preload`).
- **Enkripsi At-Rest:** Seluruh basis data Supabase dienkripsi menggunakan AES-256 pada tingkat volume penyimpanan (*storage volume encryption*).

---

## 3. Strategi Pencadangan & Pemulihan Bencana (Backup & Disaster Recovery)

### 3.1 Otomatisasi Pencadangan Supabase
1. **Automated Daily Snapshot:** Dilakukan otomatis setiap hari pada pukul 02:00 WITA (UTC+8) dengan retensi 30 hari.
2. **Point-In-Time Recovery (PITR):** Menggunakan *Write-Ahead Logging* (WAL) yang memungkinkan pemulihan ke detik tertentu (*granular recovery*) jika terjadi kerusakan atau kekeliruan data.

### 3.2 Prosedur Pencadangan Logikal Mandiri (Manual Offsite Backup)
Jalankan pencadangan skema dan data mingguan menggunakan perintah `pg_dump`:
```bash
# Export skema dan seluruh tabel publik dengan format kompresi biner
pg_dump -h db.<PROJECT_ID>.supabase.co -U postgres -d postgres -F c -b -v -f patemon_backup_$(date +%Y%m%d).dump
```

### 3.3 Prosedur Pemulihan Basis Data Darurat (Emergency Restore Procedure)
Jika terjadi insiden kehilangan data atau kegagalan perangkat keras:
1. Buka **Supabase Dashboard > Settings > Database > Backups**.
2. Pilih titik waktu pemulihan (*snapshot* atau timestamp PITR) sebelum insiden terjadi.
3. Klik **Restore to New Project** atau **In-Place Restore**.
4. Perbarui variabel lingkungan `NEXT_PUBLIC_SUPABASE_URL` dan `SUPABASE_SERVICE_ROLE_KEY` di Vercel jika dipulihkan ke instans baru.
5. Jalankan `pnpm test tests/security-accessibility-audit.test.ts` untuk memastikan fungsi RLS aktif sempurna.

---

## 4. Prosedur Rilis Nol-Downtime & Rollback Kilat

### 4.1 Alur Rilis Produksi (Zero-Downtime Deployment)
1. Perubahan digabungkan (*squash merged*) ke branch `main` setelah seluruh pengujian GitHub Actions lulus.
2. Vercel secara otomatis membangun aplikasi dalam lingkungan isolasi (*immutable build container*).
3. Setelah proses *static generation* 25 rute selesai dan terverifikasi sehat, Vercel mengalihkan lalu lintas jaringan secara atomik (*atomic traffic swap*).
4. Tidak ada penurunan performa atau downtime yang dirasakan pengguna selama proses perpindahan rilis.

### 4.2 Prosedur Rollback Cepat (&lt; 10 Detik)
Jika terdeteksi *regression* kritis pasca rilis:
1. Buka **Vercel Dashboard > Patemon > Deployments**.
2. Temukan build stabil terakhir yang berstatus centang hijau (*Ready*).
3. Klik tombol menu tiga titik `(...)` > pilih **Instant Rollback**.
4. Vercel akan memutar kembali routing traffic ke deployment stabil sebelumnya dalam waktu kurang dari 10 detik tanpa perlu melakukan build ulang.

---

## 5. Pemantauan Operasional & Endpoint Kesehatan (`/api/health`)

Aplikasi dilengkapi endpoint uji kesehatan aktif pada [src/app/api/health/route.ts](file:///c:/Andre/My%20Code/patemon/src/app/api/health/route.ts):

### Respons Format JSON:
```json
{
  "status": "healthy",
  "service": "patemon-wedding-planner",
  "version": "1.0.0",
  "environment": "production",
  "timestamp": "2026-11-14T22:45:00.000Z",
  "uptimeSeconds": 14205,
  "checks": {
    "application": "ok",
    "databaseConfigured": true,
    "paymentGatewayConfigured": true
  }
}
```

### Konfigurasi Probe Sintetik:
- Daftarkan URL `https://patemon.com/api/health` pada layanan monitoring (UptimeRobot, BetterStack, atau Vercel Monitoring).
- Frekuensi Probe: 60 detik.
- Ambang Batas Notifikasi (Alert Threshold): Peringatan dikirim jika terjadi kegagalan respons 2 kali berturut-turut (&gt; 120 detik).

---

## 6. Buku Petunjuk Tanggap Insiden (Incident Response Playbooks)

### 6.1 Insiden A: Lonjakan Kesalahan HTTP 500 / Database Connection Error
- **Gejala:** Alert monitoring mendeteksi kenaikan error 5xx, atau `/api/health` mengembalikan status non-200.
- **Langkah Tanggap:**
  1. Periksa dashboard Supabase: Pantau CPU, RAM, dan metrik *Connection Pool Usage*.
  2. Jika koneksi penuh (*pool exhausted*): Pastikan server actions menggunakan koneksi pooled via port `6543` (bukan koneksi langsung port `5432`).
  3. Lakukan restart ringan pada Connection Pooler di Supabase Settings > Database.
  4. Periksa log observabilitas Vercel untuk mendeteksi kueri yang mengalami *timeout* atau *slow query*.

### 6.2 Insiden B: Kegagalan Webhook Midtrans / Ketidaksesuaian Notifikasi
- **Gejala:** Pengguna melaporkan telah membayar tetapi status lisensi belum aktif.
- **Langkah Tanggap:**
  1. Buka **Midtrans Merchant Portal > Transactions**. Cari `order_id` yang dilaporkan pengguna.
  2. Periksa status pembayaran di Midtrans: Jika *settlement*, periksa kolom *Notification Status*.
  3. Jika notifikasi gagal dikirim (misalnya karena gangguan jaringan sementara), klik tombol **Resend Notification** di portal Midtrans.
  4. Webhook handler Patemon (`/api/payments/webhook`) bersifat idempoten: pengiriman ulang notifikasi tidak akan membuat lisensi ganda dan akan segera mengaktifkan status secara aman.

### 6.3 Insiden C: Rotasi Darurat Kredensial & Kunci Rahasia
- **Gejala:** Terdeteksi dugaan paparan kunci rahasia pada log publik atau pihak tidak berwenang.
- **Langkah Tanggap:**
  1. **Midtrans:** Masuk ke Midtrans Portal > Settings > Access Keys. Buat Server Key baru. Perbarui `MIDTRANS_SERVER_KEY` di Vercel Environment Variables dan simpan.
  2. **Supabase:** Masuk ke Supabase Dashboard > Settings > API. Lakukan rotasi `service_role` secret. Segera perbarui `SUPABASE_SERVICE_ROLE_KEY` di Vercel.
  3. Lakukan re-deploy produksi seketika di Vercel untuk menerapkan kredensial baru.
