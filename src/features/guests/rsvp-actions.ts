"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { captureError } from "@/lib/observability/logger";
import { DEMO_GUESTS } from "./seeds";
import type { GuestSide, InvitationStatus } from "./types";
import { verifyGuestWritePermission } from "./actions";
import {
  checkRsvpRateLimit,
  isValidTokenFormat,
  generateSecureRsvpToken,
  type PublicRsvpData,
  type RsvpLookupResult,
  type SubmitRsvpInput,
  type SubmitRsvpResult,
} from "./rsvp-utils";

export type {
  PublicRsvpData,
  RsvpLookupResult,
  SubmitRsvpInput,
  SubmitRsvpResult,
};

// ==============================================================================
// 1. Public RSVP Lookup (Safe Minimal Data Disclosure)
// ==============================================================================

export async function getRsvpGuestDetails(
  token: string,
  clientIp?: string
): Promise<RsvpLookupResult> {
  const rateLimit = checkRsvpRateLimit(clientIp || "ip_unknown");
  if (!rateLimit.allowed) {
    return {
      success: false,
      state: "rate_limited",
      error: `Terlalu banyak permintaan. Silakan tunggu ${rateLimit.retryAfterSeconds || 60} detik sebelum mencoba lagi.`,
    };
  }

  if (!isValidTokenFormat(token)) {
    return {
      success: false,
      state: "not_found",
      error: "Tautan konfirmasi tidak valid atau tidak ditemukan.",
    };
  }

  // Handle Demo Mode Preview
  if (token.startsWith("demo-rsvp-token-")) {
    const matchedGuest = DEMO_GUESTS.find((g) => g.rsvpToken === token);
    if (!matchedGuest) {
      return {
        success: false,
        state: "not_found",
        error: "Undangan demo tidak ditemukan.",
      };
    }

    return {
      success: true,
      data: {
        guestId: matchedGuest.id,
        guestName: matchedGuest.name,
        guestSide: matchedGuest.side,
        maxHeadcount: matchedGuest.headcount,
        invitationStatus: matchedGuest.invitationStatus,
        rsvpAttendingCount: matchedGuest.rsvpAttendingCount ?? null,
        rsvpNotes: matchedGuest.rsvpNotes ?? null,
        rsvpSubmittedAt: matchedGuest.rsvpSubmittedAt ?? null,
        rsvpDeadline: null,
        isExpired: false,
        wedding: {
          id: "demo",
          coupleNames: "I Putu Agus Pratama & Ni Kadek Dwi Lestari",
          prospectiveDate: "2026-10-24",
          ceremonyLocation: "Banjar Tengah, Ubud, Gianyar",
          isFrozen: false,
        },
      },
    };
  }

  try {
    const admin = createAdminClient();

    // Query guest by rsvp_token strictly where not deleted
    const { data: guestData, error: guestError } = await admin
      .from("guests")
      .select(
        "id, wedding_id, name, side, headcount, invitation_status, rsvp_token, rsvp_token_revoked_at, rsvp_attending_count, rsvp_notes, rsvp_submitted_at, rsvp_deadline, deleted_at"
      )
      .eq("rsvp_token", token)
      .is("deleted_at", null)
      .maybeSingle();

    if (guestError || !guestData) {
      return {
        success: false,
        state: "not_found",
        error: "Tautan konfirmasi tidak valid atau tidak ditemukan.",
      };
    }

    // Check if token was revoked
    if (guestData.rsvp_token_revoked_at) {
      return {
        success: false,
        state: "revoked",
        error:
          "Tautan undangan ini telah dicabut atau diperbarui oleh keluarga pengantin. Silakan hubungi pihak keluarga.",
      };
    }

    // Query wedding workspace for public event context
    const { data: weddingData, error: weddingError } = await admin
      .from("weddings")
      .select(
        "id, couple_names, prospective_date, location_region, is_frozen, deleted_at"
      )
      .eq("id", guestData.wedding_id)
      .maybeSingle();

    if (weddingError || !weddingData || weddingData.deleted_at) {
      return {
        success: false,
        state: "archived",
        error: "Acara pawiwahan ini telah selesai atau diarsipkan.",
      };
    }

    if (weddingData.is_frozen) {
      return {
        success: false,
        state: "archived",
        error: "Acara pawiwahan ini sedang ditangguhkan sementara.",
      };
    }

    // Check deadline
    let isExpired = false;
    const deadlineStr = guestData.rsvp_deadline || weddingData.prospective_date;
    if (deadlineStr) {
      const deadlineDate = new Date(deadlineStr);
      // Deadline ends at 23:59:59 WITA on that date
      deadlineDate.setHours(23, 59, 59, 999);
      if (Date.now() > deadlineDate.getTime()) {
        isExpired = true;
      }
    }

    return {
      success: true,
      data: {
        guestId: guestData.id,
        guestName: guestData.name,
        guestSide: guestData.side as GuestSide,
        maxHeadcount: Math.max(1, Math.round(Number(guestData.headcount) || 1)),
        invitationStatus: guestData.invitation_status as InvitationStatus,
        rsvpAttendingCount:
          typeof guestData.rsvp_attending_count === "number"
            ? guestData.rsvp_attending_count
            : null,
        rsvpNotes: guestData.rsvp_notes || null,
        rsvpSubmittedAt: guestData.rsvp_submitted_at || null,
        rsvpDeadline: deadlineStr || null,
        isExpired,
        wedding: {
          id: weddingData.id,
          coupleNames: weddingData.couple_names,
          prospectiveDate: weddingData.prospective_date,
          ceremonyLocation: weddingData.location_region || "Bali",
          isFrozen: !!weddingData.is_frozen,
        },
      },
    };
  } catch (err) {
    captureError(err, {
      action: "getRsvpGuestDetails",
      tokenMasked: token.slice(0, 8) + "...",
    });
    return {
      success: false,
      state: "error",
      error: "Terjadi gangguan saat memuat data undangan. Silakan coba lagi.",
    };
  }
}

