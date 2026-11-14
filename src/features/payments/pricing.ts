/**
 * Public Pricing Models, Feature Comparison, and FAQs for Patemon MVP v1
 * Aligned with PRD Section 5.4: One-time checkout for one wedding workspace access.
 */

import type { PricingTier, FaqItem } from "./types";

export const MVP_WEDDING_PRICE_IDR = 199_000;
export const MVP_WEDDING_ORIGINAL_PRICE_IDR = 249_000;

export const PRICING_TIERS: PricingTier[] = [
  {
    id: "preview",
    name: "Mode Free Preview",
    tagline: "Uji coba dan jelajahi seluruh fitur perencanaan tanpa biaya",
    price: 0,
    priceLabel: "Gratis",
    periodLabel: "selamanya untuk eksplorasi",
    badge: "Uji Coba",
    popular: false,
    ctaLabel: "Jelajahi Demo Workspace",
    ctaHref: "/workspace/demo",
    features: [
      { text: "Eksplorasi penuh workspace demo interaktif", included: true },
      {
        text: "Katalog kurasi 30+ sarana upakara & banten Bali",
        included: true,
      },
      {
        text: "Simulasi indeks kesiapan pawiwahan (Readiness)",
        included: true,
      },
      { text: "Pratinjau susunan rundown panitia hari-H", included: true },
      { text: "Ekspor CSV kontingensi lapangan (Excel UTF-8)", included: true },
      {
        text: "Penyimpanan data privat workspace Anda sendiri",
        included: false,
        note: "Data tersimpan di sesi demo saja",
      },
      {
        text: "Undang keluarga & panitia (Owner, Editor, Viewer)",
        included: false,
        note: "Memerlukan lisensi pawiwahan",
      },
      {
        text: "Kustomisasi upacara dan banten tanpa batas",
        included: false,
        note: "Memerlukan lisensi pawiwahan",
      },
    ],
  },
  {
    id: "full",
    name: "Akses Penuh Pawiwahan",
    tagline: "Satu kali bayar untuk seluruh persiapan pernikahan Hindu Bali",
    price: MVP_WEDDING_PRICE_IDR,
    originalPrice: MVP_WEDDING_ORIGINAL_PRICE_IDR,
    priceLabel: "Rp 199.000",
    periodLabel: "bayar 1x per pawiwahan · tanpa langganan",
    badge: "Promo Peluncuran MVP",
    popular: true,
    ctaLabel: "Daftar & Mulai Rencanakan",
    ctaHref: "/register",
    features: [
      { text: "1 Workspace Privat Khusus Mempelai & Keluarga", included: true },
      {
        text: "Rangkaian Upacara Kustom (Memadik, Ngerorod, Nyentana)",
        included: true,
      },
      {
        text: "Perencana Banten & Pelacakan Pengadaan (Ngayah/Serati/Beli)",
        included: true,
      },
      {
        text: "Buku Anggaran Adat & Pembagian Biaya (Purusa, Pradana, Bersama)",
        included: true,
      },
      {
        text: "Checklist Tugas Persiapan & Penugasan PIC Keluarga",
        included: true,
      },
      {
        text: "Manajemen Vendor, Kesepakatan Harga & Link WhatsApp",
        included: true,
      },
      {
        text: "Susunan Rundown Hari-H Panitia Kronologis (WITA)",
        included: true,
      },
      {
        text: "Daftar Tamu Undangan, Kelompok Banjar/Dadia & Headcount",
        included: true,
      },
      {
        text: "Ekspor CSV Lengkap & Cadangan Master JSON Offline",
        included: true,
      },
      {
        text: "Kolaborasi Tim Keluarga: Undang hingga 15 Anggota",
        included: true,
      },
      {
        text: "Akses Arsip Baca & Ekspor Tetap Aktif Selamanya",
        included: true,
      },
    ],
  },
];

export const PRICING_FAQS: FaqItem[] = [
  {
    question: "Apakah sistem pembayaran Patemon berlangganan bulanan?",
    answer:
      "Tidak. Patemon menggunakan model sekali bayar (one-time payment) untuk satu workspace pernikahan. Tidak ada biaya bulanan berulang atau perpanjangan otomatis.",
  },
  {
    question: "Berapa lama masa aktif workspace pawiwahan saya?",
    answer:
      "Akses penuh untuk mengedit, menambah data, dan mengundang anggota aktif hingga hari pernikahan Anda selesai ditambah masa tenggang 6 bulan. Setelah itu, akun tetap memiliki akses baca (read-only) dan hak ekspor CSV/JSON selamanya untuk kenangan dan arsip keluarga.",
  },
  {
    question: "Metode pembayaran apa saja yang didukung?",
    answer:
      "Melalui integrasi resmi Midtrans Snap, kami menerima pembayaran instan via QRIS (GoPay, OVO, Dana, LinkAja, ShopeePay), Transfer Virtual Account (BCA, Mandiri, BNI, BRI, Permata), dan Kartu Kredit/Debit.",
  },
  {
    question: "Bagaimana jika tanggal hari-H upacara kami diundur?",
    answer:
      "Anda dapat memperbarui tanggal upacara kapan saja melalui menu Pengaturan Pawiwahan. Akses workspace akan secara otomatis menyesuaikan dengan jadwal upacara terbaru tanpa biaya tambahan.",
  },
  {
    question: "Apakah anggota keluarga yang diundang harus membayar lagi?",
    answer:
      "Tidak perlu. Pembayaran lisensi hanya dilakukan satu kali oleh pemilik workspace. Seluruh anggota keluarga yang diundang (baik sebagai Pemilik tambahan, Editor, maupun Viewer) dapat mengakses dan berkolaborasi secara gratis.",
  },
  {
    question: "Apakah ada jaminan uang kembali jika kami membatalkan acara?",
    answer:
      "Kami menyediakan jaminan pengembalian dana 100% dalam waktu 7 hari setelah aktivasi lisensi jika Anda merasa Patemon belum sesuai dengan kebutuhan keluarga Anda, selama belum ada transaksi pembayaran vendor yang tercatat.",
  },
];
