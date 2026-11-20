import { redirect } from "next/navigation";
import { assertAdminSession } from "@/features/admin/auth";
import { AdminShell } from "@/features/admin/components/admin-shell";

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
    <AdminShell adminEmail={session.adminEmail} role={session.role}>
      {children}
    </AdminShell>
  );
}