// ==============================================================================
// 2. Public RSVP Submission (Atomic, Idempotent, Server-Validated)
// ==============================================================================

export async function submitGuestRsvpAction(
  input: SubmitRsvpInput
): Promise<SubmitRsvpResult> {
  const { token, status, attendingCount, notes, clientIp } = input;

  // 1. Rate limit check
  const rateLimit = checkRsvpRateLimit(clientIp || "ip_unknown");
  if (!rateLimit.allowed) {
    return {
      success: false,
      state: "rate_limited",
      error: `Terlalu banyak permintaan. Silakan tunggu ${rateLimit.retryAfterSeconds || 60} detik.`,
    };
  }

  // 2. Format check
  if (!isValidTokenFormat(token)) {
    return {
      success: false,
      state: "error",
      error: "Tautan konfirmasi tidak valid.",
    };
  }

  // 3. Status validation
  if (status !== "confirmed" && status !== "declined") {
    return {
      success: false,
      state: "error",
      error: "Status konfirmasi tidak valid (harus hadir atau berhalangan).",
    };
  }

  // 4. Sanitize notes
  const cleanNotes = notes ? notes.trim().slice(0, 500) : null;

  // Handle Demo Mode
  if (token.startsWith("demo-rsvp-token-")) {
    const matchedGuest = DEMO_GUESTS.find((g) => g.rsvpToken === token);
    if (!matchedGuest) {
      return {
        success: false,
        state: "error",
        error: "Undangan demo tidak ditemukan.",
      };
    }

    if (status === "confirmed") {
      if (attendingCount < 1 || attendingCount > matchedGuest.headcount) {
        return {
          success: false,
          state: "invalid_quota",
          error: `Jumlah kehadiran harus antara 1 dan ${matchedGuest.headcount} orang.`,
        };
      }
    }

    const finalCount = status === "confirmed" ? attendingCount : 0;
    matchedGuest.invitationStatus = status;
    matchedGuest.rsvpAttendingCount = finalCount;
    matchedGuest.rsvpNotes = cleanNotes;
    matchedGuest.rsvpSubmittedAt = new Date().toISOString();

    return {
      success: true,
      message:
        status === "confirmed"
          ? "Suksma! Konfirmasi kehadiran Anda berhasil dicatat (Demo mode)."
          : "Suksma atas konfirmasi dan doa restunya (Demo mode).",
      data: {
        invitationStatus: status,
        attendingCount: finalCount,
        rsvpNotes: cleanNotes,
        rsvpSubmittedAt: matchedGuest.rsvpSubmittedAt,
      },
    };
  }

  try {
    const admin = createAdminClient();

    // Fetch existing guest and wedding atomically
    const { data: guestData, error: guestError } = await admin
      .from("guests")
      .select(
        "id, wedding_id, name, headcount, rsvp_token, rsvp_token_revoked_at, rsvp_deadline, deleted_at"
      )
      .eq("rsvp_token", token)
      .is("deleted_at", null)
      .maybeSingle();

    if (guestError || !guestData) {
      return {
        success: false,
        state: "error",
        error: "Undangan tidak ditemukan atau tautan telah kedaluwarsa.",
      };
    }

    if (guestData.rsvp_token_revoked_at) {
      return {
        success: false,
        state: "revoked",
        error: "Tautan konfirmasi ini telah dicabut oleh pihak keluarga.",
      };
    }

    // Verify wedding status
    const { data: weddingData, error: weddingError } = await admin
      .from("weddings")
      .select("id, prospective_date, is_frozen, deleted_at")
      .eq("id", guestData.wedding_id)
      .maybeSingle();

    if (
      weddingError ||
      !weddingData ||
      weddingData.deleted_at ||
      weddingData.is_frozen
    ) {
      return {
        success: false,
        state: "archived",
        error: "Acara pawiwahan ini telah selesai atau diarsipkan.",
      };
    }

    // Check deadline
    const deadlineStr = guestData.rsvp_deadline || weddingData.prospective_date;
    if (deadlineStr) {
      const deadlineDate = new Date(deadlineStr);
      deadlineDate.setHours(23, 59, 59, 999);
      if (Date.now() > deadlineDate.getTime()) {
        return {
          success: false,
          state: "expired",
          error: "Batas waktu konfirmasi kehadiran (RSVP) telah berakhir.",
        };
      }
    }

    // Headcount quota validation
    const maxHeadcount = Math.max(
      1,
      Math.round(Number(guestData.headcount) || 1)
    );
    let validatedAttendingCount = 0;

    if (status === "confirmed") {
      const parsedCount = Math.round(Number(attendingCount));
      if (isNaN(parsedCount) || parsedCount < 1) {
        return {
          success: false,
          state: "invalid_quota",
          error: "Jumlah kehadiran minimal 1 orang jika konfirmasi hadir.",
        };
      }
      if (parsedCount > maxHeadcount) {
        return {
          success: false,
          state: "invalid_quota",
          error: `Jumlah kehadiran (${parsedCount} orang) tidak boleh melebihi kuota undangan (${maxHeadcount} orang).`,
        };
      }
      validatedAttendingCount = parsedCount;
    } else {
      // Declined
      validatedAttendingCount = 0;
    }

    const submittedAt = new Date().toISOString();

    // Perform atomic and idempotent update
    const { error: updateError } = await admin
      .from("guests")
      .update({
        invitation_status: status,
        rsvp_attending_count: validatedAttendingCount,
        rsvp_notes: cleanNotes,
        rsvp_submitted_at: submittedAt,
        updated_at: submittedAt,
      })
      .eq("id", guestData.id)
      .eq("rsvp_token", token);

    if (updateError) {
      captureError(updateError, {
        action: "submitGuestRsvpAction",
        guestId: guestData.id,
      });
      return {
        success: false,
        state: "error",
        error: "Gagal memperbarui konfirmasi kehadiran. Silakan coba lagi.",
      };
    }

    // Revalidate dashboard routes
    try {
      revalidatePath(`/workspace/${guestData.wedding_id}/guests`);
      revalidatePath(`/workspace/${guestData.wedding_id}`);
    } catch {
      // Non-fatal if outside next router context
    }

    return {
      success: true,
      message:
        status === "confirmed"
          ? "Suksma! Konfirmasi kehadiran Anda berhasil dicatat."
          : "Suksma atas konfirmasi dan doa restunya.",
      data: {
        invitationStatus: status,
        attendingCount: validatedAttendingCount,
        rsvpNotes: cleanNotes,
        rsvpSubmittedAt: submittedAt,
      },
    };
  } catch (err) {
    captureError(err, {
      action: "submitGuestRsvpAction",
      tokenMasked: token.slice(0, 8) + "...",
    });
    return {
      success: false,
      state: "error",
      error: "Terjadi kesalahan internal saat menyimpan konfirmasi kehadiran.",
    };
  }
}

