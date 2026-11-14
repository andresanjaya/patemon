import { Suspense } from "react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  CalendarHeart,
  Flower2,
  Wallet,
  Sparkles,
  Settings,
  Calendar,
  MapPin,
  Heart,
  FileText,
  CheckSquare,
  Clock,
  ArrowRight,
  Store,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  getWeddingWorkspace,
  getUserWorkspaces,
} from "@/features/workspaces/actions";
import { WorkspaceHeader } from "@/features/workspaces/components/workspace-header";
import { CeremonyList } from "@/features/ceremonies/components/ceremony-list";
import { getWeddingCeremonies } from "@/features/ceremonies/actions";
import { getCeremonyTemplates } from "@/features/ceremonies/queries";
import { getWeddingBantenItems } from "@/features/banten/actions";
import { getWeddingTasks } from "@/features/checklist/actions";
import { getWeddingVendors } from "@/features/vendors/actions";
import {
  getPriorityBadgeClass,
  getPriorityLabel,
} from "@/features/checklist/seeds";
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
  const ceremonies = await getWeddingCeremonies(weddingId);
  const templates = await getCeremonyTemplates();
  const bantenItems = await getWeddingBantenItems(weddingId);
  const tasks = await getWeddingTasks(weddingId);
  const { vendors, stats: vendorStats } = await getWeddingVendors(weddingId);

  const completedTasksCount = tasks.filter((t) => t.status === "done").length;
  const urgentTasks = tasks
    .filter(
      (t) =>
        t.status !== "done" &&
        t.status !== "canceled" &&
        (t.priority === "urgent" || t.priority === "high")
    )
    .slice(0, 3);

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
                <Link href={`/workspace/${workspace.id}/onboarding`}>
                  <Sparkles className="h-4 w-4" />
                  <span>
                    {ceremonies.length > 0
                      ? "Edit Rencana Adat"
                      : "Panduan Onboarding"}
                  </span>
                </Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Core Stats Overview */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Rangkaian Prosesi Adat
              </CardTitle>
              <CalendarHeart className="text-primary h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {ceremonies.length > 0
                  ? `${ceremonies.length} Prosesi`
                  : "Belum Disusun"}
              </div>
              <p className="text-muted-foreground mt-1 text-xs">
                {ceremonies.length > 0
                  ? "Sesuai dresta & rembug keluarga"
                  : "Klik tombol onboarding untuk mulai"}
              </p>
            </CardContent>
          </Card>

          <Link
            href={`/workspace/${workspace.id}/banten`}
            className="block transition-transform hover:scale-[1.01]"
          >
            <Card className="hover:border-primary/40 h-full">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Kebutuhan Banten & Sarana
                </CardTitle>
                <Flower2 className="text-primary h-4 w-4" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {bantenItems.length > 0
                    ? `${bantenItems.length} Sarana`
                    : "Belum Disusun"}
                </div>
                <p className="text-muted-foreground mt-1 text-xs">
                  {bantenItems.length > 0
                    ? "Kelola paket serati & ngayah keluarga"
                    : "Klik untuk membuka perencana banten"}
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link
            href={`/workspace/${workspace.id}/tasks`}
            className="block transition-transform hover:scale-[1.01]"
          >
            <Card className="hover:border-primary/40 h-full">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Tugas & Checklist
                </CardTitle>
                <CheckSquare className="text-primary h-4 w-4" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {tasks.length > 0
                    ? `${completedTasksCount} / ${tasks.length}`
                    : "Belum Ada"}
                </div>
                <p className="text-muted-foreground mt-1 text-xs">
                  {tasks.length > 0
                    ? `${Math.round((completedTasksCount / tasks.length) * 100)}% terselesaikan`
                    : "Klik untuk membuka checklist"}
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link
            href={`/workspace/${workspace.id}/budget`}
            className="block transition-transform hover:scale-[1.01]"
          >
            <Card className="hover:border-primary/40 h-full">
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
          </Link>

          <Link
            href={`/workspace/${workspace.id}/vendors`}
            className="block transition-transform hover:scale-[1.01]"
          >
            <Card className="hover:border-primary/40 h-full">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Rekanan & Vendor
                </CardTitle>
                <Store className="text-primary h-4 w-4" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {vendors.length > 0
                    ? `${vendorStats.bookedVendors} / ${vendors.length}`
                    : "Belum Ada"}
                </div>
                <p className="text-muted-foreground mt-1 text-xs">
                  {vendors.length > 0
                    ? `${vendorStats.bookedVendors} vendor telah dipesan (booked)`
                    : "Klik untuk kelola vendor"}
                </p>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Urgent & Upcoming Tasks Preview */}
        {urgentTasks.length > 0 && (
          <Card className="via-card to-card border-amber-500/30 bg-gradient-to-r from-amber-500/5">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                <CardTitle className="text-base font-semibold">
                  Tugas Mendesak & Perlu Perhatian
                </CardTitle>
              </div>
              <Button
                variant="ghost"
                size="sm"
                asChild
                className="gap-1 text-xs"
              >
                <Link href={`/workspace/${workspace.id}/tasks`}>
                  <span>Lihat Semua ({tasks.length})</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              <div className="divide-border/40 divide-y">
                {urgentTasks.map((t) => (
                  <div
                    key={t.id}
                    className="flex flex-col justify-between gap-2 py-2.5 first:pt-0 last:pb-0 sm:flex-row sm:items-center"
                  >
                    <div className="flex items-center gap-2.5">
                      <Badge
                        variant="secondary"
                        className={`border text-[10px] font-medium ${getPriorityBadgeClass(
                          t.priority
                        )}`}
                      >
                        {getPriorityLabel(t.priority)}
                      </Badge>
                      <span className="text-foreground text-sm font-medium">
                        {t.title}
                      </span>
                    </div>
                    <div className="text-muted-foreground flex items-center gap-3 pl-7 text-xs sm:pl-0">
                      {t.assigneeName && <span>PIC: {t.assigneeName}</span>}
                      {t.dueDate && (
                        <span className="text-foreground/80 flex items-center gap-1 font-medium">
                          <Calendar className="h-3 w-3" />
                          {new Date(t.dueDate).toLocaleDateString("id-ID", {
                            day: "numeric",
                            month: "short",
                          })}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Ceremony Timeline & Editable Plan */}
        <div id="upacara">
          <CeremonyList
            weddingId={workspace.id}
            ceremonies={ceremonies}
            templates={templates}
            userRole={role}
          />
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
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {[1, 2, 3, 4, 5].map((i) => (
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
