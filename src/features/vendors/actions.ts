"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { captureError } from "@/lib/observability/logger";
import { getWorkspaceEntitlement } from "@/features/payments/entitlements";
import {
  normalizeWorkspaceId,
  isValidWorkspaceId,
} from "@/features/workspaces/validation";
import { getPreviewVendors } from "@/features/preview/preview-data";
import type { Database } from "@/types/database";
import {
  calculateVendorStats,
  DEMO_VENDORS,
  STARTER_VENDOR_TEMPLATES,
} from "./seeds";
import type {
  CreateVendorInput,
  LinkedBudgetItemSummary,
  UpdateVendorInput,
  Vendor,
  VendorStats,
  VendorStatus,
} from "./types";

type VendorInsert = Database["public"]["Tables"]["vendors"]["Insert"];
type VendorUpdate = Database["public"]["Tables"]["vendors"]["Update"];

function mapVendorCategoryToBudgetCategory(vendorCategory: string): string {
  switch (vendorCategory) {
    case "banten_serati":
      return "upakara";
    case "busana_rias":
      return "busana_rias";
    case "fotografi_videografi":
      return "dokumentasi";
    case "dekorasi_tenda":
      return "tempat_dekorasi";
    case "katering_mebat":
      return "konsumsi";
    case "musik_sound_gong":
      return "musik_hiburan";
    case "venue_bale":
      return "tempat_dekorasi";
    case "undangan_souvenir":
      return "administrasi";
    default:
      return "lainnya";
  }
}

/**
 * Fetch all vendors and their linked budget/payment summaries for a wedding workspace.
 */
export async function getWeddingVendors(
  weddingId: string
): Promise<{ vendors: Vendor[]; stats: VendorStats }> {
  const cleanId = normalizeWorkspaceId(weddingId);
  if (!isValidWorkspaceId(cleanId)) {
    return {
      vendors: [],
      stats: calculateVendorStats([]),
    };
  }

  if (cleanId === "demo") {
    return getPreviewVendors("demo");
  }

  try {
    const supabase = await createClient();

    // 1. Fetch vendors
    const { data: vendorsData, error: vendorsError } = await supabase
      .from("vendors")
      .select("*")
      .eq("wedding_id", cleanId)
      .is("deleted_at", null)
      .order("created_at", { ascending: true });

    if (vendorsError || !vendorsData || vendorsData.length === 0) {
      if (vendorsError) {
        captureError(vendorsError, {
          action: "getWeddingVendors",
          weddingId: cleanId,
        });
      }
      const entitlement = await getWorkspaceEntitlement(cleanId, supabase);
      if (!entitlement.isPaid) {
        return getPreviewVendors(cleanId);
      }
      return {
        vendors: [],
        stats: calculateVendorStats([]),
      };
    }

    // 2. Fetch linked budget items and payments to compute due payments
    const { data: budgetData } = await supabase
      .from("budget_items")
      .select(
        "id, title, planned_amount, actual_amount, status, linked_vendor_id"
      )
      .eq("wedding_id", cleanId)
      .is("deleted_at", null);

    const { data: paymentsData } = await supabase
      .from("budget_payments")
      .select("budget_item_id, amount")
      .eq("wedding_id", cleanId);

    const paymentsByItem = new Map<string, number>();
    (paymentsData || []).forEach((p) => {
      const current = paymentsByItem.get(p.budget_item_id) || 0;
      paymentsByItem.set(p.budget_item_id, current + Math.round(p.amount));
    });

    const budgetItemsByVendor = new Map<string, LinkedBudgetItemSummary[]>();
    (budgetData || []).forEach((item) => {
      if (!item.linked_vendor_id) return;
      const paid = paymentsByItem.get(item.id) || 0;
      const list = budgetItemsByVendor.get(item.linked_vendor_id) || [];
      list.push({
        id: item.id,
        title: item.title,
        plannedAmount: Math.round(item.planned_amount),
        actualAmount: Math.round(item.actual_amount),
        paidAmount: paid,
        status: item.status,
      });
      budgetItemsByVendor.set(item.linked_vendor_id, list);
    });

    // 3. Assemble vendors with financial calculations
    const vendors: Vendor[] = vendorsData.map((v) => {
      const linked = budgetItemsByVendor.get(v.id) || [];
      const quoteAmount = Math.round(v.quote_amount || 0);

      let agreedAmount = quoteAmount;
      let paidAmount = 0;

      if (linked.length > 0) {
        agreedAmount = linked.reduce(
          (sum, i) =>
            sum + (i.actualAmount > 0 ? i.actualAmount : i.plannedAmount),
          0
        );
        paidAmount = linked.reduce((sum, i) => sum + i.paidAmount, 0);
      }

      const dueAmount = Math.max(0, agreedAmount - paidAmount);

      return {
        id: v.id,
        weddingId: v.wedding_id,
        category: v.category,
        name: v.name,
        contactPerson: v.contact_person,
        phone: v.phone,
        socialLink: v.social_link,
        quoteAmount,
        status: v.status as VendorStatus,
        picName: v.pic_name,
        notes: v.notes,
        createdAt: v.created_at,
        updatedAt: v.updated_at,
        agreedAmount,
        paidAmount,
        dueAmount,
        linkedBudgetItems: linked,
      };
    });

    return {
      vendors,
      stats: calculateVendorStats(vendors),
    };
  } catch (err) {
    captureError(err, { action: "getWeddingVendors", weddingId });
    return {
      vendors: [],
      stats: calculateVendorStats([]),
    };
  }
}

