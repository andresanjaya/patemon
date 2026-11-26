"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { captureError } from "@/lib/observability/logger";
import { getCurrentUser } from "@/features/workspaces/session";
import { checkFeatureAccess } from "@/features/payments/entitlements";
import type { WorkspaceRole } from "@/features/workspaces/types";
import {
  DEMO_MEMBERS,
  type WorkspaceMember,
  type InviteMemberInput,
  type UpdateMemberRoleInput,
  type RevokeMemberInput,
  type PendingInvitation,
} from "./types";

export interface MemberActionResult {
  success: boolean;
  error?: string;
  message?: string;
}

/**
 * Validates email format.
 */
function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Fetch all members and collaborators for a wedding workspace.
 */
export async function getWorkspaceMembers(
  weddingId: string
): Promise<WorkspaceMember[]> {
  if (weddingId === "demo") {
    return DEMO_MEMBERS;
  }

  try {
    const supabase = await createClient();
    const user = await getCurrentUser();

    if (!user) {
      return [];
    }

    // 1. Fetch wedding members
    const { data: members, error: membersError } = await supabase
      .from("wedding_members")
      .select("*")
      .eq("wedding_id", weddingId)
      .order("created_at", { ascending: true });

    if (membersError || !members) {
      if (membersError) {
        captureError(membersError, {
          action: "getWorkspaceMembers",
          weddingId,
        });
      }
      return [];
    }

    // 2. Fetch associated profiles
    const userIds = members
      .map((m) => m.user_id)
      .filter((id): id is string => Boolean(id));

    const profileMap = new Map<
      string,
      {
        fullName: string | null;
        email: string | null;
        avatarUrl: string | null;
      }
    >();

    if (userIds.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, email, avatar_url")
        .in("id", userIds);

      if (profiles) {
        profiles.forEach((p) => {
          profileMap.set(p.id, {
            fullName: p.full_name,
            email: p.email,
            avatarUrl: p.avatar_url,
          });
        });
      }
    }

    // Map and order: Owner first, then Active, Invited, Revoked
    const mapped: WorkspaceMember[] = members.map((m) => ({
      id: m.id,
      weddingId: m.wedding_id,
      userId: m.user_id,
      role: m.role as WorkspaceRole,
      invitedEmail: m.invited_email,
      invitedBy: m.invited_by,
      status: m.status as WorkspaceMember["status"],
      joinedAt: m.joined_at,
      createdAt: m.created_at,
      updatedAt: m.updated_at,
      profile: m.user_id ? profileMap.get(m.user_id) || null : null,
    }));

    return mapped.sort((a, b) => {
      // 1. Role hierarchy (owner > editor > viewer)
      const roleWeight = { owner: 3, editor: 2, viewer: 1 };
      const roleDiff = roleWeight[b.role] - roleWeight[a.role];
      if (roleDiff !== 0) return roleDiff;

      // 2. Status hierarchy (active > invited > revoked)
      const statusWeight = { active: 3, invited: 2, revoked: 1 };
      const statusDiff = statusWeight[b.status] - statusWeight[a.status];
      if (statusDiff !== 0) return statusDiff;

      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });
  } catch (err) {
    captureError(err, { action: "getWorkspaceMembers", weddingId });
    return [];
  }
}

/**
 * Invites a family member or collaborator with a specified role.
 * Requires caller to be an active 'owner' of the workspace.
 */
