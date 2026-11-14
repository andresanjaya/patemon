import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  CalendarHeart,
  Plus,
  ArrowRight,
  Sparkles,
  MapPin,
  Calendar,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { getUserWorkspaces } from "@/features/workspaces/actions";
import {
  formatMarriageForm,
  formatRupiah,
} from "@/features/workspaces/validation";
import { createClient } from "@/lib/supabase/server";

async function WorkspacesList() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirectTo=/workspaces");
  }

  const workspaces = await getUserWorkspaces();

  return (
    <div className="space-y-6">
      {workspaces.length === 0 ? (
        <Card className="border-dashed py-12 text-center">
          <CardContent className="space-y-4">
            <div className="bg-primary/10 text-primary mx-auto flex h-14 w-14 items-center justify-center rounded-2xl">
              <CalendarHeart className="h-7 w-7" />
            </div>
            <div className="space-y-1">
              <CardTitle className="text-xl">
                Belum Ada Workspace Pawiwahan
              </CardTitle>
              <CardDescription className="mx-auto max-w-md">
                Mulai susun rencana pernikahan adat Bali Anda dengan membuat
                workspace pertama.
              </CardDescription>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <Button asChild className="gap-2">
                <Link href="/workspace/new">
                  <Plus className="h-4 w-4" />
                  <span>Buat Workspace Baru</span>
                </Link>
              </Button>
              <Button variant="outline" asChild className="gap-2">
                <Link href="/workspace/demo">
                  <Sparkles className="h-4 w-4" />
                  <span>Lihat Demo Gratis</span>
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {workspaces.map((w) => (
            <Card
              key={w.id}
              className="flex flex-col justify-between transition-shadow hover:shadow-md"
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <Badge variant="outline" className="text-xs">
                    {formatMarriageForm(w.marriageForm)}
                  </Badge>
                  <Badge
                    variant={w.userRole === "owner" ? "default" : "secondary"}
                    className="text-[10px] uppercase"
                  >
                    {w.userRole === "owner"
                      ? "Pemilik"
                      : w.userRole === "editor"
                        ? "Editor"
                        : "Pelihat"}
                  </Badge>
                </div>
                <CardTitle className="mt-2 line-clamp-1 text-lg leading-tight">
                  {w.coupleNames}
                </CardTitle>
              </CardHeader>

              <CardContent className="text-muted-foreground space-y-2.5 pb-4 text-xs">
                <div className="flex items-center gap-2">
                  <MapPin className="h-3.5 w-3.5 shrink-0" />
                  <span>{w.locationRegion || "Wilayah Bali"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-3.5 w-3.5 shrink-0" />
                  <span>
                    {w.prospectiveDate
                      ? new Date(w.prospectiveDate).toLocaleDateString(
                          "id-ID",
                          {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          }
                        )
                      : "Jadwal belum ditentukan"}
                  </span>
                </div>
                {w.targetBudget > 0 && (
                  <div className="text-foreground flex items-center gap-2 font-medium">
                    <Wallet className="text-primary h-3.5 w-3.5 shrink-0" />
                    <span>{formatRupiah(w.targetBudget)}</span>
                  </div>
                )}
              </CardContent>

              <CardFooter className="border-border/40 border-t pt-3">
                <Button size="sm" asChild className="w-full gap-2">
                  <Link href={`/workspace/${w.id}`}>
                    <span>Buka Workspace</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function WorkspacesSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {[1, 2].map((i) => (
        <Card key={i} className="animate-pulse">
          <CardHeader className="space-y-2">
            <div className="bg-muted h-5 w-24 rounded" />
            <div className="bg-muted h-6 w-48 rounded" />
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="bg-muted h-4 w-32 rounded" />
            <div className="bg-muted h-4 w-40 rounded" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default function WorkspacesPage() {
  return (
    <div className="container mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Workspace Pawiwahan Anda
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Kelola seluruh persiapan pernikahan adat Bali dalam ruang kerja
            terpusat
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button asChild className="gap-2">
            <Link href="/workspace/new">
              <Plus className="h-4 w-4" />
              <span>Buat Pawiwahan Baru</span>
            </Link>
          </Button>
        </div>
      </div>

      <Suspense fallback={<WorkspacesSkeleton />}>
        <WorkspacesList />
      </Suspense>
    </div>
  );
}
