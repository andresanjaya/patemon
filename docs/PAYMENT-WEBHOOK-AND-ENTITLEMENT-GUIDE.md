# Panduan Midtrans Payment Webhook & Siklus Hidup Lisensi (Issue #37)

Dokumen ini menjelaskan implementasi teknis dan alur keamanan verifikasi webhook Midtrans serta siklus hidup lisensi (*entitlement lifecycle*) di Patemon: Bali Hindu Wedding Planner (sesuai PRD Section 5.4, 7.1, dan 10).

---

## 1. Prinsip Keamanan & Desain Webhook

1. **Verifikasi Tanda Tangan SHA-512 Kriptografis (*Cryptographic Signature Verification*):**
   - Setiap webhook notifikasi yang masuk ke endpoint `/api/payments/webhook` divalidasi keasliannya menggunakan SHA-512 dengan rumus resmi Midtrans:
     $$\text{Signature} = \text{SHA512}(\text{order\_id} + \text{status\_code} + \text{gross\_amount} + \text{ServerKey})$$
   - Menggunakan perbandingan waktu-konstan (`crypto.timingSafeEqual`) untuk mencegah serangan *timing attack*.
   - Notifikasi dengan tanda tangan tidak cocok langsung ditolak dengan status HTTP 401 Unauthorized tanpa memodifikasi data apapun.
2. **Idempotensi & Penanganan Notifikasi Duplikat (*Idempotent Entitlement Lifecycle*):**
   - Midtrans dapat mengirimkan webhook berulang kali (akibat *network retry* atau konfirmasi bertahap).
   - Jika pesanan telah berstatus `settlement` dan menerima notifikasi penyelesaian kembali, sistem mencatat riwayat event ke `payment_events`, mengonfirmasi HTTP 200 OK secara elegan, dan **tidak menduplikasi** pembuatan lisensi di `access_grants`.
3. **Penyimpanan Audit Kejadian Mentah (*Audit Trail in `payment_events` & `activity_logs`*):**
   - Setiap payload webhook dicatat lengkap di tabel `payment_events` (`is_verified: true`, `provider_status`, `signature_key`, dan `payload` mentah).
   - Aktivasi lisensi dan pencabutan hak akses dicatat di tabel `activity_logs` untuk audit kepatuhan.
4. **Pencabutan Otomatis pada Pengembalian Dana (*Refund & Chargeback Handling*):**
   - Jika transaksi berstatus `refund`, `partial_refund`, atau `chargeback`, lisensi di `access_grants` langsung diubah menjadi `revoked` (`revoked_at = now()`), dan status pesanan diperbarui menjadi `cancel`.
5. **Rekonsiliasi Manual (*On-Demand Order Reconciliation*):**
   - Pengguna atau sistem dapat memicu sinkronisasi status via `reconcileOrderStatusAction` (tombol "Cek Status Pembayaran" di `LicenseStatusCard`), yang langsung meminta status terkini dari API Midtrans Core `/v2/{order_id}/status`.

---

## 2. Pemetaan Status Transaksi Midtrans ke Status Patemon

| Status Midtrans (`transaction_status`) | `fraud_status` | Status Pesanan (`checkout_orders`) | Tindakan pada Lisensi (`access_grants`) |
| :--- | :--- | :--- | :--- |
| `settlement` | Apapun | `settlement` | ✅ **Aktifkan Lisensi** (`status = 'active'`, masa aktif 365 hari) |
| `capture` | `accept` | `settlement` | ✅ **Aktifkan Lisensi** (`status = 'active'`, masa aktif 365 hari) |
| `capture` | `challenge` | `pending` | ⏳ Menunggu verifikasi fraud |
| `pending` | Apapun | `pending` | ⏳ Menunggu pembayaran pengguna |
| `expire` | Apapun | `expire` | ❌ Pesanan kedaluwarsa |
| `cancel` | Apapun | `cancel` | ❌ Pesanan dibatalkan |
| `deny` | Apapun | `deny` | ❌ Transaksi ditolak |
| `refund` / `chargeback` | Apapun | `cancel` | ⚠️ **Cabut Lisensi** (`status = 'revoked'`, `revoked_at` diisi) |

---

## 3. Titik Akhir Webhook (*Webhook Endpoint*)

- **URL:** `https://your-domain.com/api/payments/webhook`
- **Method:** `POST`
- **Headers:** `Content-Type: application/json`
- **Format Respons:**
  ```json
  {
    "success": true,
    "status": "processed",
    "message": "Webhook diproses."
  }
  ```

---

## 4. Konfigurasi Lingkungan di Dashboard Midtrans

Pada akun Midtrans Dashboard (Sandbox & Production):
1. Masuk ke **Settings > Configuration**.
2. Masukkan **Payment Notification URL**: `https://<domain>/api/payments/webhook`.
3. Pastikan **Finish Redirect URL** diset ke: `https://<domain>/workspace/{weddingId}/settings?payment=finish`.
