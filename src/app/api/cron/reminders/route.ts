/**
 * Automated Cron Endpoint for Deadline Reminders (Issue #84)
 * Triggered daily (e.g. 08:00 WITA) by Vercel Cron or external scheduler.
 * Enforces strict CRON_SECRET authorization.
 */

import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { logger } from "@/lib/observability/logger";
import { evaluateAndDispatchReminders } from "@/features/reminders/engine";

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    // Fail-closed authorization check
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      logger.warn("Unauthorized attempt to access /api/cron/reminders", {
        hasAuthHeader: !!authHeader,
      });
      return NextResponse.json(
        { error: "Unauthorized: Invalid or missing CRON_SECRET" },
        { status: 401 }
      );
    }

    const supabaseAdmin = createAdminClient();

    // Fetch active workspaces
    let { data: workspaces, error } = await supabaseAdmin
      .from("weddings")
      .select("id, couple_names, is_frozen, deleted_at")
      .eq("is_frozen", false)
      .is("deleted_at", null);

    if (error && (error.code === "42703" || error.message?.includes("is_frozen"))) {
      const fallbackQuery = await supabaseAdmin
        .from("weddings")
        .select("id, couple_names, deleted_at")
        .is("deleted_at", null);
      workspaces = fallbackQuery.data as typeof workspaces;
      error = fallbackQuery.error;
    }

    if (error) {
      logger.error("Failed to fetch workspaces for reminder cron", {
        error: error.message,
      });
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const results = [];
    let totalDispatched = 0;
    let totalSkipped = 0;
    let totalFailed = 0;

    for (const ws of workspaces || []) {
      const res = await evaluateAndDispatchReminders({
        weddingId: ws.id,
      });

      totalDispatched += res.dispatched;
      totalSkipped += res.skipped;
      totalFailed += res.failed;

      results.push({
        weddingId: ws.id,
        dispatched: res.dispatched,
        skipped: res.skipped,
        failed: res.failed,
      });
    }

    logger.info("Cron deadline reminder scan completed", {
      totalWorkspaces: (workspaces || []).length,
      totalDispatched,
      totalSkipped,
      totalFailed,
    });

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      summary: {
        totalWorkspaces: (workspaces || []).length,
        totalDispatched,
        totalSkipped,
        totalFailed,
      },
      workspaces: results,
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    logger.error("Unexpected error in /api/cron/reminders", {
      error: errorMsg,
    });
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
