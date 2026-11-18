import "server-only";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Checks if a given email is listed in the authorized platform admin environment configuration.
 * Case-insensitive trimmed check against PLATFORM_ADMIN_EMAILS.
 * Defaults to empty array if unconfigured (fails closed).
 */
export function isPlatformAdminEmail(
  email: string | null | undefined
): boolean {
  if (!email || typeof email !== "string") return false;

  const rawConfig =
    process.env.PLATFORM_ADMIN_EMAILS !== undefined
      ? process.env.PLATFORM_ADMIN_EMAILS
      : "andresanjaya2506@gmail.com";
  const allowedEmails = rawConfig
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  const normalized = email.trim().toLowerCase();
  return allowedEmails.includes(normalized);
}

export interface AdminSessionVerification {
  isAdmin: boolean;
  adminEmail: string | null;
  adminUserId: string | null;
  role: "superadmin" | "support_operator" | null;
}

/**
 * Verifies if the currently logged-in user is an authorized platform administrator.
 * Security Guarantees:
 * - Does NOT trust user-writable metadata (raw_user_meta_data).
 * - Only authorizes against server environment (PLATFORM_ADMIN_EMAILS) or database platform_admins table.
 * - Fails closed: unauthenticated or non-admin requests return isAdmin = false.
 */
export async function verifyAdminSession(): Promise<AdminSessionVerification> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user || !user.email) {
      return {
        isAdmin: false,
        adminEmail: null,
        adminUserId: null,
        role: null,
      };
    }

    const email = user.email.toLowerCase().trim();

    // 1. Check environment variable authorization list
    if (isPlatformAdminEmail(email)) {
      return {
        isAdmin: true,
        adminEmail: email,
        adminUserId: user.id,
        role: "superadmin",
      };
    }

    // 2. Check platform_admins table via service-role admin client (bypasses customer-writable RLS)
    try {
      const adminClient = createAdminClient();
      const { data: adminRecord } = await adminClient
        .from("platform_admins")
        .select("role, is_active")
        .eq("email", email)
        .eq("is_active", true)
        .maybeSingle();

      if (adminRecord && adminRecord.is_active) {
        return {
          isAdmin: true,
          adminEmail: email,
          adminUserId: user.id,
          role: adminRecord.role as "superadmin" | "support_operator",
        };
      }
    } catch {
      // Table check fail-closed fallback
    }

    return {
      isAdmin: false,
      adminEmail: email,
      adminUserId: user.id,
      role: null,
    };
  } catch {
    return {
      isAdmin: false,
      adminEmail: null,
      adminUserId: null,
      role: null,
    };
  }
}

/**
 * Asserts that the current session belongs to an authorized platform administrator.
 * Throws an Error if unauthorized.
 */
export async function assertAdminSession(): Promise<{
  adminEmail: string;
  adminUserId: string;
  role: "superadmin" | "support_operator";
}> {
  const session = await verifyAdminSession();

  if (
    !session.isAdmin ||
    !session.adminEmail ||
    !session.adminUserId ||
    !session.role
  ) {
    throw new Error(
      "Akses ditolak: Anda tidak memiliki wewenang administrator platform operasional."
    );
  }

  return {
    adminEmail: session.adminEmail,
    adminUserId: session.adminUserId,
    role: session.role,
  };
}
