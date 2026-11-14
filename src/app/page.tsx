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
    <div className="flex flex-col gap-16 pb-20">
      {/* Account Deletion Notice */}
      <Suspense fallback={null}>
        <AccountDeletedBanner />
      </Suspense>

      {/* Hero Section */}
      <section className="border-border/40 relative overflow-hidden border-b bg-gradient-to-b from-amber-500/5 via-transparent to-transparent px-4 pt-12 pb-12 sm:px-6 sm:pt-20 lg:px-8">
        <div className="container mx-auto flex max-w-5xl flex-col items-center text-center">
          <div className="mb-6 inline-flex items-center gap-2">
            <Badge
              variant="secondary"
              className="gap-1.5 border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs text-amber-900 dark:text-amber-200"
            >
              <Compass className="h-3.5 w-3.5 text-amber-600" />
              <span>MVP v1 · Development Foundation Active</span>
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
            Workspace perencanaan pernikahan Hindu Bali yang dirancang khusus
            untuk mengelola rangkaian prosesi upacara, sarana banten, pembagian
            tugas keluarga, dan anggaran dalam satu tempat.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Button size="lg" asChild className="gap-2 shadow-md">
              <Link href="/workspace/demo">
                Masuk ke Workspace Demo
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link
                href="https://github.com/andresanjaya/patemon"
                target="_blank"
                rel="noreferrer"
                className="gap-2"
              >
                Lihat GitHub Backlog
              </Link>
            </Button>
          </div>

          {/* Dev Stack Badges */}
          <div className="border-border/60 text-muted-foreground mt-12 flex w-full max-w-3xl flex-wrap items-center justify-center gap-2 border-t pt-8 text-xs">
            <span className="text-foreground mr-1 font-semibold">
              Stack MVP:
            </span>
            <Badge variant="outline">Next.js App Router</Badge>
            <Badge variant="outline">TypeScript Strict</Badge>
            <Badge variant="outline">Tailwind CSS</Badge>
            <Badge variant="outline">shadcn/ui</Badge>
            <Badge variant="outline">Supabase Ready</Badge>
            <Badge variant="outline">pnpm</Badge>
          </div>
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
                keluarga, daerah (*dresta*), dan bentuk perkawinan (*memadik,
                ngerorod, nyentana*).
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

      {/* Core MVP Modules */}
      <section
        id="features"
        className="container mx-auto max-w-6xl px-4 sm:px-6 lg:px-8"
      >
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <Badge variant="outline" className="mb-3">
            Modul Utama
          </Badge>
          <h2 className="text-foreground text-2xl font-bold tracking-tight sm:text-3xl">
            Fondasi Terintegrasi untuk Pawiwahan
          </h2>
          <p className="text-muted-foreground mt-3 text-sm sm:text-base">
            Disiapkan untuk mempermudah eksekusi dari tahap persiapan hingga
            hari-H.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="bg-card/50">
            <CardHeader>
              <Flower2 className="text-primary mb-1 h-6 w-6" />
              <CardTitle className="text-base">Katalog Banten</CardTitle>
              <CardDescription className="text-xs">
                Klasifikasi sarana upacara, status pembuatan sendiri vs pesan
                paket banten, serta kuantitas.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Badge variant="secondary" className="text-[10px]">
                Tiket #16 & #25
              </Badge>
            </CardContent>
          </Card>

          <Card className="bg-card/50">
            <CardHeader>
              <CalendarHeart className="text-primary mb-1 h-6 w-6" />
              <CardTitle className="text-base">Jadwal Upacara</CardTitle>
              <CardDescription className="text-xs">
                Rangkaian ritual dari *Ngidih/Mekekeh, Madengen-dengen,
                Mebyakaon* hingga *Mejaya-jaya*.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Badge variant="secondary" className="text-[10px]">
                Tiket #20 & #30
              </Badge>
            </CardContent>
          </Card>

          <Card className="bg-card/50">
            <CardHeader>
              <Wallet className="text-primary mb-1 h-6 w-6" />
              <CardTitle className="text-base">Anggaran Integer IDR</CardTitle>
              <CardDescription className="text-xs">
                Pelacakan pengeluaran riil, termin pembayaran vendor, dan
                pencegahan duplikasi hitungan banten.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Badge variant="secondary" className="text-[10px]">
                Tiket #28
              </Badge>
            </CardContent>
          </Card>

          <Card className="bg-card/50">
            <CardHeader>
              <FileSpreadsheet className="text-primary mb-1 h-6 w-6" />
              <CardTitle className="text-base">
                Master Data Terstruktur
              </CardTitle>
              <CardDescription className="text-xs">
                Sinkronisasi data master banten dan prosesi dari lembar kerja
                perencana pernikahan Hindu Bali.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Badge variant="secondary" className="text-[10px]">
                Tiket #14 & #16
              </Badge>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Pricing & Transparency Section (Issue #35) */}
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <PricingSection showTitle={true} />
      </div>

      {/* Engineering Progress / Roadmap Checklist */}
      <section
        id="roadmap"
        className="container mx-auto max-w-4xl px-4 sm:px-6 lg:px-8"
      >
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <CardTitle className="flex items-center gap-2 text-lg">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                Status Pengembangan: Phase 03 Foundation
              </CardTitle>
              <Badge variant="success">Issue #13 In Progress</Badge>
            </div>
            <CardDescription>
              Tahapan pengembangan berikutnya sesuai dependensi arsitektur:
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
              <div>
                <strong>Issue #13:</strong> Initialize Next.js App Router,
                TypeScript Strict, Tailwind CSS, shadcn/ui & dev standards.
              </div>
            </div>
            <div className="flex items-start gap-2.5 opacity-75">
              <div className="border-muted-foreground mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border text-[10px]">
                2
              </div>
              <div>
                <strong>Issue #14:</strong> Database Schema — Supabase
                PostgreSQL migration (profiles, weddings, ritual_catalog,
                budget_items).
              </div>
            </div>
            <div className="flex items-start gap-2.5 opacity-75">
              <div className="border-muted-foreground mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border text-[10px]">
                3
              </div>
              <div>
                <strong>Issue #15:</strong> Supabase Auth & Row Level Security
                (RLS) multi-workspace isolation.
              </div>
            </div>
            <div className="flex items-start gap-2.5 opacity-75">
              <div className="border-muted-foreground mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border text-[10px]">
                4
              </div>
              <div>
                <strong>Issue #17:</strong> Automated CI/CD Pipeline (Lint,
                Typecheck, Build test).
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
