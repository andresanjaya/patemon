"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { captureError } from "@/lib/observability/logger";

export interface UserTakeoutData {
  profile: {
    id: string;
    email: string | null;
    fullName: string | null;
    phone: string | null;
    createdAt?: string;
    updatedAt?: string;
  };
  memberships: Array<{
    weddingId: string;
    coupleNames: string;
    role: string;
    status: string;
    joinedAt: string | null;
  }>;
  invitations: Array<{
    id: string;
    weddingId: string;
    coupleNames: string;
    role: string;
    invitedAt: string;
  }>;
  exportedAt: string;
  dataProtectionNotice: string;
  system: string;
}

export interface UserTakeoutResult {
  success: boolean;
  data?: UserTakeoutData;
  error?: string;
}

export interface DeletionEligibilityResult {
  eligible: boolean;
  soleOwnedWeddings: Array<{
    id: string;
    coupleNames: string;
  }>;
  error?: string;
}

export interface AccountDeletionResult {
  success: boolean;
  error?: string;
}

/**
 * Generates and returns a complete personal data takeout JSON according to UU PDP No. 27/2022.
 */
export async function getUserDataTakeoutAction(): Promise<UserTakeoutResult> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return {
        success: false,
        error: "Autentikasi diperlukan untuk mengunduh data pribadi.",
      };
    }

    // 1. Fetch user profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("id, email, full_name, phone, created_at, updated_at")
      .eq("id", user.id)
      .single();

    // 2. Fetch memberships with wedding details
    const { data: memberships } = await supabase
      .from("wedding_members")
      .select("wedding_id, role, status, joined_at, weddings(couple_names)")
      .eq("user_id", user.id);

    // 3. Fetch pending invitations for this user's email
    const userEmail = user.email?.toLowerCase();
    let invitations: Array<{
      id: string;
      weddingId: string;
      coupleNames: string;
      role: string;
      invitedAt: string;
    }> = [];

    if (userEmail) {
      const { data: rawInvites } = await supabase
        .from("wedding_members")
        .select("id, wedding_id, role, created_at, weddings(couple_names)")
        .eq("invited_email", userEmail)
        .eq("status", "invited");

      if (rawInvites) {
        invitations = rawInvites.map((inv) => {
          const weddingObj = Array.isArray(inv.weddings)
            ? inv.weddings[0]
            : inv.weddings;
          return {
            id: inv.id,
            weddingId: inv.wedding_id,
            coupleNames: weddingObj?.couple_names || "Pawiwahan",
            role: inv.role,
            invitedAt: inv.created_at || new Date().toISOString(),
          };
        });
      }
    }

    const mappedMemberships = (memberships || []).map((m) => {
      const weddingObj = Array.isArray(m.weddings) ? m.weddings[0] : m.weddings;
      return {
        weddingId: m.wedding_id,
        coupleNames: weddingObj?.couple_names || "Pawiwahan",
        role: m.role,
        status: m.status,
        joinedAt: m.joined_at,
      };
    });

    const takeout: UserTakeoutData = {
      profile: {
        id: user.id,
        email: profile?.email || user.email || null,
        fullName: profile?.full_name || user.user_metadata?.full_name || null,
        phone: profile?.phone || null,
        createdAt: profile?.created_at || user.created_at,
        updatedAt: profile?.updated_at || undefined,
      },
      memberships: mappedMemberships,
      invitations,
      exportedAt: new Date().toISOString(),
      dataProtectionNotice:
        "Salinan data pribadi ini diterbitkan sesuai hak subjek data berdasarkan UU No. 27 Tahun 2022 tentang Pelindungan Data Pribadi (UU PDP).",
      system: "Patemon Bali Hindu Wedding Planner v1 MVP",
    };

    return {
      success: true,
      data: takeout,
    };
  } catch (err: unknown) {
    captureError(err, { action: "getUserDataTakeoutAction" });
    const msg =
      err instanceof Error
        ? err.message
        : "Gagal menyiapkan berkas salinan data pribadi.";
    return { success: false, error: msg };
  }
}

/**
 * Checks whether the user is eligible for immediate account deletion,
 * ensuring no wedding workspace is orphaned without an active Owner.
 */
