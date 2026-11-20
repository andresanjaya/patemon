"use server";

import { createClient } from "@/lib/supabase/server";
import { captureError } from "@/lib/observability/logger";
import { getWeddingWorkspace } from "@/features/workspaces/actions";
import { getWorkspaceEntitlement } from "@/features/payments/entitlements";
import {
  sanitizeActivityDetails,
  ACTIVITY_LOG_DEFAULT_PAGE_SIZE,
  ACTIVITY_LOG_MAX_PAGE_SIZE,
} from "./sanitizer";
import { DEMO_ACTIVITY_LOGS } from "./seeds";
import type {
  ActivityLog,
  ActorType,
  RecordActivityLogInput,
  ActivityLogFilter,
  PaginatedActivityLogs,
} from "./types";

function isPlatformAdminEmail(email: string | null | undefined): boolean {
  if (!email || typeof email !== "string") return false;
  const rawConfig = process.env.PLATFORM_ADMIN_EMAILS || "";
  const allowedEmails = rawConfig
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return allowedEmails.includes(email.trim().toLowerCase());
}

/**
 * Record an activity audit log entry on the server side.
 * Never trust raw client inputs for actor credentials.
 */
export async function recordActivityLogAction(
  input: RecordActivityLogInput
): Promise<{ success: boolean; logId?: string; error?: string }> {
  try {
    if (!input.weddingId) {
      return { success: false, error: "Wedding ID wajib disertakan." };
    }

    if (input.weddingId === "demo") {
      return { success: true, logId: `demo-log-${Date.now()}` };
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Determine actor type and display name securely
    let actorType: ActorType = input.actorType || "user";
    let actorName: string | null = input.actorName || null;
    let userId: string | null = null;

    if (actorType === "system") {
      actorName = actorName || "Sistem Otomatis Patemon";
      userId = null;
    } else if (user) {
      userId = user.id;
      if (isPlatformAdminEmail(user.email)) {
        actorType = "admin";
        actorName = actorName || "Admin Platform Patemon";
      } else {
        actorType = "user";
        if (!actorName) {
          try {
            // Look up user profile name
            const { data: profile } = await supabase
              .from("profiles")
              .select("full_name, email")
              .eq("id", user.id)
              .maybeSingle();

            actorName =
              profile?.full_name ||
              (profile?.email ? profile.email.split("@")[0] : null) ||
              user.user_metadata?.full_name ||
              "Anggota Panitia";
          } catch {
            actorName = user.user_metadata?.full_name || "Anggota Panitia";
          }
        }
      }
    } else if (input.actorType === "admin") {
      actorType = "admin";
      actorName = actorName || "Admin Platform Patemon";
    } else {
      // Unauthenticated non-system context fallback
      actorType = "system";
      actorName = "Sistem Otomatis Patemon";
    }

    // Sanitize details to scrub secrets and mask PII
    const sanitizedDetails = sanitizeActivityDetails(input.details);

    const insertPayload = {
      wedding_id: input.weddingId,
      user_id: userId,
      action: input.action,
      entity_type: input.entityType,
      entity_id: input.entityId || null,
      actor_type: actorType,
      actor_name: actorName,
      entity_title: input.entityTitle || null,
      summary: input.summary || null,
      details: sanitizedDetails as import("@/types/database").Json,
      created_at: new Date().toISOString(),
    };

    const table = supabase.from("activity_logs");
    if (!table || typeof table.insert !== "function") {
      return {
        success: false,
        error: "Koneksi tabel activity_logs tidak tersedia.",
      };
    }

    const { data, error } = await table
      .insert(insertPayload)
      .select("id")
      .single();

    if (error || !data) {
      captureError(error, {
        action: "recordActivityLogAction",
        weddingId: input.weddingId,
        entityType: input.entityType,
      });
      return {
        success: false,
        error: error?.message || "Gagal mencatat riwayat audit aktivitas.",
      };
    }

    return { success: true, logId: data.id };
  } catch (err) {
    captureError(err, {
      action: "recordActivityLogAction",
      weddingId: input.weddingId,
    });
    return {
      success: false,
      error: "Terjadi kesalahan internal saat mencatat audit trail.",
    };
  }
}

/**
 * Fetch paginated workspace activity logs with strict multi-tenant authorization.
 */
export async function getWorkspaceActivityLogsAction(
  weddingId: string,
  filter?: ActivityLogFilter
): Promise<{ success: boolean; data?: PaginatedActivityLogs; error?: string }> {
  try {
    const page = Math.max(1, filter?.page || 1);
    const pageSize = Math.min(
      ACTIVITY_LOG_MAX_PAGE_SIZE,
      Math.max(1, filter?.pageSize || ACTIVITY_LOG_DEFAULT_PAGE_SIZE)
    );

    // Verify workspace access (fail-closed)
    const { workspace, role } = await getWeddingWorkspace(weddingId);
    if (!workspace || !role) {
      return {
        success: false,
        error: "Akses ditolak. Anda tidak memiliki izin pada workspace ini.",
      };
    }

    const servePreviewLogs = (logsSource: ActivityLog[]) => {
      let filtered = [...logsSource];

      if (filter?.entityType && filter.entityType !== "all") {
        filtered = filtered.filter((l) => l.entityType === filter.entityType);
      }

      if (filter?.actorType && (filter.actorType as string) !== "all") {
        filtered = filtered.filter((l) => l.actorType === filter.actorType);
      }

      if (filter?.search) {
        const query = filter.search.toLowerCase();
        filtered = filtered.filter(
          (l) =>
            l.entityTitle?.toLowerCase().includes(query) ||
            l.summary?.toLowerCase().includes(query) ||
            l.actorName?.toLowerCase().includes(query)
        );
      }

      const total = filtered.length;
      const totalPages = Math.ceil(total / pageSize) || 1;
      const startIndex = (page - 1) * pageSize;
      const logs = filtered.slice(startIndex, startIndex + pageSize);

      return {
        success: true,
        data: {
          logs,
          total,
          page,
          pageSize,
          totalPages,
        },
      };
    };

    // Demo workspace mock data
    if (weddingId === "demo") {
      return servePreviewLogs(DEMO_ACTIVITY_LOGS);
    }

    // Live database query
    const supabase = await createClient();
    let query = supabase
      .from("activity_logs")
      .select("*", { count: "exact" })
      .eq("wedding_id", weddingId);

    if (filter?.entityType && filter.entityType !== "all") {
      query = query.eq("entity_type", filter.entityType);
    }

    if (filter?.actorType && (filter.actorType as string) !== "all") {
      query = query.eq("actor_type", filter.actorType);
    }

    if (filter?.search) {
      // Use text search on summary and entity_title
      query = query.or(
        `summary.ilike.%${filter.search}%,entity_title.ilike.%${filter.search}%,actor_name.ilike.%${filter.search}%`
      );
    }

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data, count, error } = await query
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) {
      captureError(error, {
        action: "getWorkspaceActivityLogsAction",
        weddingId,
      });
      return {
        success: false,
        error: error.message || "Gagal memuat log aktivitas workspace.",
      };
    }

    const total = count || 0;
    if (total === 0) {
      const entitlement = await getWorkspaceEntitlement(weddingId, supabase);
      if (!entitlement.isPaid) {
        const previewLogs = DEMO_ACTIVITY_LOGS.map((l, idx) => ({
          ...l,
          id: `${weddingId}-preview-log-${idx + 1}`,
          weddingId,
          createdAt: new Date(
            Date.now() - (idx + 1) * 3600 * 1000 * 6
          ).toISOString(),
        }));
        return servePreviewLogs(previewLogs);
      }
    }

    const totalPages = Math.ceil(total / pageSize) || 1;

    const logs: ActivityLog[] = (data || []).map((row) => ({
      id: row.id,
      weddingId: row.wedding_id,
      userId: row.user_id,
      action: row.action,
      entityType: row.entity_type,
      entityId: row.entity_id,
      actorType: (row.actor_type as ActorType) || "user",
      actorName: row.actor_name,
      entityTitle: row.entity_title,
      summary: row.summary,
      details: row.details as Record<string, unknown> | null,
      createdAt: row.created_at,
    }));

    return {
      success: true,
      data: {
        logs,
        total,
        page,
        pageSize,
        totalPages,
      },
    };
  } catch (err) {
    captureError(err, {
      action: "getWorkspaceActivityLogsAction",
      weddingId,
    });
    return {
      success: false,
      error: "Terjadi kesalahan internal saat memuat riwayat aktivitas.",
    };
  }
}