export async function inviteWorkspaceMemberAction(
  input: InviteMemberInput
): Promise<MemberActionResult> {
  const email = input.email?.trim().toLowerCase();

  if (!email || !isValidEmail(email)) {
    return {
      success: false,
      error: "Alamat email tidak valid. Masukkan format email yang benar.",
    };
  }

  if (input.weddingId === "demo") {
    return {
      success: true,
      message:
        "Dalam mode demo, simulasi undangan berhasil dikirimkan ke " + email,
    };
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Sesi login tidak valid." };
    }

    // 1. Verify caller has 'owner' role
    const { data: callerMember } = await supabase
      .from("wedding_members")
      .select("role")
      .eq("wedding_id", input.weddingId)
      .eq("user_id", user.id)
      .eq("status", "active")
      .maybeSingle();

    const { data: wedding } = await supabase
      .from("weddings")
      .select("created_by")
      .eq("id", input.weddingId)
      .maybeSingle();

    const isOwner =
      callerMember?.role === "owner" || wedding?.created_by === user.id;

    if (!isOwner) {
      return {
        success: false,
        error:
          "Hanya Pemilik (Owner) workspace yang memiliki wewenang mengundang anggota keluarga.",
      };
    }

    // 1.5. Verify workspace entitlement (inviting collaborators requires active paid license)
    const featureAccess = await checkFeatureAccess(input.weddingId, "invite");
    if (!featureAccess.allowed) {
      return {
        success: false,
        error:
          featureAccess.reason ||
          "Fitur mengundang anggota keluarga memerlukan aktivasi lisensi penuh.",
      };
    }

    // 2. Check if already invited or active
    const { data: existing } = await supabase
      .from("wedding_members")
      .select("id, status, role")
      .eq("wedding_id", input.weddingId)
      .eq("invited_email", email)
      .maybeSingle();

    if (existing) {
      if (existing.status === "active") {
        return {
          success: false,
          error: `Pengguna dengan email ${email} sudah menjadi anggota aktif workspace ini.`,
        };
      }
      if (existing.status === "invited") {
        return {
          success: false,
          error: `Undangan ke ${email} sudah pernah dikirim dan sedang menunggu konfirmasi.`,
        };
      }
      // If revoked, allow re-invitation by updating status
      const { error: updateError } = await supabase
        .from("wedding_members")
        .update({
          role: input.role,
          status: "invited",
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.id);

      if (updateError) {
        return { success: false, error: "Gagal memperbarui status undangan." };
      }

      revalidatePath(`/workspace/${input.weddingId}/settings`);
      return {
        success: true,
        message: `Undangan berhasil dikirim ulang ke ${email} dengan peran ${input.role.toUpperCase()}.`,
      };
    }

    // 3. Check if user already exists in public.profiles
    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    // 4. Insert new member record
    const { error: insertError } = await supabase
      .from("wedding_members")
      .insert({
        wedding_id: input.weddingId,
        user_id: profile ? profile.id : null,
        role: input.role,
        invited_email: email,
        invited_by: user.id,
        status: profile ? "active" : "invited",
        joined_at: profile ? new Date().toISOString() : null,
      });

    if (insertError) {
      captureError(insertError, {
        action: "inviteWorkspaceMemberAction",
        weddingId: input.weddingId,
        email,
      });
      return {
        success: false,
        error: "Gagal menyimpan undangan anggota: " + insertError.message,
      };
    }

    revalidatePath(`/workspace/${input.weddingId}/settings`);
    return {
      success: true,
      message: `Undangan kolaborasi berhasil dikirim ke ${email}.`,
    };
  } catch (err) {
    captureError(err, { action: "inviteWorkspaceMemberAction", email });
    return {
      success: false,
      error: "Terjadi kesalahan saat memproses undangan.",
    };
  }
}

/**
 * Updates a member's role (owner, editor, viewer).
 * Protects against demoting the sole owner of a workspace.
 */
export async function updateWorkspaceMemberRoleAction(
  input: UpdateMemberRoleInput
): Promise<MemberActionResult> {
  if (input.weddingId === "demo") {
    return {
      success: true,
      message: "Simulasi perubahan peran berhasil disimpan.",
    };
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Sesi login tidak valid." };
    }

    // 1. Verify caller has 'owner' role
    const { data: callerMember } = await supabase
      .from("wedding_members")
      .select("role")
      .eq("wedding_id", input.weddingId)
      .eq("user_id", user.id)
      .eq("status", "active")
      .maybeSingle();

    const { data: wedding } = await supabase
      .from("weddings")
      .select("created_by")
      .eq("id", input.weddingId)
      .maybeSingle();

    const isCallerOwner =
      callerMember?.role === "owner" || wedding?.created_by === user.id;

    if (!isCallerOwner) {
      return {
        success: false,
        error: "Hanya Pemilik (Owner) yang dapat mengubah peran anggota.",
      };
    }

    // 2. Fetch target member
    const { data: targetMember } = await supabase
      .from("wedding_members")
      .select("id, role, user_id, status")
      .eq("id", input.memberId)
      .eq("wedding_id", input.weddingId)
      .maybeSingle();

    if (!targetMember) {
      return { success: false, error: "Anggota tidak ditemukan." };
    }

    // 3. Safety check: Cannot demote if target is sole active owner
    if (targetMember.role === "owner" && input.role !== "owner") {
      const { data: allActiveOwners } = await supabase
        .from("wedding_members")
        .select("id")
        .eq("wedding_id", input.weddingId)
        .eq("role", "owner")
        .eq("status", "active");

      const isOriginalCreatorAnotherOwner =
        wedding?.created_by && wedding.created_by !== targetMember.user_id;

      if (
        (!allActiveOwners || allActiveOwners.length <= 1) &&
        !isOriginalCreatorAnotherOwner
      ) {
        return {
          success: false,
          error:
            "Tidak dapat mengubah peran. Workspace harus memiliki setidaknya satu Pemilik (Owner) aktif.",
        };
      }
    }

    // 4. Update role
    const { error: updateError } = await supabase
      .from("wedding_members")
      .update({
        role: input.role,
        updated_at: new Date().toISOString(),
      })
      .eq("id", input.memberId);

    if (updateError) {
      captureError(updateError, {
        action: "updateWorkspaceMemberRoleAction",
        memberId: input.memberId,
      });
      return { success: false, error: "Gagal memperbarui peran anggota." };
    }

    revalidatePath(`/workspace/${input.weddingId}/settings`);
    return {
      success: true,
      message: `Peran anggota berhasil diubah menjadi ${input.role.toUpperCase()}.`,
    };
  } catch (err) {
    captureError(err, { action: "updateWorkspaceMemberRoleAction" });
    return { success: false, error: "Terjadi kesalahan saat mengubah peran." };
  }
}

