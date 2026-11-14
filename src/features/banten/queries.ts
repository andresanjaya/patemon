import { createClient } from "@/lib/supabase/server";
import { captureError } from "@/lib/observability/logger";
import { DEFAULT_RITUAL_CATALOG, DEFAULT_SOURCES } from "./seeds";
import type { RitualCatalogItem, SourceCitation } from "./types";

export interface RitualFilter {
  itemType?: string;
  phase?: string;
  isPackage?: boolean;
}

/**
 * Fetch ritual catalog items with fallback to curated in-memory seeds.
 */
export async function getRitualCatalog(
  filter?: RitualFilter
): Promise<RitualCatalogItem[]> {
  try {
    const supabase = await createClient();
    let query = supabase
      .from("ritual_catalog")
      .select("*")
      .eq("is_active", true);

    if (filter?.itemType) {
      query = query.eq("item_type", filter.itemType);
    }
    if (filter?.phase) {
      query = query.eq("used_in_phase", filter.phase);
    }

    const { data, error } = await query;

    if (!error && data && data.length > 0) {
      return data.map((item) => ({
        id: item.id,
        itemType: item.item_type,
        name: item.name,
        usedInPhase: item.used_in_phase,
        notes: item.notes,
        obligationLevel: item.obligation_level,
        defaultQuantity: item.default_quantity
          ? Number(item.default_quantity)
          : null,
        unit: item.unit,
        defaultProvider: item.default_provider,
        validationStatus: item.validation_status,
        sourceId: item.source_id,
        sourceUrl: item.source_url,
        isActive: item.is_active,
      }));
    }
  } catch (err) {
    captureError(err, { action: "getRitualCatalog" });
  }

  // Graceful fallback to versioned curated seeds
  let items = DEFAULT_RITUAL_CATALOG;
  if (filter?.itemType) {
    items = items.filter((i) => i.itemType === filter.itemType);
  }
  if (filter?.phase) {
    items = items.filter((i) => i.usedInPhase === filter.phase);
  }
  if (filter?.isPackage !== undefined) {
    items = items.filter((i) =>
      filter.isPackage
        ? i.itemType === "Paket Banten"
        : i.itemType !== "Paket Banten"
    );
  }
  return items;
}

/**
 * Fetch bibliographic sources and citations.
 */
export async function getSources(): Promise<SourceCitation[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.from("sources").select("*");

    if (!error && data && data.length > 0) {
      return data.map((s) => ({
        id: s.id,
        title: s.title,
        sourceType: s.source_type,
        usageNotes: s.usage_notes,
        sourceUrl: s.source_url,
      }));
    }
  } catch (err) {
    captureError(err, { action: "getSources" });
  }

  return DEFAULT_SOURCES;
}
