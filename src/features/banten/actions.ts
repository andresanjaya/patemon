"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { captureError } from "@/lib/observability/logger";
import { getRitualCatalog } from "./queries";
import type {
  BantenAcquisitionStatus,
  BantenItem,
  SourcingMethod,
} from "./types";

export interface CreateBantenItemInput {
  name: string;
  category: string;
  quantity: number;
  unit: string;
  sourcingMethod: SourcingMethod;
  status?: BantenAcquisitionStatus;
  ceremonyId?: string | null;
  assigneeName?: string | null;
  estimatedPrice?: number;
  actualPrice?: number;
  notes?: string | null;
}

export interface UpdateBantenItemInput {
  name: string;
  category: string;
  quantity: number;
  unit: string;
  sourcingMethod: SourcingMethod;
  status: BantenAcquisitionStatus;
  ceremonyId?: string | null;
  assigneeName?: string | null;
  estimatedPrice: number;
  actualPrice: number;
  notes?: string | null;
}

const DEMO_BANTEN_ITEMS: BantenItem[] = [
  {
    id: "demo-banten-1",
    weddingId: "demo",
    ceremonyId: "demo-ceremony-2",
    ceremonyTitle: "Mebyakala / Pabyakalaan",
    catalogId: "BN-PKT-001",
    name: "Paket Banten Mebyakala Lengkap",
    category: "utama",
    quantity: 1,
    unit: "Paket",
    sourcingMethod: "purchased_package",
    status: "ready",
    assigneeName: "Serati Griya Sanur",
    estimatedPrice: 450000,
    actualPrice: 450000,
    notes:
      "Lengkap dengan sanggah cucuk, ayam brumbun, dan tetabuhan arak-berem.",
  },
  {
    id: "demo-banten-2",
    weddingId: "demo",
    ceremonyId: "demo-ceremony-2",
    ceremonyTitle: "Mebyakala / Pabyakalaan",
    catalogId: "BN-SAT-002",
    name: "Banten Prayascita Luwih",
    category: "madya",
    quantity: 1,
    unit: "Paket",
    sourcingMethod: "purchased_package",
    status: "ordered",
    assigneeName: "Serati Griya Sanur",
    estimatedPrice: 350000,
    actualPrice: 350000,
    notes: "Penyucian sarwa prani dan perlengkapan sembahyang penganten.",
  },
  {
    id: "demo-banten-3",
    weddingId: "demo",
    ceremonyId: "demo-ceremony-2",
    ceremonyTitle: "Mebyakala / Pabyakalaan",
    catalogId: "BN-SAT-003",
    name: "Banten Durmanggala",
    category: "sarana_pelengkap",
    quantity: 1,
    unit: "Paket",
    sourcingMethod: "self_made",
    status: "making",
    assigneeName: "Ibu & Tante Mempelai",
    estimatedPrice: 150000,
    actualPrice: 120000,
    notes: "Dibuat bersama keluarga besar saat mareresik.",
  },
  {
    id: "demo-banten-4",
    weddingId: "demo",
    ceremonyId: "demo-ceremony-4",
    ceremonyTitle: "Mesakapan / Pawiwahan Ring Sanggah Kamulan",
    catalogId: "BN-PKT-003",
    name: "Paket Banten Pawiwahan Sanggah Kamulan",
    category: "utama",
    quantity: 1,
    unit: "Paket",
    sourcingMethod: "purchased_package",
    status: "ordered",
    assigneeName: "Griya Pedanda Gede",
    estimatedPrice: 1250000,
    actualPrice: 1250000,
    notes: "Penyatuan di hadapan Hyang Guru dan Bhatara Hyang Kamulan.",
  },
  {
    id: "demo-banten-5",
    weddingId: "demo",
    ceremonyId: "demo-ceremony-3",
    ceremonyTitle: "Madengen-dengen / Metegen-tegenan",
    catalogId: "BN-SRN-001",
    name: "Perlengkapan Tegen-tegenan & Suun-suunan",
    category: "sarana_pelengkap",
    quantity: 1,
    unit: "Set",
    sourcingMethod: "family_assigned",
    status: "needed",
    assigneeName: "Keluarga Purusa (Bli Wayan)",
    estimatedPrice: 250000,
    actualPrice: 0,
    notes: "Kukusan, tebu, pala gantung, pala bungkah, dan bakul belanja.",
  },
  {
    id: "demo-banten-6",
    weddingId: "demo",
    ceremonyId: "demo-ceremony-4",
    ceremonyTitle: "Mesakapan / Pawiwahan Ring Sanggah Kamulan",
    catalogId: "BN-SRN-002",
    name: "Kelapa Gading Kembar",
    category: "sarana_pelengkap",
    quantity: 2,
    unit: "Bungkul",
    sourcingMethod: "family_assigned",
    status: "ready",
    assigneeName: "Paman Klungkung",
    estimatedPrice: 75000,
    actualPrice: 60000,
    notes: "Diukir gambar Sang Hyang Semara Ratih.",
  },
  {
    id: "demo-banten-7",
    weddingId: "demo",
    ceremonyId: "demo-ceremony-4",
    ceremonyTitle: "Mesakapan / Pawiwahan Ring Sanggah Kamulan",
    catalogId: "BN-SAT-004",
    name: "Banten Pejati Lengkap",
    category: "madya",
    quantity: 4,
    unit: "Tanding",
    sourcingMethod: "self_made",
    status: "making",
    assigneeName: "Sekaa Ibu-ibu Banjar",
    estimatedPrice: 400000,
    actualPrice: 280000,
    notes: "Untuk Merajan Kamulan, Lebuh, Sanggah Surya, dan Penganten.",
  },
  {
    id: "demo-banten-8",
    weddingId: "demo",
    ceremonyId: null,
    ceremonyTitle: "Kebutuhan Umum Seluruh Acara",
    catalogId: "BN-SRN-005",
    name: "Canang Sari & Segehan Panca Warna",
    category: "sarana_pelengkap",
    quantity: 50,
    unit: "Tanding",
    sourcingMethod: "self_made",
    status: "ready",
    assigneeName: "Sekaa Teruna-Teruni",
    estimatedPrice: 200000,
    actualPrice: 150000,
    notes: "Untuk penjagaan lebuh dan pembersihan pekarangan harian.",
  },
];

