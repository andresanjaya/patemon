import workbook from "./wedding-master-data.json";
import type { CeremonyTemplate } from "@/features/ceremonies/types";
import type {
  RitualCatalogItem,
  SourceCitation,
} from "@/features/banten/types";
import type { TaskTemplate } from "@/features/checklist/types";
import type { BudgetItemTemplate } from "@/features/budget/types";
import type { VendorTemplate } from "@/features/vendors/types";

// Keep workbook IDs separate: existing PR-/BN- IDs already reference different legacy records.
export const MASTER_SOURCES: SourceCitation[] = workbook.Sumber.slice(1).map(
  (r) => ({
    id: `XL-${r.A}`,
    title: r.B,
    sourceType: r.C,
    usageNotes: r.D,
    sourceUrl: r.E,
  })
);

export const MASTER_CEREMONIES: CeremonyTemplate[] = workbook.Prosesi.slice(
  1
).map((r, index) => ({
  id: `XL-${r.A}`,
  phase: r.B,
  name: r.C,
  aliases: [],
  description: r.D,
  applicability: r.E,
  defaultPic: r.F,
  validationStatus: r.G,
  sourceId: MASTER_SOURCES.find((s) => s.sourceUrl === r.H)?.id ?? null,
  sourceUrl: r.H,
  orderIndex: index + 1,
  isActive: true,
}));

export const MASTER_BANTEN: RitualCatalogItem[] = workbook.Banten_Sarana.slice(
  1
).map((r) => ({
  id: `XL-${r.A}`,
  itemType: r.B,
  name: r.C,
  usedInPhase: r.D,
  notes: r.E,
  obligationLevel: r.F,
  defaultQuantity: r.G ? Number(r.G) : null,
  unit: r.H,
  defaultProvider: r.I || null,
  validationStatus: r.K,
  sourceId: MASTER_SOURCES.find((s) => s.sourceUrl === r.L)?.id ?? null,
  sourceUrl: r.L,
  isActive: true,
}));

export const MASTER_TASKS: TaskTemplate[] = workbook.Checklist.slice(1).map(
  (r) => ({
    id: `XL-${r.A}`,
    phase: r.B,
    targetTimeline: r.C,
    category: /adat|banten/i.test(r.D)
      ? "adat"
      : /administrasi/i.test(r.D)
        ? "administrasi"
        : /busana|rias/i.test(r.D)
          ? "busana"
          : /konsumsi/i.test(r.D)
            ? "konsumsi"
            : /anggaran|keuangan/i.test(r.D)
              ? "keuangan"
              : /dokumentasi|media/i.test(r.D)
                ? "dokumentasi"
                : /logistik|operasional/i.test(r.D)
                  ? "logistik"
                  : "umum",
    title: r.E,
    defaultPic: r.F,
    applicability: r.G,
    priority: r.H === "High" ? "high" : "medium",
    notes: `${r.D} · ${r.C}. ${r.J}`,
    sourceUrl: r.K,
  })
);

export const MASTER_BUDGET: BudgetItemTemplate[] = workbook.Anggaran.slice(
  1
).map((r) => ({
  id: `XL-${r.A}`,
  category: /banten|sarana|adat/i.test(r.C)
    ? "upakara"
    : /busana/i.test(r.C)
      ? "busana_rias"
      : /konsumsi/i.test(r.C)
        ? "konsumsi"
        : /tempat/i.test(r.C)
          ? "tempat_dekorasi"
          : /administrasi/i.test(r.C)
            ? "administrasi"
            : "lainnya",
  title: r.D,
  unit: r.E,
  defaultQty: r.F ? Number(r.F) : 1,
  estimatedPrice: r.G ? Number(r.G) : 0,
  defaultPaidBy: r.K,
  notes: `${r.B} · ${r.C}. ${r.M}. Harga belum dihitung; sesuaikan penawaran nyata.`,
}));

export const MASTER_VENDORS: VendorTemplate[] = workbook.Vendor_PIC.slice(
  1
).map((r) => ({
  id: `XL-${r.A}`,
  category: /serati|pemangku/i.test(r.B)
    ? "banten_serati"
    : /foto|video|content/i.test(r.B)
      ? "fotografi_videografi"
      : /payas|busana/i.test(r.B)
        ? "busana_rias"
        : /catering/i.test(r.B)
          ? "katering_mebat"
          : /dekorasi|tenda/i.test(r.B)
            ? "dekorasi_tenda"
            : /sound|gamelan/i.test(r.B)
              ? "musik_sound_gong"
              : /venue/i.test(r.B)
                ? "venue_bale"
                : /undangan|souvenir/i.test(r.B)
                  ? "undangan_souvenir"
                  : "lainnya",
  name: r.B,
  recommendedScope: r.B,
  estimatedQuoteRange: "Belum ada penawaran",
  notes: r.I,
  defaultPicRole: r.G,
}));
