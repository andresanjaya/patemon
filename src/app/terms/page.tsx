import type { Metadata } from "next";
import Link from "next/link";
import {
  FileText,
  ArrowLeft,
  CreditCard,
  ShieldAlert,
  RefreshCw,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Syarat & Ketentuan Layanan | Patemon",
  description:
    "Syarat dan ketentuan lisensi pernikahan, kebijakan pengembalian dana, serta etika penggunaan platform Patemon — Bali Hindu Wedding Planner.",
};

export default function TermsPage() {
  return (
    <div className="bg-background min-h-screen">
      <main className="container mx-auto max-w-4xl px-4 py-12 sm:px-6 sm:py-16">
        <div className="mb-8">
          <Link href="/">
            <Button variant="ghost" size="sm" className="gap-2 text-xs">
              <ArrowLeft className="h-4 w-4" />
              Kembali ke Beranda
            </Button>
          </Link>
        </div>

        {/* Header Section */}
        <div className="mb-10 space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="bg-primary/10 text-primary flex h-10 w-10 items-center justify-center rounded-xl">
              <FileText className="h-5 w-5" />
            </div>
            <span className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
              Perjanjian Pengguna & Lisensi
            </span>
          </div>
          <h1 className="text-foreground font-serif text-3xl font-bold sm:text-4xl">
            Syarat & Ketentuan Penggunaan (Terms of Service)
          </h1>
          <p className="text-muted-foreground text-sm leading-relaxed sm:text-base">
            Berlaku efektif sejak: 14 November 2026. Harap membaca ketentuan ini
            secara saksama sebelum menggunakan platform Patemon.
          </p>
        </div>

        {/* Content Body */}
        <div className="prose prose-zinc dark:prose-invert max-w-none space-y-8 text-sm leading-relaxed sm:text-base">
          {/* Section 1 */}
          <section className="border-border/60 bg-card rounded-2xl border p-6 sm:p-8">
            <h2 className="text-foreground flex items-center gap-2 text-lg font-bold sm:text-xl">
              <CreditCard className="text-primary h-5 w-5" />
              1. Model Lisensi & Pembayaran (Per-Wedding License)
            </h2>
            <p className="text-muted-foreground mt-3">
              Patemon menggunakan model biaya transparan berbasis per-pernikahan
              (*per-wedding license*):
            </p>
            <ul className="text-muted-foreground mt-3 list-disc space-y-2 pl-5">
              <li>
                <strong>Biaya Tunggal Rp 199.000:</strong> Pembayaran satu kali
                di awal memberikan akses penuh untuk 1 ruang kerja pernikahan,
                kolaborasi hingga 15 anggota keluarga, dan masa aktif
                perencanaan selama 18 bulan atau hingga hari upacara selesai.
              </li>
              <li>
                <strong>Bukan Langganan Berulang:</strong> Tidak ada tagihan
                bulanan otomatis (*no recurring subscription*), tidak ada biaya
                tersembunyi, dan tidak ada auto-debit diam-diam.
              </li>
              <li>
                <strong>Mode Arsip Gratis Selamanya:</strong> Setelah masa
                perencanaan berakhir, ruang kerja beralih otomatis ke Arsip
                Permanen Baca-Saja tanpa biaya tambahan apa pun.
              </li>
            </ul>
          </section>

          {/* Section 2 */}
          <section className="border-border/60 bg-card rounded-2xl border p-6 sm:p-8">
            <h2 className="text-foreground flex items-center gap-2 text-lg font-bold sm:text-xl">
              <RefreshCw className="text-primary h-5 w-5" />
              2. Kebijakan Pengembalian Dana (14-Day Refund Guarantee)
            </h2>
            <p className="text-muted-foreground mt-3">
              Kami menghargai ketenangan pikiran Anda saat mempersiapkan hari
              suci:
            </p>
            <ul className="text-muted-foreground mt-3 list-disc space-y-2 pl-5">
              <li>
                Jika Anda mengalami kendala teknis yang tidak dapat diselesaikan
                oleh tim dukungan kami, Anda berhak mengajukan pengembalian dana
                penuh dalam waktu <strong>14 hari kerja</strong> sejak
                transaksi.
              </li>
              <li>
                Pengajuan refund dapat dilakukan secara langsung melalui tombol{" "}
                <strong>Bantuan & Layanan Pelanggan</strong> di dalam aplikasi
                atau menghubungi WhatsApp resmi layanan pelanggan kami.
              </li>
              <li>
                Sesuai prinsip kedaulatan data, jika lisensi ditarik
                (*revoked*), Anda tetap berhak mengunduh seluruh data yang
                pernah dimasukkan dalam format CSV atau JSON.
              </li>
            </ul>
          </section>

          {/* Section 3 */}
          <section className="border-border/60 bg-card rounded-2xl border p-6 sm:p-8">
            <h2 className="text-foreground flex items-center gap-2 text-lg font-bold sm:text-xl">
              <ShieldAlert className="text-primary h-5 w-5" />
              3. Batasan Tanggung Jawab & Prinsip Dresta
            </h2>
            <p className="text-muted-foreground mt-3">
              Patemon berperan sebagai asisten pengorganisasian digital
              terstruktur. Platform ini tidak menggantikan dan tidak berniat
              menggantikan kewenangan Ida Sulinggih, Jero Mangku, Prajuru Desa
              Adat, atau tetua keluarga Anda.
            </p>
            <p className="text-muted-foreground mt-2">
              Segala rekomendasi sarana upacara, nama banten, dan urutan prosesi
              merupakan kompilasi dari pustaka adat terpercaya yang bersifat
              fleksibel terhadap prinsip <em>Desa Mawacara</em> dan{" "}
              <em>Desa, Kala, Patra</em> di wilayah masing-masing.
            </p>
          </section>

          {/* Section 4 */}
          <section className="border-border/60 bg-card rounded-2xl border p-6 sm:p-8">
            <h2 className="text-foreground flex items-center gap-2 text-lg font-bold sm:text-xl">
              <Users className="text-primary h-5 w-5" />
              4. Etika Kolaborasi Keluarga
            </h2>
            <p className="text-muted-foreground mt-3">
              Pemilik ruang kerja bertanggung jawab atas pengelolaan anggota
              yang diundang. Anggota dengan peran <em>Editor</em> memiliki
              wewenang memperbarui status checklist dan banten, sedangkan peran{" "}
              <em>Viewer</em> hanya dapat membaca catatan. Harap menjaga
              kerahasiaan tautan undangan dan kode akses Anda.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