/**
 * Fetch all banten and ritual items planned for a wedding workspace.
 */
export async function getWeddingBantenItems(
  weddingId: string
): Promise<BantenItem[]> {
  if (weddingId === "demo") {
    return DEMO_BANTEN_ITEMS;
  }

  try {
    const supabase = await createClient();

    // 1. Fetch ceremonies to build title map
    const { data: ceremonies } = await supabase
      .from("wedding_ceremonies")
      .select("id, title")
      .eq("wedding_id", weddingId)
      .is("deleted_at", null);

    const ceremonyMap = new Map<string, string>();
    (ceremonies || []).forEach((c) => ceremonyMap.set(c.id, c.title));

    // 2. Fetch ritual items
    const { data, error } = await supabase
      .from("wedding_ritual_items")
      .select("*")
      .eq("wedding_id", weddingId)
      .is("deleted_at", null)
      .order("created_at", { ascending: true });

    if (error || !data) {
      return [];
    }

    return data.map((item) => ({
      id: item.id,
      weddingId: item.wedding_id,
      ceremonyId: item.ceremony_id,
      ceremonyTitle: item.ceremony_id
        ? ceremonyMap.get(item.ceremony_id) || "Prosesi Terkait"
        : "Kebutuhan Umum",
      catalogId: item.catalog_id,
      name: item.name,
      category: item.category || "sarana_pelengkap",
      quantity: Number(item.quantity) || 1,
      unit: item.unit || "Paket",
      sourcingMethod:
        (item.sourcing_method as SourcingMethod) || "purchased_package",
      status: (item.status as BantenAcquisitionStatus) || "needed",
      assigneeName: item.assignee_name,
      estimatedPrice: Number(item.estimated_price) || 0,
      actualPrice: Number(item.actual_price) || 0,
      notes: item.notes,
      createdAt: item.created_at,
      updatedAt: item.updated_at,
    }));
  } catch (err) {
    captureError(err, { action: "getWeddingBantenItems", weddingId });
    return [];
  }
}

/**
 * Server action to create a new banten item for a wedding workspace.
 */