export async function checkAccountDeletionEligibilityAction(): Promise<DeletionEligibilityResult> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return {
        eligible: false,
        soleOwnedWeddings: [],
        error: "Autentikasi diperlukan.",
      };
    }

    // Find all workspaces where current user is an active 'owner'
    const { data: ownedMemberships, error } = await supabase
      .from("wedding_members")
      .select("wedding_id, weddings(id, couple_names)")
      .eq("user_id", user.id)
      .eq("role", "owner")
      .eq("status", "active");

    if (error || !ownedMemberships) {
      return {
        eligible: false,
        soleOwnedWeddings: [],
        error: "Gagal memeriksa status kepemilikan workspace.",
      };
    }

    const soleOwnedWeddings: Array<{ id: string; coupleNames: string }> = [];

    // For each owned workspace, verify if another active owner exists
    for (const membership of ownedMemberships) {
      const { data: otherOwners } = await supabase
        .from("wedding_members")
        .select("id")
        .eq("wedding_id", membership.wedding_id)
        .eq("role", "owner")
        .eq("status", "active")
        .neq("user_id", user.id);

      if (!otherOwners || otherOwners.length === 0) {
        const weddingObj = Array.isArray(membership.weddings)
          ? membership.weddings[0]
          : membership.weddings;
        soleOwnedWeddings.push({
          id: membership.wedding_id,
          coupleNames: weddingObj?.couple_names || "Pawiwahan",
        });
      }
    }

    return {
      eligible: soleOwnedWeddings.length === 0,
      soleOwnedWeddings,
    };
  } catch (err: unknown) {
    captureError(err, { action: "checkAccountDeletionEligibilityAction" });
    return {
      eligible: false,
      soleOwnedWeddings: [],
      error:
        err instanceof Error
          ? err.message
          : "Terjadi kesalahan saat memeriksa kelayakan penghapusan akun.",
    };
  }
}

/**
 * Deletes user account and associated personal profile data.
 * Requires strict confirmation phrase "HAPUS AKUN" and verifies no sole-owned workspaces remain.
 */
export async function deleteUserAccountAction(
  confirmationPhrase: string
): Promise<AccountDeletionResult> {
  if (confirmationPhrase?.trim().toUpperCase() !== "HAPUS AKUN") {
    return {
      success: false,
      error:
        'Frasa konfirmasi salah. Harap ketik "HAPUS AKUN" untuk melanjutkan.',
    };
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return {
        success: false,
        error: "Sesi tidak ditemukan atau telah kedaluwarsa.",
      };
    }

    // 1. Guardrail: Must not be sole owner of any active workspace
    const eligibility = await checkAccountDeletionEligibilityAction();
    if (!eligibility.eligible) {
      const names = eligibility.soleOwnedWeddings
        .map((w) => `"${w.coupleNames}"`)
        .join(", ");
      return {
        success: false,
        error: `Tidak dapat menghapus akun karena Anda adalah satu-satunya Pemilik aktif pada workspace: ${names}. Silakan alihkan peran Pemilik ke anggota keluarga lain atau hapus workspace tersebut terlebih dahulu.`,
      };
    }

    // 2. Cascade delete auth user & profile
    let adminDeletionSuccess = false;
    try {
      const adminClient = createAdminClient();
      const { error: adminError } = await adminClient.auth.admin.deleteUser(
        user.id
      );
      if (!adminError) {
        adminDeletionSuccess = true;
      }
    } catch {
      // Service role key might not be set in test environments
      adminDeletionSuccess = false;
    }

    if (!adminDeletionSuccess) {
      // Fallback: Delete profile record directly (cascades memberships via Postgres FK ON DELETE CASCADE)
      await supabase.from("profiles").delete().eq("id", user.id);
    }

    // 3. Sign out session
    await supabase.auth.signOut();

    return { success: true };
  } catch (err: unknown) {
    captureError(err, { action: "deleteUserAccountAction" });
    return {
      success: false,
      error:
        err instanceof Error
          ? err.message
          : "Gagal memproses penghapusan akun.",
    };
  }
}