/**
 * Create a new vendor contact.
 */
export async function createVendorAction(
  weddingId: string,
  input: CreateVendorInput
): Promise<{ success: boolean; vendor?: Vendor; error?: string }> {
  if (!input.name?.trim()) {
    return {
      success: false,
      error: "Nama vendor / penyedia jasa wajib diisi.",
    };
  }

  const quoteAmount =
    input.quoteAmount && input.quoteAmount >= 0
      ? Math.round(input.quoteAmount)
      : 0;
  const status: VendorStatus = input.status || "prospect";

  if (weddingId === "demo") {
    const newVendor: Vendor = {
      id: `demo-v-${Date.now()}`,
      weddingId: "demo",
      category: input.category || "lainnya",
      name: input.name.trim(),
      contactPerson: input.contactPerson?.trim() || null,
      phone: input.phone?.trim() || null,
      socialLink: input.socialLink?.trim() || null,
      quoteAmount,
      status,
      picName: input.picName?.trim() || null,
      notes: input.notes?.trim() || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      agreedAmount: quoteAmount,
      paidAmount: 0,
      dueAmount: quoteAmount,
      linkedBudgetItems: [],
    };
    return { success: true, vendor: newVendor };
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return {
        success: false,
        error: "Anda harus login untuk menambah vendor.",
      };
    }

    const insertPayload: VendorInsert = {
      wedding_id: weddingId,
      category: input.category || "lainnya",
      name: input.name.trim(),
      contact_person: input.contactPerson?.trim() || null,
      phone: input.phone?.trim() || null,
      social_link: input.socialLink?.trim() || null,
      quote_amount: quoteAmount,
      status,
      pic_name: input.picName?.trim() || null,
      notes: input.notes?.trim() || null,
    };

    const { data: createdVendor, error: insertError } = await supabase
      .from("vendors")
      .insert(insertPayload)
      .select()
      .single();

    if (insertError || !createdVendor) {
      captureError(insertError, {
        action: "createVendorAction",
        weddingId,
        input,
      });
      return {
        success: false,
        error: insertError?.message || "Gagal menyimpan data vendor.",
      };
    }

    // Optional: create corresponding budget line item if requested
    if (input.createLinkedBudgetItem && quoteAmount > 0) {
      const budgetCategory = mapVendorCategoryToBudgetCategory(
        createdVendor.category
      );
      await supabase.from("budget_items").insert({
        wedding_id: weddingId,
        category: budgetCategory,
        title: `Vendor: ${createdVendor.name}`,
        unit: "Paket",
        quantity: 1,
        unit_price: quoteAmount,
        planned_amount: quoteAmount,
        actual_amount: quoteAmount,
        status: status === "booked" ? "booked" : "estimated",
        linked_vendor_id: createdVendor.id,
        notes: `Terkait rekanan ${createdVendor.name} (${input.contactPerson || "Kontak"})`,
      });
    }

    revalidatePath(`/workspace/${weddingId}/vendors`);
    revalidatePath(`/workspace/${weddingId}/budget`);
    revalidatePath(`/workspace/${weddingId}`);

    const resultVendor: Vendor = {
      id: createdVendor.id,
      weddingId: createdVendor.wedding_id,
      category: createdVendor.category,
      name: createdVendor.name,
      contactPerson: createdVendor.contact_person,
      phone: createdVendor.phone,
      socialLink: createdVendor.social_link,
      quoteAmount: Math.round(createdVendor.quote_amount),
      status: createdVendor.status as VendorStatus,
      picName: createdVendor.pic_name,
      notes: createdVendor.notes,
      createdAt: createdVendor.created_at,
      updatedAt: createdVendor.updated_at,
      agreedAmount: Math.round(createdVendor.quote_amount),
      paidAmount: 0,
      dueAmount: Math.round(createdVendor.quote_amount),
      linkedBudgetItems: [],
    };

    return { success: true, vendor: resultVendor };
  } catch (err) {
    captureError(err, { action: "createVendorAction", weddingId });
    return {
      success: false,
      error: "Terjadi kesalahan internal saat membuat vendor.",
    };
  }
}

/**
 * Update an existing vendor.
 */
