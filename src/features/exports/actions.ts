"use server";

import { createClient } from "@/lib/supabase/server";
import { getWeddingWorkspace } from "@/features/workspaces/actions";
import { getWeddingCeremonies } from "@/features/ceremonies/actions";
import { getWeddingBantenItems } from "@/features/banten/actions";
import { getWeddingTasks } from "@/features/checklist/actions";
import { getWeddingBudgetItems } from "@/features/budget/actions";
import { getWeddingVendors } from "@/features/vendors/actions";
import { getWeddingGuests } from "@/features/guests/actions";
import { getWeddingRundown } from "@/features/rundown/actions";
import { getCurrentTimeWita } from "@/features/rundown/seeds";
import type { WeddingWorkspace } from "@/features/workspaces/types";
import type { WeddingCeremony } from "@/features/ceremonies/types";
import type { BantenItem } from "@/features/banten/types";
import type { WeddingTask } from "@/features/checklist/types";
import type { BudgetItem } from "@/features/budget/types";
import type { Vendor } from "@/features/vendors/types";
import type { Guest } from "@/features/guests/types";
import type { RundownEvent } from "@/features/rundown/types";
import {
  generateOfflineHtmlPack,
  type OfflinePackData,
  type OfflinePackOptions,
} from "./offline-pack";

export interface WorkspaceExportPayload {
  wedding: WeddingWorkspace;
  ceremonies: WeddingCeremony[];
  banten: BantenItem[];
  tasks: WeddingTask[];
  budget: BudgetItem[];
  vendors: Vendor[];
  rundown: RundownEvent[];
  guests: Guest[];
  exportedAt: string;
  system: string;
}

export interface WorkspaceExportResult {
  success: boolean;
  data?: WorkspaceExportPayload;
  error?: string;
}

/**
 * Fetches all modular data for a wedding workspace for offline contingency archiving and CSV exports.
 */
export async function getWorkspaceFullExportAction(
  weddingId: string
): Promise<WorkspaceExportResult> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user && weddingId !== "demo") {
      return {
        success: false,
        error: "Autentikasi diperlukan untuk mengekspor data workspace.",
      };
    }

    const { workspace, role } = await getWeddingWorkspace(weddingId);
    if (!workspace || !role) {
      return {
        success: false,
        error: "Workspace tidak ditemukan atau akses ditolak.",
      };
    }

    const [
      ceremonies,
      banten,
      tasks,
      budget,
      vendorResult,
      guestResult,
      rundownResult,
    ] = await Promise.all([
      getWeddingCeremonies(weddingId),
      getWeddingBantenItems(weddingId),
      getWeddingTasks(weddingId),
      getWeddingBudgetItems(weddingId),
      getWeddingVendors(weddingId),
      getWeddingGuests(weddingId),
      getWeddingRundown(weddingId),
    ]);

    const payload: WorkspaceExportPayload = {
      wedding: workspace,
      ceremonies,
      banten,
      tasks,
      budget,
      vendors: vendorResult.vendors,
      rundown: rundownResult.events,
      guests: guestResult.guests,
      exportedAt: new Date().toISOString(),
      system: "Patemon Bali Hindu Wedding Planner v1 MVP",
    };

    return {
      success: true,
      data: payload,
    };
  } catch (err: unknown) {
    const message =
      err instanceof Error
        ? err.message
        : "Gagal mengambil data workspace untuk ekspor.";
    return {
      success: false,
      error: message,
    };
  }
}

export interface OfflinePackResult {
  success: boolean;
  html?: string;
  filename?: string;
  exportedAt?: string;
  error?: string;
}

/**
 * Generates an offline self-contained HTML day-of packet (Issue #89).
 * Fail-closed authorization: only active workspace members may generate the offline file.
 * Excludes sensitive personal guest details, auth keys, and session tokens.
 */
export async function generateOfflineDayOfPackAction(
  weddingId: string,
  options: OfflinePackOptions
): Promise<OfflinePackResult> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user && weddingId !== "demo") {
      return {
        success: false,
        error: "Autentikasi diperlukan untuk mengunduh paket hari-H offline.",
      };
    }

    const { workspace, role } = await getWeddingWorkspace(weddingId);
    if (!workspace || !role) {
      return {
        success: false,
        error:
          "Akses ditolak: Anda bukan anggota pada ruang kerja pawiwahan ini.",
      };
    }

    // Fetch required modules according to selected options
    const [banten, tasks, rundownResult] = await Promise.all([
      options.includeBanten
        ? getWeddingBantenItems(weddingId)
        : Promise.resolve([]),
      options.includeChecklistTasks || options.includePicContacts
        ? getWeddingTasks(weddingId)
        : Promise.resolve([]),
      options.includeRundown || options.includePicContacts
        ? getWeddingRundown(weddingId)
        : Promise.resolve({ events: [] }),
    ]);

    const now = new Date();
    const timeWita = getCurrentTimeWita();
    const dateFormatted = new Intl.DateTimeFormat("id-ID", {
      timeZone: "Asia/Makassar",
      dateStyle: "full",
    }).format(now);
    const generatedAtWita = `${dateFormatted}, ${timeWita}`;

    const packData: OfflinePackData = {
      weddingTitle: `Pawiwahan ${workspace.coupleNames}`,
      coupleNames: workspace.coupleNames,
      prospectiveDate: workspace.prospectiveDate,
      location:
        workspace.locationRegion || workspace.notes || "Kediaman Mempelai",
      generatedAtWita,
      rundownEvents: rundownResult.events,
      bantenItems: banten,
      tasks,
    };

    const html = generateOfflineHtmlPack(packData, options);

    const safeSlug =
      workspace.coupleNames
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)+/g, "") || "pawiwahan";

    const filename = `patemon-paket-hari-h-${safeSlug}.html`;

    return {
      success: true,
      html,
      filename,
      exportedAt: generatedAtWita,
    };
  } catch (err: unknown) {
    const message =
      err instanceof Error
        ? err.message
        : "Gagal menyusun paket hari-H offline.";
    return {
      success: false,
      error: message,
    };
  }
}