export async function createBantenItemAction(
  weddingId: string,
  input: CreateBantenItemInput
): Promise<{ success: boolean; message?: string; itemId?: string }> {
  if (weddingId === "demo") {
    return {
      success: true,
      message: "Banten berhasil ditambahkan dalam mode demo.",
      itemId: "demo-banten-" + Date.now(),
    };
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, message: "Sesi login tidak ditemukan." };
    }

    const { data, error } = await supabase
      .from("wedding_ritual_items")
      .insert({
        wedding_id: weddingId,
        ceremony_id: input.ceremonyId || null,
        name: input.name.trim(),
        category: input.category || "sarana_pelengkap",
        quantity: Number(input.quantity) || 1,
        unit: input.unit || "Paket",
        sourcing_method: input.sourcingMethod || "purchased_package",
        status: input.status || "needed",
        assignee_name: input.assigneeName?.trim() || null,
        estimated_price: Number(input.estimatedPrice) || 0,
        actual_price: Number(input.actualPrice) || 0,
        notes: input.notes?.trim() || null,
      })
      .select("id")
      .single();

    if (error || !data) {
      return {
        success: false,
        message: error?.message || "Gagal menambahkan item banten.",
      };
    }

    await supabase.from("activity_logs").insert({
      wedding_id: weddingId,
      user_id: user.id,
      action: "banten.created",
      entity_type: "wedding_ritual_items",
      entity_id: data.id,
      details: { name: input.name, quantity: input.quantity, unit: input.unit },
    });

    revalidatePath(`/workspace/${weddingId}`);
    revalidatePath(`/workspace/${weddingId}/banten`);
    if (input.ceremonyId) {
      revalidatePath(`/workspace/${weddingId}/ceremonies/${input.ceremonyId}`);
    }

    return {
      success: true,
      message: "Item banten berhasil ditambahkan.",
      itemId: data.id,
    };
  } catch (err) {
    captureError(err, { action: "createBantenItemAction", weddingId });
    return {
      success: false,
      message: "Terjadi kesalahan sistem saat menyimpan item banten.",
    };
  }
}

/**
 * Server action to update an existing banten item.
 */
export async function updateBantenItemAction(
  weddingId: string,
  itemId: string,
  input: UpdateBantenItemInput
): Promise<{ success: boolean; message?: string }> {
  if (weddingId === "demo") {
    return {
      success: true,
      message: "Perubahan banten tersimpan dalam mode demo.",
    };
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, message: "Sesi login tidak ditemukan." };
    }

    const { error } = await supabase
      .from("wedding_ritual_items")
      .update({
        ceremony_id: input.ceremonyId || null,
        name: input.name.trim(),
        category: input.category,
        quantity: Number(input.quantity) || 1,
        unit: input.unit,
        sourcing_method: input.sourcingMethod,
        status: input.status,
        assignee_name: input.assigneeName?.trim() || null,
        estimated_price: Number(input.estimatedPrice) || 0,
        actual_price: Number(input.actualPrice) || 0,
        notes: input.notes?.trim() || null,
      })
      .eq("id", itemId)
      .eq("wedding_id", weddingId);

    if (error) {
      return { success: false, message: error.message };
    }

    await supabase.from("activity_logs").insert({
      wedding_id: weddingId,
      user_id: user.id,
      action: "banten.updated",
      entity_type: "wedding_ritual_items",
      entity_id: itemId,
      details: { name: input.name, status: input.status },
    });

    revalidatePath(`/workspace/${weddingId}`);
    revalidatePath(`/workspace/${weddingId}/banten`);
    if (input.ceremonyId) {
      revalidatePath(`/workspace/${weddingId}/ceremonies/${input.ceremonyId}`);
    }

    return {
      success: true,
      message: "Perubahan item banten berhasil disimpan.",
    };
  } catch (err) {
    captureError(err, { action: "updateBantenItemAction", itemId });
    return {
      success: false,
      message: "Gagal memperbarui item banten.",
    };
  }
}

/**
 * Server action to soft-delete a banten item.
 */
export async function deleteBantenItemAction(
  weddingId: string,
  itemId: string
): Promise<{ success: boolean; message?: string }> {
  if (weddingId === "demo") {
    return { success: true, message: "Item banten dihapus dalam mode demo." };
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, message: "Sesi login tidak ditemukan." };
    }

    const { error } = await supabase
      .from("wedding_ritual_items")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", itemId)
      .eq("wedding_id", weddingId);

    if (error) {
      return { success: false, message: error.message };
    }

    await supabase.from("activity_logs").insert({
      wedding_id: weddingId,
      user_id: user.id,
      action: "banten.deleted",
      entity_type: "wedding_ritual_items",
      entity_id: itemId,
    });

    revalidatePath(`/workspace/${weddingId}`);
    revalidatePath(`/workspace/${weddingId}/banten`);

    return { success: true, message: "Item banten berhasil dihapus." };
  } catch (err) {
    captureError(err, { action: "deleteBantenItemAction", itemId });
    return { success: false, message: "Gagal menghapus item banten." };
  }
}

