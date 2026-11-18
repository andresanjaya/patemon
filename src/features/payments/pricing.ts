/**
 * Public Pricing Models, Feature Comparison, and Manual Payment Details for Patemon
 * Aligned with manual BCA & QRIS payment confirmation workflow verified by Master Admin.
 */

import type { PricingTier, FaqItem } from "./types";

export const MVP_WEDDING_PRICE_IDR = 199_000;
export const MVP_WEDDING_ORIGINAL_PRICE_IDR = 249_000;

export const PAYMENT_CONFIG = {
  price: MVP_WEDDING_PRICE_IDR,
  originalPrice: MVP_WEDDING_ORIGINAL_PRICE_IDR,
  bcaAccount: process.env.NEXT_PUBLIC_PAYMENT_BCA_ACCOUNT || "0402838121",
  bcaHolder: process.env.NEXT_PUBLIC_PAYMENT_BCA_HOLDER || "Andre Sanjaya",
  adminWhatsApp:
    process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP_PHONE || "6281234567890",
  bca: {
    bankName: "BCA",
    accountNumber: process.env.NEXT_PUBLIC_PAYMENT_BCA_ACCOUNT || "0402838121",
    accountHolder: process.env.NEXT_PUBLIC_PAYMENT_BCA_HOLDER || "Andre Sanjaya",
  },
};

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
    badge: "Akses Lengkap",
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
      "Tidak. Patemon menggunakan model sekali bayar (one-time payment) sebesar Rp 199.000 untuk satu workspace pernikahan. Tidak ada biaya bulanan berulang atau perpanjangan otomatis.",
  },
  {
    question: "Berapa lama masa aktif workspace pawiwahan saya?",
    answer:
      "Akses penuh untuk mengedit, menambah data, dan mengundang anggota aktif selama 365 hari (1 tahun penuh) hingga seluruh prosesi upacara dan resepsi selesai. Setelah itu, akun tetap memiliki akses baca (read-only) dan hak ekspor data selamanya untuk kenangan keluarga.",
  },
  {
    question: "Metode pembayaran apa saja yang didukung?",
    answer:
      "Kami menerima pembayaran langsung melalui Transfer Bank BCA dan QRIS (GoPay, OVO, Dana, LinkAja, ShopeePay, BCA, Mandiri, BRI). Cukup kirimkan bukti pembayaran ke WhatsApp resmi Master Admin kami untuk verifikasi dan aktivasi instan.",
  },
  {
    question: "Bagaimana proses aktivasi akun setelah pembayaran?",
    answer:
      "Setelah Anda melakukan transfer via BCA atau scan QRIS, klik tombol 'Konfirmasi Pembayaran via WhatsApp'. Master Admin Patemon akan langsung memverifikasi transaksi dan mengaktifkan akses penuh ruang kerja Anda dalam hitungan menit.",
  },
  {
    question: "Apakah anggota keluarga yang diundang harus membayar lagi?",
    answer:
      "Tidak perlu. Pembayaran lisensi hanya dilakukan satu kali oleh pemilik workspace. Seluruh anggota keluarga yang diundang (baik sebagai Pemilik tambahan, Editor, maupun Viewer) dapat mengakses dan berkolaborasi secara gratis hingga 15 akun.",
  },
  {
    question: "Bagaimana jika tanggal pernikahan kami diundur atau ditunda?",
    answer:
      "Lisensi Patemon berlaku selama 365 hari penuh sejak aktivasi. Jika tanggal upacara adat atau resepsi (Dewasa Ayu) bergeser, Anda bebas mengubah tanggal di pengaturan workspace tanpa biaya tambahan.",
  },
  {
    question: "Apakah ada jaminan uang kembali jika kami membatalkan acara?",
    answer:
      "Kami menyediakan jaminan pengembalian dana 100% dalam waktu 7 hari setelah aktivasi lisensi jika Anda merasa Patemon belum sesuai dengan kebutuhan keluarga Anda, selama belum ada transaksi pembayaran vendor yang tercatat.",
  },
];