export async function updateVendorAction(
  weddingId: string,
  vendorId: string,
  input: UpdateVendorInput
): Promise<{ success: boolean; error?: string }> {
  if (weddingId === "demo") {
    return { success: true };
  }

  try {
    const supabase = await createClient();
    const updatePayload: VendorUpdate = {};

    if (input.name !== undefined) updatePayload.name = input.name.trim();
    if (input.category !== undefined) updatePayload.category = input.category;
    if (input.contactPerson !== undefined)
      updatePayload.contact_person = input.contactPerson?.trim() || null;
    if (input.phone !== undefined)
      updatePayload.phone = input.phone?.trim() || null;
    if (input.socialLink !== undefined)
      updatePayload.social_link = input.socialLink?.trim() || null;
    if (input.quoteAmount !== undefined)
      updatePayload.quote_amount = Math.round(input.quoteAmount);
    if (input.status !== undefined) updatePayload.status = input.status;
    if (input.picName !== undefined)
      updatePayload.pic_name = input.picName?.trim() || null;
    if (input.notes !== undefined)
      updatePayload.notes = input.notes?.trim() || null;

    const { error } = await supabase
      .from("vendors")
      .update(updatePayload)
      .eq("id", vendorId)
      .eq("wedding_id", weddingId);

    if (error) {
      captureError(error, {
        action: "updateVendorAction",
        weddingId,
        vendorId,
      });
      return { success: false, error: error.message };
    }

    revalidatePath(`/workspace/${weddingId}/vendors`);
    revalidatePath(`/workspace/${weddingId}/budget`);
    revalidatePath(`/workspace/${weddingId}`);
    return { success: true };
  } catch (err) {
    captureError(err, { action: "updateVendorAction", weddingId, vendorId });
    return {
      success: false,
      error: "Terjadi kesalahan saat memperbarui vendor.",
    };
  }
}

/**
 * Quick status updater for vendor pipeline / kanban.
 */
export async function updateVendorStatusAction(
  weddingId: string,
  vendorId: string,
  status: VendorStatus
): Promise<{ success: boolean; error?: string }> {
  return updateVendorAction(weddingId, vendorId, { status });
}

/**
 * Soft delete a vendor.
 */
export async function deleteVendorAction(
  weddingId: string,
  vendorId: string
): Promise<{ success: boolean; error?: string }> {
  if (weddingId === "demo") {
    return { success: true };
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from("vendors")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", vendorId)
      .eq("wedding_id", weddingId);

    if (error) {
      captureError(error, {
        action: "deleteVendorAction",
        weddingId,
        vendorId,
      });
      return { success: false, error: error.message };
    }

    revalidatePath(`/workspace/${weddingId}/vendors`);
    revalidatePath(`/workspace/${weddingId}/budget`);
    revalidatePath(`/workspace/${weddingId}`);
    return { success: true };
  } catch (err) {
    captureError(err, { action: "deleteVendorAction", weddingId, vendorId });
    return { success: false, error: "Gagal menghapus data vendor." };
  }
}

/**
 * Import starter Balinese vendor templates into the wedding workspace.
 */
export async function importStarterVendorsAction(
  weddingId: string,
  templateIds?: string[]
): Promise<{ success: boolean; count?: number; error?: string }> {
  const templatesToImport =
    templateIds && templateIds.length > 0
      ? STARTER_VENDOR_TEMPLATES.filter((t) => templateIds.includes(t.id))
      : STARTER_VENDOR_TEMPLATES;

  if (weddingId === "demo") {
    return { success: true, count: templatesToImport.length };
  }

  try {
    const supabase = await createClient();
    const { data: existing, error: existingError } = await supabase
      .from("vendors")
      .select("name")
      .eq("wedding_id", weddingId)
      .is("deleted_at", null);
    if (existingError) return { success: false, error: existingError.message };
    const missing = templatesToImport.filter(
      (template) => !existing?.some((item) => item.name === template.name)
    );
    if (!missing.length) return { success: true, count: 0 };
    const rows: VendorInsert[] = missing.map((t) => ({
      wedding_id: weddingId,
      category: t.category,
      name: t.name,
      contact_person: null,
      phone: null,
      social_link: null,
      quote_amount: 0,
      status: "prospect",
      pic_name: t.defaultPicRole,
      notes: `${t.recommendedScope}. ${t.notes}`,
    }));

    const { error } = await supabase.from("vendors").insert(rows);

    if (error) {
      captureError(error, { action: "importStarterVendorsAction", weddingId });
      return { success: false, error: error.message };
    }

    revalidatePath(`/workspace/${weddingId}/vendors`);
    revalidatePath(`/workspace/${weddingId}`);
    return { success: true, count: rows.length };
  } catch (err) {
    captureError(err, { action: "importStarterVendorsAction", weddingId });
    return {
      success: false,
      error: "Gagal mengimpor daftar rekomendasi vendor.",
    };
  }
}
