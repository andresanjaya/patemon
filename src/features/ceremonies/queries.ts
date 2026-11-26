import { createClient } from "@/lib/supabase/server";
import { captureError } from "@/lib/observability/logger";
import { DEFAULT_CEREMONY_TEMPLATES } from "./seeds";
import type { CeremonyTemplate } from "./types";

export interface CeremonyFilter {
  phase?: string;
  applicability?: string;
}

/**
 * Fetch ceremony templates from Supabase with graceful fallback to curated in-memory seeds.
 */
export async function getCeremonyTemplates(
  filter?: CeremonyFilter,
  useDemoData = false
): Promise<CeremonyTemplate[]> {
  let templates = DEFAULT_CEREMONY_TEMPLATES;
  if (!useDemoData) {
    try {
      const supabase = await createClient();
      let query = supabase
        .from("ceremony_templates")
        .select("*")
        .eq("is_active", true)
        .order("order_index", { ascending: true });

      if (filter?.phase) {
        query = query.eq("phase", filter.phase);
      }

      const { data, error } = await query;

      if (!error && data && data.length > 0) {
        const stored = data.map((item) => ({
          id: item.id,
          phase: item.phase,
          name: item.name,
          aliases: item.aliases || [],
          description: item.description || "",
          applicability: item.applicability,
          defaultPic: item.default_pic,
          validationStatus: item.validation_status,
          sourceId: item.source_id,
          sourceUrl: item.source_url,
          orderIndex: item.order_index,
          isActive: item.is_active,
        }));
        templates = [
          ...new Map(
            [...stored, ...DEFAULT_CEREMONY_TEMPLATES].map((item) => [
              item.id,
              item,
            ])
          ).values(),
        ];
      }
    } catch (err) {
      captureError(err, { action: "getCeremonyTemplates" });
    }
  }

  // Graceful fallback to versioned curated seeds
  if (filter?.phase) {
    templates = templates.filter((t) => t.phase === filter.phase);
  }
  if (filter?.applicability && filter.applicability !== "Umum") {
    templates = templates.filter(
      (t) =>
        t.id.startsWith("XL-") ||
        t.applicability === "Umum" ||
        t.applicability === filter.applicability
    );
  }
  return templates;
}
