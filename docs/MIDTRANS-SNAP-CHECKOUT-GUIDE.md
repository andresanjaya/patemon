# Panduan Integrasi Midtrans Snap Checkout & Persistensi Pesanan (Issue #36)

Dokumen ini menjelaskan implementasi teknis dan alur keamanan integrasi gateway pembayaran Midtrans Snap serta persistensi pesanan (*order persistence*) di Patemon: Bali Hindu Wedding Planner (sesuai PRD Section 5.4, 7.1, dan 10).

---

## 1. Arsitektur & Prinsip Keamanan (Security Guarantees)

1. **Harga Terkunci di Sisi Server (*Server-Enforced Price*):**
   - Harga lisensi pawiwahan **selalu** diambil langsung dari konstanta server `MVP_WEDDING_PRICE_IDR = 199.000` (`src/features/payments/pricing.ts`).
   - Nilai harga atau *gross_amount* **tidak pernah** diterima dari parameter *client-side* untuk mencegah manipulasi harga (*tampering attack*).
2. **Kerahasiaan Server Key (*Zero Client Exposure*):**
   - Kunci privat `MIDTRANS_SERVER_KEY` dilindungi oleh penanda `import "server-only"` dan tidak pernah dikirimkan atau dikompilasi ke bundel JavaScript client browser.
   - Client hanya menerima token publik sementara (`snap_token`) dan `NEXT_PUBLIC_MIDTRANS_CLIENT_KEY`.
3. **Idempotensi & Pencegahan Duplikasi Transaksi (*Idempotency & Retry Window*):**
   - Jika pengguna membuka dialog checkout kembali saat sudah memiliki transaksi berstatus `pending` dalam rentang waktu **45 menit**, sistem secara otomatis menggunakan kembali (*reuses*) `snap_token` tersebut alih-alih membuat entri pesanan baru di gateway Midtrans.
4. **Pencegahan Pembelian Ganda pada Workspace yang Sudah Berlisensi:**
   - Server memverifikasi status lisensi melalui `getWorkspaceEntitlement(weddingId)`. Jika workspace sudah berlisensi aktif (`isPaid: true` dan `status === 'active'`), permintaan checkout langsung ditolak.
5. **Perlindungan Workspace Sandbox Demo:**
   - Workspace demo publik (`weddingId === "demo"`) diblokir dari checkout berbayar untuk menjaga integritas demo publik.

---

## 2. Alur Transaksi & Persistensi Database

```
+-----------------------------------------------------------------------------------+
| 1. Pengguna klik "Aktivasi Sekarang" di UpgradePromptModal / LicenseStatusCard    |
+-----------------------------------------+-----------------------------------------+
                                          |
                                          v
+-----------------------------------------------------------------------------------+
| 2. Server Action: createCheckoutOrderAction(weddingId)                           |
|    - Autentikasi sesi & verifikasi hak akses anggota workspace (Owner / Editor)   |
|    - Pengecekan entitlement aktif (mencegah double charge)                        |
|    - Pengecekan order pending yang masih valid (< 45 menit)                      |
|    - Panggil Midtrans Snap API (https://app.sandbox.midtrans.com/snap/v1/...)     |
|    - Simpan order baru ke tabel checkout_orders (status: pending, amount: 199000) |
|    - Catat jejak audit di tabel activity_logs (entity_type: checkout_order)       |
+-----------------------------------------+-----------------------------------------+
                                          |
                                          v
+-----------------------------------------------------------------------------------+
| 3. Client Component: UpgradePromptModal                                           |
|    - Memuat pustaka snap.js secara asinkron dengan client-key                     |
|    - Menjalankan window.snap.pay(snapToken, { onSuccess, onPending, onError, onClose }) |
|    - Menyediakan tombol fallback manual jika popup blocker aktif                  |
+-----------------------------------------------------------------------------------+
```

---

## 3. Skema Data Terkait

### Tabel `checkout_orders`
| Kolom | Tipe | Keterangan |
| :--- | :--- | :--- |
| `id` | UUID | Primary key pesanan |
| `wedding_id` | UUID | Foreign key ke workspace pawiwahan |
| `user_id` | UUID | Akun pemesan / pembeli |
| `order_number` | TEXT | Format: `PATEMON-<SHORT_ID>-<TIMESTAMP>-<RANDOM>` |
| `amount` | BIGINT | Nominal integer IDR (Rp 199.000) |
| `status` | ENUM | `'pending'`, `'settlement'`, `'expire'`, `'cancel'`, `'deny'` |
| `snap_token` | TEXT | Token unik transaksi dari Midtrans Snap |
| `snap_redirect_url` | TEXT | URL pembayaran langsung untuk fallback |
| `payment_type` | TEXT | QRIS, bank_transfer, gopay, cstore, credit_card, dll. |
| `created_at` / `updated_at` | TIMESTAMPTZ | Waktu pembuatan & pembaruan status |

---

## 4. Komponen Antarmuka Pengguna (UI)

1. **`UpgradePromptModal` (`src/features/payments/components/upgrade-prompt-modal.tsx`):**
   - Modal interaktif yang menampilkan rincian harga promo Rp 199.000, 9 keunggulan fitur yang terbuka, logo metode bayar Midtrans (QRIS, GoPay, VA, dsb.).
   - Menjalankan checkout Snap modal langsung di browser.
   - Menangani callback status: *Success* (redirect ke settings), *Pending* (banner instruksi pembayaran), *Error* (pesan kesalahan), dan *Close* (penutupan aman).
2. **`LicenseStatusCard` (`src/features/payments/components/license-status-card.tsx`):**
   - Menampilkan kartu status lisensi di halaman pengaturan workspace (`/workspace/[weddingId]/settings`).
   - Menyertakan **Banner Pesanan Pending** dengan opsi:
     - Lanjutkan Pembayaran (buka kembali Snap modal)
     - Buka Midtrans Snap di tab baru (fallback tautan langsung)
     - Batalkan Pesanan (via `cancelPendingOrderAction`)
   - Menyertakan **Tabel Riwayat Transaksi & Pembayaran Midtrans** lengkap dengan badge status (`Berhasil`, `Menunggu`, `Dibatalkan`, `Kedaluwarsa`).

---

## 5. Variabel Lingkungan (*Environment Variables*)

```env
# Client-side (Public)
NEXT_PUBLIC_MIDTRANS_CLIENT_KEY="SB-Mid-client-your-client-key"

# Server-side (Private - Jangan pernah bocorkan ke browser)
MIDTRANS_SERVER_KEY="SB-Mid-server-your-server-key"
MIDTRANS_IS_PRODUCTION="false"
MIDTRANS_SNAP_URL="https://app.sandbox.midtrans.com/snap/snap.js"
```

*Catatan: Pada lingkungan testing dan simulasi lokal tanpa kredensial Midtrans langsung, sistem secara otomatis beralih ke mock-mode deterministik tanpa kegagalan.*
