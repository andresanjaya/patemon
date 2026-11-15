import { redirect } from "next/navigation";
import { assertAdminSession } from "@/features/admin/auth";
import { AdminNav } from "@/features/admin/components/admin-nav";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let session: {
    adminEmail: string;
    adminUserId: string;
    role: "superadmin" | "support_operator";
  };

  try {
    session = await assertAdminSession();
  } catch {
    redirect("/?error=unauthorized_admin");
  }

  return (
    <div className="flex min-h-screen flex-col bg-stone-100 font-sans text-stone-900">
      <AdminNav adminEmail={session.adminEmail} role={session.role} />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}
