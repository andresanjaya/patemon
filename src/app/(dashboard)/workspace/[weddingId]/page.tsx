import { Suspense } from "react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  CalendarHeart,
  Flower2,
  Wallet,
  Users2,
  Sparkles,
  Settings,
  Calendar,
  MapPin,
  Heart,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  getWeddingWorkspace,
  getUserWorkspaces,
} from "@/features/workspaces/actions";
import { WorkspaceHeader } from "@/features/workspaces/components/workspace-header";
import {
  formatMarriageForm,
  formatRupiah,
} from "@/features/workspaces/validation";
import { createClient } from "@/lib/supabase/server";

interface WorkspacePageProps {
  params: Promise<{ weddingId: string }>;
}

async function WorkspaceContent({ params }: WorkspacePageProps) {
  const { weddingId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && weddingId !== "demo") {
    redirect(`/login?redirectTo=/workspace/${weddingId}`);
  }

  const { workspace, role } = await getWeddingWorkspace(weddingId);

  if (!workspace || !role) {
    notFound();
  }

  const userWorkspaces = await getUserWorkspaces();

  return (
    <>
      <WorkspaceHeader
        workspace={workspace}
        userRole={role}
        userWorkspaces={userWorkspaces}
      />

      <div className="container mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
        {/* Workspace Hero Banner */}
        <div className="border-border/60 from-primary/5 to-primary/10 rounded-2xl border bg-gradient-to-r via-transparent p-6 sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  {formatMarriageForm(workspace.marriageForm)}
                </Badge>
                {workspace.locationRegion && (
                  <Badge variant="secondary" className="text-xs">
                    <MapPin className="mr-1 h-3 w-3" />
                    {workspace.locationRegion}
                  </Badge>
                )}
                {workspace.id === "demo" && (
                  <Badge className="bg-amber-500 text-xs text-white hover:bg-amber-600">
                    Mode Demo Pratinjau
                  </Badge>
                )}
              </div>

              <h1 className="text-foreground text-2xl font-bold tracking-tight sm:text-3xl">
                {workspace.coupleNames}
              </h1>

              {(workspace.groomName || workspace.brideName) && (
                <p className="text-muted-foreground flex items-center gap-2 text-sm font-medium">
                  <Heart className="text-primary h-4 w-4" />
                  <span>
                    {workspace.groomName || "Mempelai Pria"} &{" "}
                    {workspace.brideName || "Mempelai Wanita"}
                  </span>
                </p>
              )}

              <p className="text-muted-foreground text-xs">
                {workspace.prospectiveDate ? (
                  <span className="inline-flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5" />
                    Rencana Hari Baik:{" "}
                    {new Date(workspace.prospectiveDate).toLocaleDateString(
                      "id-ID",
                      {
                        weekday: "long",
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      }
                    )}
                  </span>
                ) : (
                  <span>Jadwal Dewasa Ayu belum ditentukan</span>
                )}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 sm:self-start">
              <Button variant="outline" size="sm" asChild className="gap-1.5">
                <Link href={`/workspace/${workspace.id}/settings`}>
                  <Settings className="h-4 w-4" />
                  <span>Pengaturan</span>
                </Link>
              </Button>
              <Button size="sm" className="gap-1.5" asChild>
                <Link href={`/workspace/${workspace.id}/settings`}>
                  <Sparkles className="h-4 w-4" />
                  <span>Kelola Detail</span>
                </Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Core Stats Overview */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Rangkaian Prosesi Adat
              </CardTitle>
              <CalendarHeart className="text-primary h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">5 Prosesi</div>
              <p className="text-muted-foreground mt-1 text-xs">
                Memadik, Mebyakala, Mesakapan
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Kebutuhan Banten & Sarana
              </CardTitle>
              <Flower2 className="text-primary h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Tersusun</div>
              <p className="text-muted-foreground mt-1 text-xs">
                Pejati, Suci, Pasaksi & Banten Pawiwahan
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Estimasi Anggaran
              </CardTitle>
              <Wallet className="text-primary h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatRupiah(workspace.targetBudget)}
              </div>
              <p className="text-muted-foreground mt-1 text-xs">
                Target alokasi upakara & resepsi
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Tim & Peran Anda
              </CardTitle>
              <Users2 className="text-primary h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold capitalize">
                {role === "owner"
                  ? "Pemilik"
                  : role === "editor"
                    ? "Editor"
                    : "Pelihat"}
              </div>
              <p className="text-muted-foreground mt-1 text-xs">
                Akses kolaborasi keluarga
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Notes & Special Reminders */}
        {workspace.notes && (
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <FileText className="text-primary h-4 w-4" />
                <CardTitle className="text-base">
                  Catatan Khusus Pawiwahan
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm whitespace-pre-wrap">
                {workspace.notes}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}

function WorkspaceSkeleton() {
  return (
    <div className="container mx-auto max-w-7xl animate-pulse space-y-8 px-4 py-12">
      <div className="bg-muted h-40 rounded-2xl" />
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-muted h-28 rounded-lg" />
        ))}
      </div>
    </div>
  );
}

export default function WorkspacePage({ params }: WorkspacePageProps) {
  return (
    <Suspense fallback={<WorkspaceSkeleton />}>
      <WorkspaceContent params={params} />
    </Suspense>
  );
}
