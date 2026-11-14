import { Suspense } from "react";
import { redirect } from "next/navigation";
import { Sparkles, ArrowLeft } from "lucide-react";
import Link from "next/link";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { CreateWorkspaceForm } from "@/features/workspaces/components/create-workspace-form";
import { createClient } from "@/lib/supabase/server";

async function NewWorkspaceContent() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirectTo=/workspace/new");
  }

  return <CreateWorkspaceForm />;
}

export default function NewWorkspacePage() {
  return (
    <div className="container mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <Link
          href="/workspaces"
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-xs transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Kembali ke Daftar Pawiwahan</span>
        </Link>
      </div>

      <Card className="shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 text-primary flex h-10 w-10 items-center justify-center rounded-lg">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-xl">
                Buat Ruang Kerja Pawiwahan Baru
              </CardTitle>
              <CardDescription>
                Tentukan informasi dasar pernikahan adat untuk memulai
                penyusunan rencana upacara dan banten
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Suspense
            fallback={
              <div className="bg-muted h-48 animate-pulse rounded-md" />
            }
          >
            <NewWorkspaceContent />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}
