import type { Metadata } from "next";
import Link from "next/link";
import {
  ShieldCheck,
  Lock,
  ArrowLeft,
  Download,
  Trash2,
  HeartHandshake,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Kebijakan Privasi & Kedaulatan Data | Patemon",
  description:
    "Komitmen privasi data pengguna dan kepatuhan terhadap UU No. 27 Tahun 2022 (UU PDP) pada platform Patemon — Bali Hindu Wedding Planner.",
};

export default function PrivacyPage() {
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
              <ShieldCheck className="h-5 w-5" />
            </div>
            <span className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
              Kedaulatan Data & UU PDP No. 27/2022
            </span>
          </div>
          <h1 className="text-foreground font-serif text-3xl font-bold sm:text-4xl">
            Kebijakan Privasi & Perlindungan Data Pribadi
          </h1>
          <p className="text-muted-foreground text-sm leading-relaxed sm:text-base">
            Terakhir diperbarui: 14 November 2026. Di Patemon, kami memandang
            data upacara suci dan keluarga Anda sebagai amanah berharga yang
            wajib dijaga kehormatan dan kerahasiaannya.
          </p>
        </div>

        {/* Content Body */}
        <div className="prose prose-zinc dark:prose-invert max-w-none space-y-8 text-sm leading-relaxed sm:text-base">
          {/* Section 1 */}
          <section className="border-border/60 bg-card rounded-2xl border p-6 sm:p-8">
            <h2 className="text-foreground flex items-center gap-2 text-lg font-bold sm:text-xl">
              <Lock className="text-primary h-5 w-5" />
              1. Prinsip Utama Pengelolaan Data
            </h2>
            <p className="text-muted-foreground mt-3">
              Patemon dikembangkan berlandaskan etika budaya Bali dan hukum
              Indonesia. Kami tidak pernah dan tidak akan pernah menjual,
              menyewakan, atau memperdagangkan data Anda kepada pihak ketiga
              mana pun untuk kepentingan periklanan atau pemrofilan komersial.
            </p>
            <ul className="text-muted-foreground mt-3 list-disc space-y-1.5 pl-5">
              <li>
                <strong>Data Kedaulatan Pasangan:</strong> Seluruh catatan
                banten, rincian biaya, daftar tamu banjar/dadia, dan kontak
                vendor adalah milik eksklusif pasangan mempelai dan keluarga.
              </li>
              <li>
                <strong>Isolasi Multi-Tenant Ketat:</strong> Akses data dibatasi
                melalui Row Level Security (RLS) pada basis data Postgres.
                Pengguna dari satu pernikahan tidak dapat mengakses data
                pernikahan lain.
              </li>
              <li>
                <strong>Sanitasi Log Observabilitas:</strong> Nomor kartu,
                token, dan kata sandi disaring secara otomatis sebelum tercatat
                di log sistem.
              </li>
            </ul>
          </section>

          {/* Section 2 */}
          <section className="border-border/60 bg-card rounded-2xl border p-6 sm:p-8">
            <h2 className="text-foreground flex items-center gap-2 text-lg font-bold sm:text-xl">
              <Download className="text-primary h-5 w-5" />
              2. Hak Kedaulatan & Portabilitas Data (Data Takeout)
            </h2>
            <p className="text-muted-foreground mt-3">
              Sesuai Pasal 16 UU PDP No. 27 Tahun 2022 tentang hak subjek data
              pribadi untuk memperoleh salinan data:
            </p>
            <p className="text-muted-foreground mt-2">
              Anda berhak mengunduh seluruh data perencanaan pernikahan Anda
              kapan saja dalam format terbuka:
            </p>
            <ul className="text-muted-foreground mt-2 list-disc space-y-1.5 pl-5">
              <li>
                <strong>Ekspor CSV:</strong> Untuk pembagian tugas lapangan
                kepada seksi adat, serati banten, pemuda banjar, dan penyusunan
                anggaran. Setiap berkas CSV dilindungi dari manipulasi formula
                spreadsheet dan menyertakan UTF-8 BOM untuk kompatibilitas
                aksara.
              </li>
              <li>
                <strong>Arsip Lengkap JSON:</strong> Menyimpan salinan digital
                utuh dari seluruh workspace untuk cadangan mandiri di perangkat
                Anda.
              </li>
            </ul>
          </section>

          {/* Section 3 */}
          <section className="border-border/60 bg-card rounded-2xl border p-6 sm:p-8">
            <h2 className="text-foreground flex items-center gap-2 text-lg font-bold sm:text-xl">
              <Trash2 className="text-primary h-5 w-5" />
              3. Hak Penghapusan Akun (Right to Erasure)
            </h2>
            <p className="text-muted-foreground mt-3">
              Anda memiliki hak mutlak untuk menghapus akun dan riwayat
              keanggotaan Anda di Patemon melalui menu{" "}
              <strong>Pengaturan Profil &gt; Hapus Akun</strong>.
            </p>
            <div className="bg-muted/50 border-border/80 mt-3 rounded-xl border p-4 text-xs sm:text-sm">
              <strong className="text-foreground">Proteksi Data Yatim:</strong>{" "}
              Jika Anda adalah satu-satunya Pemilik (*Sole Owner*) pada sebuah
              ruang kerja pernikahan yang masih aktif, sistem akan mewajibkan
              Anda untuk mengalihkan kepemilikan atau menghapus pernikahan
              tersebut terlebih dahulu guna mencegah data keluarga
              terkatung-katung.
            </div>
          </section>

          {/* Section 4 */}
          <section className="border-border/60 bg-card rounded-2xl border p-6 sm:p-8">
            <h2 className="text-foreground flex items-center gap-2 text-lg font-bold sm:text-xl">
              <HeartHandshake className="text-primary h-5 w-5" />
              4. Mode Arsip Pasca-Upacara & Pembayaran Aman
            </h2>
            <p className="text-muted-foreground mt-3">
              Setelah hari suci pernikahan selesai, workspace Anda beralih ke{" "}
              <strong>Mode Arsip Permanen (Baca-Saja)</strong> tanpa dipungut
              biaya langganan bulanan. Catatan pernikahan Anda tetap tersimpan
              utuh dan dapat dibuka kembali saat mengenang momen suci bersama
              keluarga.
            </p>
            <p className="text-muted-foreground mt-2">
              Seluruh transaksi pembayaran diproses melalui saluran resmi
              Midtrans yang tersertifikasi PCI-DSS Level 1. Kami tidak pernah
              menyimpan nomor kartu kredit atau PIN di server kami.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