/**
 * Revokes a member's access. The revoked user immediately loses all RLS access.
 */
export async function revokeWorkspaceMemberAction(
  input: RevokeMemberInput
): Promise<MemberActionResult> {
  if (input.weddingId === "demo") {
    return {
      success: true,
      message: "Simulasi pencabutan akses anggota berhasil.",
    };
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Sesi login tidak valid." };
    }

    // 1. Verify caller has 'owner' role
    const { data: callerMember } = await supabase
      .from("wedding_members")
      .select("role")
      .eq("wedding_id", input.weddingId)
      .eq("user_id", user.id)
      .eq("status", "active")
      .maybeSingle();

    const { data: wedding } = await supabase
      .from("weddings")
      .select("created_by")
      .eq("id", input.weddingId)
      .maybeSingle();

    const isCallerOwner =
      callerMember?.role === "owner" || wedding?.created_by === user.id;

    if (!isCallerOwner) {
      return {
        success: false,
        error: "Hanya Pemilik (Owner) yang dapat mencabut akses anggota.",
      };
    }

    // 2. Fetch target member
    const { data: targetMember } = await supabase
      .from("wedding_members")
      .select("id, role, user_id")
      .eq("id", input.memberId)
      .eq("wedding_id", input.weddingId)
      .maybeSingle();

    if (!targetMember) {
      return { success: false, error: "Anggota tidak ditemukan." };
    }

    // 3. Safety check: Cannot revoke sole owner
    if (targetMember.role === "owner") {
      const { data: otherActiveOwners } = await supabase
        .from("wedding_members")
        .select("id")
        .eq("wedding_id", input.weddingId)
        .eq("role", "owner")
        .eq("status", "active")
        .neq("id", targetMember.id);

      const isOriginalCreatorAnotherOwner =
        wedding?.created_by && wedding.created_by !== targetMember.user_id;

      if (
        (!otherActiveOwners || otherActiveOwners.length === 0) &&
        !isOriginalCreatorAnotherOwner
      ) {
        return {
          success: false,
          error:
            "Tidak dapat mencabut akses. Workspace harus memiliki setidaknya satu Pemilik (Owner) aktif.",
        };
      }
    }

    // 4. Update status to 'revoked'
    const { error: revokeError } = await supabase
      .from("wedding_members")
      .update({
        status: "revoked",
        updated_at: new Date().toISOString(),
      })
      .eq("id", input.memberId);

    if (revokeError) {
      captureError(revokeError, {
        action: "revokeWorkspaceMemberAction",
        memberId: input.memberId,
      });
      return { success: false, error: "Gagal mencabut akses anggota." };
    }

    revalidatePath(`/workspace/${input.weddingId}/settings`);
    return {
      success: true,
      message: "Akses anggota berhasil dicabut.",
    };
  } catch (err) {
    captureError(err, { action: "revokeWorkspaceMemberAction" });
    return { success: false, error: "Terjadi kesalahan saat mencabut akses." };
  }
}

/**
 * Permanently removes an invited or revoked member record.
 */
export async function deleteWorkspaceMemberAction(
  input: RevokeMemberInput
): Promise<MemberActionResult> {
  if (input.weddingId === "demo") {
    return {
      success: true,
      message: "Simulasi penghapusan anggota berhasil.",
    };
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Sesi login tidak valid." };
    }

    // 1. Verify caller has 'owner' role
    const { data: callerMember } = await supabase
      .from("wedding_members")
      .select("role")
      .eq("wedding_id", input.weddingId)
      .eq("user_id", user.id)
      .eq("status", "active")
      .maybeSingle();

    const { data: wedding } = await supabase
      .from("weddings")
      .select("created_by")
      .eq("id", input.weddingId)
      .maybeSingle();

    const isCallerOwner =
      callerMember?.role === "owner" || wedding?.created_by === user.id;

    if (!isCallerOwner) {
      return {
        success: false,
        error: "Hanya Pemilik (Owner) yang dapat menghapus anggota.",
      };
    }

    const { error: deleteError } = await supabase
      .from("wedding_members")
      .delete()
      .eq("id", input.memberId)
      .eq("wedding_id", input.weddingId);

    if (deleteError) {
      captureError(deleteError, {
        action: "deleteWorkspaceMemberAction",
        memberId: input.memberId,
      });
      return { success: false, error: "Gagal menghapus anggota." };
    }

    revalidatePath(`/workspace/${input.weddingId}/settings`);
    return {
      success: true,
      message: "Anggota berhasil dihapus dari daftar.",
    };
  } catch (err) {
    captureError(err, { action: "deleteWorkspaceMemberAction" });
    return {
      success: false,
      error: "Terjadi kesalahan saat menghapus anggota.",
    };
  }
}

