import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { sanitizeRedirectPath } from "@/middleware";
import {
  CalendarHeart,
  Flower2,
  Users2,
  Wallet,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Compass,
  FileSpreadsheet,
  UserCheck,
  CreditCard,
  MessageCircle,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { AccountDeletedBanner } from "@/components/account-deleted-banner";
import { PricingSection } from "@/features/payments/components/pricing-section";
import { formatSupportWhatsAppLink } from "@/features/payments/support";

interface HomePageProps {
  searchParams?: Promise<{
    code?: string;
    next?: string;
    error?: string;
    error_description?: string;
  }>;
}

export default async function HomePage(props: HomePageProps) {
  const searchParams = await props.searchParams;

  // Resilient fallback: If an OAuth provider or Supabase fallback redirects to root "/"
  // with an authorization code, forward it to the auth callback handler immediately.
  if (searchParams?.code) {
    const next = sanitizeRedirectPath(searchParams.next, "/workspaces");
    redirect(
      `/auth/callback?code=${encodeURIComponent(searchParams.code)}&next=${encodeURIComponent(next)}`
    );
  }

  if (searchParams?.error || searchParams?.error_description) {
    const errorMsg = encodeURIComponent(
      searchParams.error_description || searchParams.error || "auth_failed"
    );
    redirect(`/login?error=${errorMsg}`);
  }

  return (
    <div className="flex flex-col gap-20 pb-20">
      {/* Account Deletion Notice */}
      <Suspense fallback={null}>
        <AccountDeletedBanner />
      </Suspense>

      {/* Hero Section */}
      <section className="border-border/40 relative overflow-hidden border-b bg-gradient-to-b from-amber-500/5 via-transparent to-transparent px-4 pt-12 pb-14 sm:px-6 sm:pt-20 lg:px-8">
        <div className="container mx-auto flex max-w-5xl flex-col items-center text-center">
          <div className="mb-6 inline-flex items-center gap-2">
            <Badge
              variant="secondary"
              className="border-primary/30 bg-primary/10 text-primary gap-1.5 px-3.5 py-1 text-xs"
            >
              <Compass className="h-3.5 w-3.5" />
              <span>Platform Manajemen Pawiwahan Hindu Bali</span>
            </Badge>
          </div>

          <h1 className="text-foreground max-w-4xl text-3xl leading-[1.15] font-bold tracking-tight sm:text-5xl lg:text-6xl">
            Rencanakan{" "}
            <span className="text-primary underline decoration-amber-400/50 underline-offset-8">
              Pawiwahan
            </span>{" "}
            dengan Tertata, Khidmat, & Transparan
          </h1>

          <p className="text-muted-foreground mt-6 max-w-2xl text-base leading-relaxed sm:text-lg">
            Ruang kerja terpadu untuk calon mempelai dan keluarga Hindu Bali.
            Kelola seluruh rangkaian prosesi upacara, sarana banten, pembagian
            tugas panitia keluarga, dan anggaran adat dalam satu tempat.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Button size="lg" asChild className="gap-2 shadow-md">
              <Link href="/register">
                Mulai Rencanakan Gratis
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/workspace/demo" className="gap-2">
                Jelajahi Demo Interaktif
              </Link>
            </Button>
          </div>

          {/* Value Highlights */}
          <div className="border-border/60 text-muted-foreground mt-12 flex w-full max-w-3xl flex-wrap items-center justify-center gap-2.5 border-t pt-8 text-xs">
            <Badge variant="outline" className="gap-1.5 py-1">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
              <span>Sesuai Dresta (Memadik, Ngerorod, Nyentana)</span>
            </Badge>
            <Badge variant="outline" className="gap-1.5 py-1">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
              <span>Sekali Bayar · Tanpa Langganan Bulanan</span>
            </Badge>
            <Badge variant="outline" className="gap-1.5 py-1">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
              <span>Kolaborasi Hingga 15 Anggota Keluarga</span>
            </Badge>
            <Badge variant="outline" className="gap-1.5 py-1">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
              <span>Format Cetak & Ekspor Lapangan Offline</span>
            </Badge>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section
        id="how-it-works"
        className="container mx-auto max-w-6xl px-4 sm:px-6 lg:px-8"
      >
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <Badge variant="outline" className="mb-3">
            Alur Perencanaan
          </Badge>
          <h2 className="text-foreground text-2xl font-bold tracking-tight sm:text-3xl">
            Cara Kerja Perencanaan di Patemon
          </h2>
          <p className="text-muted-foreground mt-3 text-sm sm:text-base">
            Empat tahapan terstruktur dari penyusunan awal hingga pelaksanaan
            hari-H yang khidmat.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="border-border/80 bg-card/60 relative">
            <CardHeader className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="bg-primary/10 text-primary flex h-10 w-10 items-center justify-center rounded-xl font-bold">
                  1
                </div>
                <UserCheck className="text-muted-foreground/60 h-5 w-5" />
              </div>
              <CardTitle className="text-base font-bold">
                Daftar & Buat Workspace
              </CardTitle>
              <CardDescription className="text-xs leading-relaxed">
                Buat akun gratis. Tentukan nama mempelai, tanggal perkawinan
                (Dewasa Ayu), bentuk perkawinan adat, dan wilayah banjar.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-border/80 bg-card/60 relative">
            <CardHeader className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="bg-primary/10 text-primary flex h-10 w-10 items-center justify-center rounded-xl font-bold">
                  2
                </div>
                <Flower2 className="text-muted-foreground/60 h-5 w-5" />
              </div>
              <CardTitle className="text-base font-bold">
                Eksplorasi Katalog & Draft
              </CardTitle>
              <CardDescription className="text-xs leading-relaxed">
                Jelajahi panduan 30+ sarana banten, rangkaian upacara, dan buku
                anggaran dalam mode pratinjau gratis tanpa komitmen.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-border/80 bg-card/60 relative">
            <CardHeader className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="bg-primary/10 text-primary flex h-10 w-10 items-center justify-center rounded-xl font-bold">
                  3
                </div>
                <CreditCard className="text-muted-foreground/60 h-5 w-5" />
              </div>
              <CardTitle className="text-base font-bold">
                Aktivasi Lisensi Sekali Bayar
              </CardTitle>
              <CardDescription className="text-xs leading-relaxed">
                Aktifkan lisensi penuh seharga Rp 199.000 via QRIS / Bank
                Transfer Midtrans berizin resmi. Tanpa langganan bulanan.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-border/80 bg-card/60 relative">
            <CardHeader className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="bg-primary/10 text-primary flex h-10 w-10 items-center justify-center rounded-xl font-bold">
                  4
                </div>
                <Users2 className="text-muted-foreground/60 h-5 w-5" />
              </div>
              <CardTitle className="text-base font-bold">
                Kolaborasi & Kawal Hari-H
              </CardTitle>
              <CardDescription className="text-xs leading-relaxed">
                Undang hingga 15 keluarga, bagi penanggung jawab (PIC), pantau
                skor kesiapan, dan unduh rundown cetak untuk hari-H.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* Product Principles (Desa Kala Patra) */}
      <section
        id="principles"
        className="container mx-auto max-w-6xl px-4 sm:px-6 lg:px-8"
      >
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <Badge variant="outline" className="mb-3">
            Filosofi & Pendekatan
          </Badge>
          <h2 className="text-foreground text-2xl font-bold tracking-tight sm:text-3xl">
            Prinsip Desain Patemon
          </h2>
          <p className="text-muted-foreground mt-3 text-sm sm:text-base">
            Menghormati keragaman dresta dan adat tanpa memaksakan satu pakem
            kaku universal.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <Card className="border-border/80 hover:border-primary/40 transition-colors">
            <CardHeader>
              <div className="bg-primary/10 text-primary mb-2 flex h-10 w-10 items-center justify-center rounded-lg">
                <Compass className="h-5 w-5" />
              </div>
              <CardTitle className="text-lg">Desa, Kala, Patra</CardTitle>
              <CardDescription>
                Rangkaian upacara dan banten dapat disesuaikan dengan tradisi
                keluarga, daerah (<em>dresta</em>), dan bentuk perkawinan (
                <em>memadik, ngerorod, nyentana</em>).
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-border/80 hover:border-primary/40 transition-colors">
            <CardHeader>
              <div className="bg-primary/10 text-primary mb-2 flex h-10 w-10 items-center justify-center rounded-lg">
                <Users2 className="h-5 w-5" />
              </div>
              <CardTitle className="text-lg">
                Satu Upacara, Multi-Keluarga
              </CardTitle>
              <CardDescription>
                Bukan sekadar akun pribadi calon pengantin, melainkan workspace
                bersama yang dapat mengundang keluarga inti dan PIC dengan hak
                akses terkontrol.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-border/80 hover:border-primary/40 transition-colors">
            <CardHeader>
              <div className="bg-primary/10 text-primary mb-2 flex h-10 w-10 items-center justify-center rounded-lg">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <CardTitle className="text-lg">Data Ritual Tervalidasi</CardTitle>
              <CardDescription>
                Setiap item katalog banten dan sarana mencantumkan sumber
                rujukan, status verifikasi, dan catatan konsultasi
                pemangku/serati.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* Core Modules */}
      <section
        id="features"
        className="container mx-auto max-w-6xl px-4 sm:px-6 lg:px-8"
      >
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <Badge variant="outline" className="mb-3">
            Modul Utama
          </Badge>
          <h2 className="text-foreground text-2xl font-bold tracking-tight sm:text-3xl">
            Fitur Lengkap untuk Pawiwahan
          </h2>
          <p className="text-muted-foreground mt-3 text-sm sm:text-base">
            Alat bantu terintegrasi dari tahap persiapan awal, koordinasi
            keluarga, hingga eksekusi hari-H.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="bg-card/50">
            <CardHeader>
              <Flower2 className="text-primary mb-1 h-6 w-6" />
              <CardTitle className="text-base">Katalog Banten</CardTitle>
              <CardDescription className="text-xs">
                Klasifikasi sarana upacara, status pembuatan sendiri (ngayah) vs
                pesan paket banten, serta kuantitas.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Badge variant="secondary" className="text-[10px]">
                Pesan Serati / Ngayah
              </Badge>
            </CardContent>
          </Card>

          <Card className="bg-card/50">
            <CardHeader>
              <CalendarHeart className="text-primary mb-1 h-6 w-6" />
              <CardTitle className="text-base">Jadwal Upacara</CardTitle>
              <CardDescription className="text-xs">
                Rangkaian ritual dari{" "}
                <em>Ngidih/Mekekeh, Madengen-dengen, Mebyakaon</em> hingga{" "}
                <em>Mejaya-jaya</em>.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Badge variant="secondary" className="text-[10px]">
                Kronologis & Format WITA
              </Badge>
            </CardContent>
          </Card>

          <Card className="bg-card/50">
            <CardHeader>
              <Wallet className="text-primary mb-1 h-6 w-6" />
              <CardTitle className="text-base">Buku Anggaran</CardTitle>
              <CardDescription className="text-xs">
                Pelacakan pengeluaran riil, termin pembayaran vendor, dan
                pencegahan duplikasi hitungan banten.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Badge variant="secondary" className="text-[10px]">
                Purusa, Pradana & Bersama
              </Badge>
            </CardContent>
          </Card>

          <Card className="bg-card/50">
            <CardHeader>
              <FileSpreadsheet className="text-primary mb-1 h-6 w-6" />
              <CardTitle className="text-base">Rundown & Ekspor CSV</CardTitle>
              <CardDescription className="text-xs">
                Susunan agenda panitia hari-H dengan pembagian PIC dan ekspor
                berkas siap cetak untuk lapangan.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Badge variant="secondary" className="text-[10px]">
                Siap Cetak Lapangan
              </Badge>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Pricing & Transparency Section */}
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <PricingSection showTitle={true} />
      </div>

      {/* Adat Consultation & Help Callout */}
      <section className="container mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="border-border/80 bg-muted/30 flex flex-col items-center justify-between gap-6 rounded-3xl border p-6 text-center sm:flex-row sm:p-8 sm:text-left">
          <div className="space-y-1.5">
            <div className="flex items-center justify-center gap-2 sm:justify-start">
              <Sparkles className="text-primary h-4 w-4" />
              <h3 className="text-foreground text-base font-bold">
                Butuh Bantuan Menyesuaikan Dresta Adat?
              </h3>
            </div>
            <p className="text-muted-foreground max-w-xl text-xs leading-relaxed sm:text-sm">
              Tim kurator adat Patemon siap menjawab pertanyaan seputar variasi
              upacara, banten, atau panduan aktivasi lisensi via WhatsApp resmi.
            </p>
          </div>
          <Button
            asChild
            className="shrink-0 gap-2 bg-emerald-600 text-xs text-white shadow-md hover:bg-emerald-700"
          >
            <a
              href={formatSupportWhatsAppLink({
                category: "adat_consultation",
                userMessage:
                  "Om Swastyastu tim Patemon, saya ingin berkonsultasi mengenai persiapan upacara...",
              })}
              target="_blank"
              rel="noopener noreferrer"
            >
              <MessageCircle className="h-4 w-4" />
              <span>Konsultasi via WhatsApp</span>
            </a>
          </Button>
        </div>
      </section>
    </div>
  );
}
