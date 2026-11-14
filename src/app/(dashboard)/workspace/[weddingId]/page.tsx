import { Suspense } from "react";
import Link from "next/link";
import {
  CalendarHeart,
  Flower2,
  Wallet,
  Users2,
  ArrowLeft,
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

interface WorkspaceContentProps {
  params: Promise<{ weddingId: string }>;
}

async function WorkspaceContent({ params }: WorkspaceContentProps) {
  const { weddingId } = await params;

  return (
    <div className="container mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
      {/* Workspace Header */}
      <div className="border-border flex flex-col gap-4 border-b pb-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="mb-1.5 flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              ID: {weddingId}
            </Badge>
            <Badge variant="secondary" className="text-xs">
              Memadik · Dresta Denpasar
            </Badge>
          </div>
          <h1 className="text-foreground text-2xl font-bold tracking-tight sm:text-3xl">
            Pawiwahan Dharma & Shanti
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Rencana Hari Baik: Sukra Pon Kulantir · Target: Q3 2027
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/" className="gap-1.5">
              <ArrowLeft className="h-4 w-4" /> Beranda
            </Link>
          </Button>
          <Button size="sm" className="gap-1.5" disabled>
            <Sparkles className="h-4 w-4" /> Tambah Upacara
          </Button>
        </div>
      </div>

      {/* Feature modules preview */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Rangkaian Upacara
            </CardTitle>
            <CalendarHeart className="text-primary h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">5 Prosesi</div>
            <p className="text-muted-foreground mt-1 text-xs">
              Ngidih, Mebyakala, Mejaya-jaya
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Banten & Sarana
            </CardTitle>
            <Flower2 className="text-primary h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">28 Item</div>
            <p className="text-muted-foreground mt-1 text-xs">
              12 Pesan paket · 16 Buat sendiri
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Anggaran Terencana
            </CardTitle>
            <Wallet className="text-primary h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Rp 65.000.000</div>
            <p className="text-muted-foreground mt-1 text-xs">
              Realisasi: Rp 15.000.000
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Keluarga & PIC
            </CardTitle>
            <Users2 className="text-primary h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">6 Anggota</div>
            <p className="text-muted-foreground mt-1 text-xs">
              Owner, Editor & Viewer
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Info Card */}
      <Card className="border-amber-500/20 bg-amber-500/5">
        <CardHeader>
          <CardTitle className="text-base">Status Integrasi Shell</CardTitle>
          <CardDescription>
            Halaman ini adalah shell responsif untuk ruang kerja pernikahan.
            Implementasi penyimpanan database dan hak akses multi-tenant akan
            diimplementasikan pada <strong>Issue #14</strong> (Database Schema)
            dan <strong>Issue #19</strong> (Wedding Workspace Management).
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}

export default function WorkspacePage({ params }: WorkspaceContentProps) {
  return (
    <Suspense
      fallback={
        <div className="text-muted-foreground container mx-auto max-w-7xl px-4 py-12 text-center">
          Memuat workspace...
        </div>
      }
    >
      <WorkspaceContent params={params} />
    </Suspense>
  );
}