/**
 * Server action to update banten acquisition status.
 */
export async function updateBantenStatusAction(
  weddingId: string,
  itemId: string,
  status: BantenAcquisitionStatus
): Promise<{ success: boolean; message?: string }> {
  if (weddingId === "demo") {
    return {
      success: true,
      message: "Status banten diperbarui dalam mode demo.",
    };
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from("wedding_ritual_items")
      .update({ status })
      .eq("id", itemId)
      .eq("wedding_id", weddingId);

    if (error) {
      return { success: false, message: error.message };
    }

    revalidatePath(`/workspace/${weddingId}`);
    revalidatePath(`/workspace/${weddingId}/banten`);
    return { success: true, message: "Status berhasil diperbarui." };
  } catch (err) {
    captureError(err, { action: "updateBantenStatusAction", itemId });
    return { success: false, message: "Gagal memperbarui status banten." };
  }
}

/**
 * Server action to import items from the canonical ritual catalog into the wedding workspace.
 */
export async function importFromCatalogAction(
  weddingId: string,
  catalogIds: string[],
  ceremonyId?: string | null
): Promise<{ success: boolean; message?: string; importedCount?: number }> {
  if (weddingId === "demo") {
    return {
      success: true,
      message: `${catalogIds.length} item banten berhasil diimpor dari pustaka (mode demo).`,
      importedCount: catalogIds.length,
    };
  }

  if (!catalogIds || catalogIds.length === 0) {
    return { success: false, message: "Pilih minimal 1 banten dari katalog." };
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, message: "Sesi login tidak ditemukan." };
    }

    // 1. Fetch catalog metadata
    const catalog = await getRitualCatalog();
    const selectedCatalogItems = catalog.filter((c) =>
      catalogIds.includes(c.id)
    );

    const itemsToInsert = selectedCatalogItems.map((c) => {
      // Determine sourcing method default
      let sourcingMethod: SourcingMethod = "purchased_package";
      if (
        c.defaultProvider?.toLowerCase().includes("ngayah") ||
        c.defaultProvider?.toLowerCase().includes("sendiri")
      ) {
        sourcingMethod = "self_made";
      } else if (c.defaultProvider?.toLowerCase().includes("keluarga")) {
        sourcingMethod = "family_assigned";
      }

      // Determine category
      let category = "sarana_pelengkap";
      if (c.itemType === "Paket Banten") {
        category = "utama";
      } else if (c.itemType === "Banten Satuan") {
        category = "madya";
      }

      return {
        wedding_id: weddingId,
        ceremony_id: ceremonyId || null,
        catalog_id: c.id,
        name: c.name,
        category,
        quantity: c.defaultQuantity ? Number(c.defaultQuantity) : 1,
        unit: c.unit || "Paket",
        sourcing_method: sourcingMethod,
        status: "needed" as const,
        assignee_name: c.defaultProvider || null,
        estimated_price: 0,
        actual_price: 0,
        notes: c.notes || null,
      };
    });

    const { error: insertError } = await supabase
      .from("wedding_ritual_items")
      .insert(itemsToInsert);

    if (insertError) {
      return { success: false, message: insertError.message };
    }

    await supabase.from("activity_logs").insert({
      wedding_id: weddingId,
      user_id: user.id,
      action: "banten.catalog_imported",
      entity_type: "wedding_ritual_items",
      entity_id: weddingId,
      details: {
        imported_count: itemsToInsert.length,
        catalog_ids: catalogIds,
      },
    });

    revalidatePath(`/workspace/${weddingId}`);
    revalidatePath(`/workspace/${weddingId}/banten`);
    if (ceremonyId) {
      revalidatePath(`/workspace/${weddingId}/ceremonies/${ceremonyId}`);
    }

    return {
      success: true,
      message: `${itemsToInsert.length} banten berhasil ditambahkan dari pustaka katalog.`,
      importedCount: itemsToInsert.length,
    };
  } catch (err) {
    captureError(err, { action: "importFromCatalogAction", weddingId });
    return {
      success: false,
      message: "Terjadi kesalahan sistem saat mengimpor banten dari katalog.",
    };
  }
}
