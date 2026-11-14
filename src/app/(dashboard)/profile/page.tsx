import { Suspense } from "react";
import { redirect } from "next/navigation";
import { UserCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { ProfileForm } from "@/features/auth/components/profile-form";

async function ProfileContent() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirectTo=/profile");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, phone, email")
    .eq("id", user.id)
    .single();

  return (
    <ProfileForm
      initialProfile={{
        email: profile?.email || user.email || "",
        fullName: profile?.full_name || user.user_metadata?.full_name || "",
        phone: profile?.phone || "",
      }}
    />
  );
}

function ProfileSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="bg-muted h-10 w-full rounded-md" />
      <div className="bg-muted h-10 w-full rounded-md" />
      <div className="bg-muted h-10 w-full rounded-md" />
    </div>
  );
}

export default function ProfilePage() {
  return (
    <div className="container mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
      <Card className="shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 text-primary flex h-10 w-10 items-center justify-center rounded-lg">
              <UserCheck className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-xl">Profil Pengguna</CardTitle>
              <CardDescription>
                Kelola informasi akun dan kontak Anda untuk koordinasi pawiwahan
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<ProfileSkeleton />}>
            <ProfileContent />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}