// ==============================================================================
// 3. Workspace Owner Token Rotation & Revocation
// ==============================================================================

export async function rotateGuestRsvpTokenAction(
  weddingId: string,
  guestId: string
): Promise<{ success: boolean; token?: string; error?: string }> {
  if (weddingId === "demo") {
    const newToken = `demo-rsvp-token-${Date.now()}`;
    const target = DEMO_GUESTS.find((g) => g.id === guestId);
    if (target) {
      target.rsvpToken = newToken;
      target.rsvpTokenRevokedAt = null;
    }
    return { success: true, token: newToken };
  }

  const auth = await verifyGuestWritePermission(weddingId);
  if (!auth.allowed) {
    return { success: false, error: auth.error };
  }

  const newToken = generateSecureRsvpToken();

  try {
    const admin = createAdminClient();
    const { error } = await admin
      .from("guests")
      .update({
        rsvp_token: newToken,
        rsvp_token_revoked_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", guestId)
      .eq("wedding_id", weddingId)
      .is("deleted_at", null);

    if (error) {
      captureError(error, {
        action: "rotateGuestRsvpTokenAction",
        weddingId,
        guestId,
      });
      return { success: false, error: "Gagal memperbarui tautan RSVP." };
    }

    revalidatePath(`/workspace/${weddingId}/guests`);
    return { success: true, token: newToken };
  } catch (err) {
    captureError(err, {
      action: "rotateGuestRsvpTokenAction",
      weddingId,
      guestId,
    });
    return {
      success: false,
      error: "Terjadi kesalahan saat merotasi token RSVP.",
    };
  }
}

export async function revokeGuestRsvpTokenAction(
  weddingId: string,
  guestId: string
): Promise<{ success: boolean; error?: string }> {
  if (weddingId === "demo") {
    const target = DEMO_GUESTS.find((g) => g.id === guestId);
    if (target) {
      target.rsvpTokenRevokedAt = new Date().toISOString();
    }
    return { success: true };
  }

  const auth = await verifyGuestWritePermission(weddingId);
  if (!auth.allowed) {
    return { success: false, error: auth.error };
  }

  try {
    const admin = createAdminClient();
    const { error } = await admin
      .from("guests")
      .update({
        rsvp_token_revoked_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", guestId)
      .eq("wedding_id", weddingId)
      .is("deleted_at", null);

    if (error) {
      captureError(error, {
        action: "revokeGuestRsvpTokenAction",
        weddingId,
        guestId,
      });
      return { success: false, error: "Gagal mencabut tautan RSVP." };
    }

    revalidatePath(`/workspace/${weddingId}/guests`);
    return { success: true };
  } catch (err) {
    captureError(err, {
      action: "revokeGuestRsvpTokenAction",
      weddingId,
      guestId,
    });
    return {
      success: false,
      error: "Terjadi kesalahan saat mencabut token RSVP.",
    };
  }
}