/**
 * Fetches pending invitations for the current logged in user.
 */
export async function getUserPendingInvitations(): Promise<
  PendingInvitation[]
> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || !user.email) {
      return [];
    }

    const normalizedEmail = user.email.trim().toLowerCase();

    const { data: invites, error } = await supabase
      .from("wedding_members")
      .select(
        `
        id,
        wedding_id,
        role,
        invited_email,
        created_at,
        weddings (
          id,
          couple_names
        )
      `
      )
      .eq("invited_email", normalizedEmail)
      .eq("status", "invited")
      .order("created_at", { ascending: false });

    if (error || !invites) {
      return [];
    }

    interface RawInviteRecord {
      id: string;
      wedding_id: string;
      role: string;
      invited_email: string;
      created_at: string;
      weddings: {
        id: string;
        couple_names: string;
      } | null;
    }

    const records = invites as unknown as RawInviteRecord[];

    return records.map((inv) => ({
      id: inv.id,
      weddingId: inv.wedding_id,
      coupleNames: inv.weddings?.couple_names || "Pawiwahan",
      role: inv.role as WorkspaceRole,
      invitedEmail: inv.invited_email,
      invitedByEmail: null,
      invitedByName: null,
      createdAt: inv.created_at,
    }));
  } catch (err) {
    captureError(err, { action: "getUserPendingInvitations" });
    return [];
  }
}

/**
 * Accepts an invitation: activates membership and links user account.
 */
export async function acceptWorkspaceInvitationAction(
  memberId: string
): Promise<MemberActionResult> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || !user.email) {
      return { success: false, error: "Sesi login tidak valid." };
    }

    const normalizedEmail = user.email.trim().toLowerCase();

    // Verify invitation belongs to this user
    const { data: invite, error: fetchError } = await supabase
      .from("wedding_members")
      .select("id, invited_email, wedding_id")
      .eq("id", memberId)
      .eq("status", "invited")
      .maybeSingle();

    if (fetchError || !invite) {
      return {
        success: false,
        error: "Undangan tidak ditemukan atau sudah tidak aktif.",
      };
    }

    if (invite.invited_email.toLowerCase() !== normalizedEmail) {
      return {
        success: false,
        error: "Undangan ini tidak ditujukan untuk email akun Anda.",
      };
    }

    // Activate membership
    const { error: updateError } = await supabase
      .from("wedding_members")
      .update({
        user_id: user.id,
        status: "active",
        joined_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", memberId);

    if (updateError) {
      captureError(updateError, {
        action: "acceptWorkspaceInvitationAction",
        memberId,
      });
      return {
        success: false,
        error: "Gagal menerima undangan: " + updateError.message,
      };
    }

    revalidatePath("/workspaces");
    return {
      success: true,
      message:
        "Undangan berhasil diterima! Anda kini menjadi anggota workspace.",
    };
  } catch (err) {
    captureError(err, { action: "acceptWorkspaceInvitationAction", memberId });
    return {
      success: false,
      error: "Terjadi kesalahan saat menerima undangan.",
    };
  }
}

/**
 * Declines an invitation: sets status to revoked or removes record.
 */
export async function declineWorkspaceInvitationAction(
  memberId: string
): Promise<MemberActionResult> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || !user.email) {
      return { success: false, error: "Sesi login tidak valid." };
    }

    const normalizedEmail = user.email.trim().toLowerCase();

    const { data: invite } = await supabase
      .from("wedding_members")
      .select("id, invited_email")
      .eq("id", memberId)
      .eq("status", "invited")
      .maybeSingle();

    if (!invite || invite.invited_email.toLowerCase() !== normalizedEmail) {
      return { success: false, error: "Undangan tidak valid." };
    }

    const { error: updateError } = await supabase
      .from("wedding_members")
      .update({
        status: "revoked",
        updated_at: new Date().toISOString(),
      })
      .eq("id", memberId);

    if (updateError) {
      return { success: false, error: "Gagal menolak undangan." };
    }

    revalidatePath("/workspaces");
    return {
      success: true,
      message: "Undangan berhasil ditolak.",
    };
  } catch (err) {
    captureError(err, { action: "declineWorkspaceInvitationAction", memberId });
    return {
      success: false,
      error: "Terjadi kesalahan saat menolak undangan.",
    };
  }
}
