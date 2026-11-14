"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { captureError } from "@/lib/observability/logger";
import type { Database } from "@/types/database";
import { DEMO_BUDGET_ITEMS, STARTER_BUDGET_TEMPLATES } from "./seeds";
import type {
  BudgetItem,
  BudgetItemStatus,
  BudgetPayment,
  CreateBudgetItemInput,
  CreatePaymentInput,
  UpdateBudgetItemInput,
} from "./types";

type BudgetItemUpdate = Database["public"]["Tables"]["budget_items"]["Update"];

/**
 * Fetch all budget line items and their payment records for a wedding workspace.
 */
export async function getWeddingBudgetItems(
  weddingId: string
): Promise<BudgetItem[]> {
  if (weddingId === "demo") {
    return DEMO_BUDGET_ITEMS;
  }

  try {
    const supabase = await createClient();

    // 1. Fetch budget items
    const { data: items, error: itemsError } = await supabase
      .from("budget_items")
      .select("*")
      .eq("wedding_id", weddingId)
      .is("deleted_at", null)
      .order("created_at", { ascending: true });

    if (itemsError || !items) {
      if (itemsError) {
        captureError(itemsError, {
          action: "getWeddingBudgetItems",
          weddingId,
        });
      }
      return [];
    }

    // 2. Fetch payments
    const { data: payments, error: paymentsError } = await supabase
      .from("budget_payments")
      .select("*")
      .eq("wedding_id", weddingId)
      .order("payment_date", { ascending: true });

    if (paymentsError) {
      captureError(paymentsError, {
        action: "getWeddingBudgetPayments",
        weddingId,
      });
    }

    const paymentsByItem = new Map<string, BudgetPayment[]>();
    (payments || []).forEach((p) => {
      const existing = paymentsByItem.get(p.budget_item_id) || [];
      existing.push({
        id: p.id,
        weddingId: p.wedding_id,
        budgetItemId: p.budget_item_id,
        amount: Math.round(p.amount),
        paymentDate: p.payment_date,
        paymentMethod: p.payment_method,
        recipient: p.recipient,
        notes: p.notes,
        receiptUrl: p.receipt_url,
        createdBy: p.created_by,
        createdAt: p.created_at,
      });
      paymentsByItem.set(p.budget_item_id, existing);
    });

    return items.map((item) => {
      const itemPayments = paymentsByItem.get(item.id) || [];
      const paidAmount = itemPayments.reduce(
        (sum, p) => sum + Math.round(p.amount),
        0
      );

      const actualAmount = Math.round(item.actual_amount);
      const plannedAmount = Math.round(item.planned_amount);
      const effectiveTotal = actualAmount > 0 ? actualAmount : plannedAmount;

      let derivedStatus = item.status as BudgetItemStatus;
      if (derivedStatus !== "canceled") {
        if (paidAmount >= effectiveTotal && effectiveTotal > 0) {
          derivedStatus = "paid_full";
        } else if (paidAmount > 0) {
          derivedStatus = "paid_partial";
        }
      }

      return {
        id: item.id,
        weddingId: item.wedding_id,
        category: item.category,
        title: item.title,
        unit: item.unit,
        quantity: Number(item.quantity) || 1,
        unitPrice: Math.round(item.unit_price),
        plannedAmount,
        actualAmount,
        paidAmount,
        paidBy: item.paid_by,
        status: derivedStatus,
        linkedRitualItemId: item.linked_ritual_item_id,
        linkedVendorId: item.linked_vendor_id,
        notes: item.notes,
        createdAt: item.created_at,
        updatedAt: item.updated_at,
        payments: itemPayments,
      };
    });
  } catch (err) {
    captureError(err, { action: "getWeddingBudgetItems", weddingId });
    return [];
  }
}

/**
 * Create a new budget line item.
 */
export async function createBudgetItemAction(
  weddingId: string,
  input: CreateBudgetItemInput
): Promise<{ success: boolean; item?: BudgetItem; error?: string }> {
  if (!input.title?.trim()) {
    return {
      success: false,
      error: "Nama pengeluaran / rincian biaya wajib diisi.",
    };
  }

  const quantity = input.quantity && input.quantity > 0 ? input.quantity : 1;
  const unitPrice =
    input.unitPrice && input.unitPrice >= 0 ? Math.round(input.unitPrice) : 0;
  const plannedAmount =
    input.plannedAmount !== undefined && input.plannedAmount >= 0
      ? Math.round(input.plannedAmount)
      : Math.round(quantity * unitPrice);
  const actualAmount =
    input.actualAmount !== undefined && input.actualAmount >= 0
      ? Math.round(input.actualAmount)
      : plannedAmount;

  if (weddingId === "demo") {
    const newItem: BudgetItem = {
      id: `demo-bg-${Date.now()}`,
      weddingId: "demo",
      category: input.category || "lainnya",
      title: input.title.trim(),
      unit: input.unit?.trim() || "Paket",
      quantity,
      unitPrice,
      plannedAmount,
      actualAmount,
      paidAmount: 0,
      paidBy: input.paidBy?.trim() || "Bersama (Kedua Mempelai)",
      status: input.status || "estimated",
      linkedRitualItemId: input.linkedRitualItemId || null,
      linkedVendorId: input.linkedVendorId || null,
      notes: input.notes?.trim() || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      payments: [],
    };
    return { success: true, item: newItem };
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return {
        success: false,
        error: "Anda harus login untuk menambah rincian anggaran.",
      };
    }

    const { data, error } = await supabase
      .from("budget_items")
      .insert({
        wedding_id: weddingId,
        category: input.category || "lainnya",
        title: input.title.trim(),
        unit: input.unit?.trim() || "Paket",
        quantity,
        unit_price: unitPrice,
        planned_amount: plannedAmount,
        actual_amount: actualAmount,
        paid_by: input.paidBy?.trim() || null,
        status: input.status || "estimated",
        linked_ritual_item_id: input.linkedRitualItemId || null,
        linked_vendor_id: input.linkedVendorId || null,
        notes: input.notes?.trim() || null,
      })
      .select()
      .single();

    if (error || !data) {
      captureError(error, {
        action: "createBudgetItemAction",
        weddingId,
        input,
      });
      return {
        success: false,
        error: error?.message || "Gagal membuat rincian anggaran.",
      };
    }

    revalidatePath(`/workspace/${weddingId}/budget`);
    revalidatePath(`/workspace/${weddingId}`);

    return {
      success: true,
      item: {
        id: data.id,
        weddingId: data.wedding_id,
        category: data.category,
        title: data.title,
        unit: data.unit,
        quantity: Number(data.quantity) || 1,
        unitPrice: Math.round(data.unit_price),
        plannedAmount: Math.round(data.planned_amount),
        actualAmount: Math.round(data.actual_amount),
        paidAmount: 0,
        paidBy: data.paid_by,
        status: data.status as BudgetItemStatus,
        linkedRitualItemId: data.linked_ritual_item_id,
        linkedVendorId: data.linked_vendor_id,
        notes: data.notes,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
        payments: [],
      },
    };
  } catch (err) {
    captureError(err, { action: "createBudgetItemAction", weddingId, input });
    return {
      success: false,
      error: "Terjadi kesalahan sistem saat menyimpan anggaran.",
    };
  }
}

/**
 * Update an existing budget line item.
 */
export async function updateBudgetItemAction(
  weddingId: string,
  itemId: string,
  input: UpdateBudgetItemInput
): Promise<{ success: boolean; item?: BudgetItem; error?: string }> {
  if (input.title !== undefined && !input.title.trim()) {
    return { success: false, error: "Nama pengeluaran tidak boleh kosong." };
  }

  if (weddingId === "demo") {
    const existing = DEMO_BUDGET_ITEMS.find((b) => b.id === itemId);
    if (!existing)
      return { success: false, error: "Item anggaran tidak ditemukan." };

    const quantity =
      input.quantity !== undefined ? input.quantity : existing.quantity;
    const unitPrice =
      input.unitPrice !== undefined
        ? Math.round(input.unitPrice)
        : existing.unitPrice;
    const plannedAmount =
      input.plannedAmount !== undefined
        ? Math.round(input.plannedAmount)
        : Math.round(quantity * unitPrice);
    const actualAmount =
      input.actualAmount !== undefined
        ? Math.round(input.actualAmount)
        : existing.actualAmount;

    const updated: BudgetItem = {
      ...existing,
      title: input.title !== undefined ? input.title.trim() : existing.title,
      category:
        input.category !== undefined ? input.category : existing.category,
      unit: input.unit !== undefined ? input.unit : existing.unit,
      quantity,
      unitPrice,
      plannedAmount,
      actualAmount,
      paidBy: input.paidBy !== undefined ? input.paidBy : existing.paidBy,
      status: input.status !== undefined ? input.status : existing.status,
      notes: input.notes !== undefined ? input.notes : existing.notes,
      updatedAt: new Date().toISOString(),
    };
    return { success: true, item: updated };
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return {
        success: false,
        error: "Anda harus login untuk mengubah rincian anggaran.",
      };
    }

    const updates: BudgetItemUpdate = {
      updated_at: new Date().toISOString(),
    };

    if (input.title !== undefined) updates.title = input.title.trim();
    if (input.category !== undefined) updates.category = input.category;
    if (input.unit !== undefined) updates.unit = input.unit?.trim() || null;
    if (input.quantity !== undefined) updates.quantity = input.quantity;
    if (input.unitPrice !== undefined)
      updates.unit_price = Math.round(input.unitPrice);
    if (input.plannedAmount !== undefined)
      updates.planned_amount = Math.round(input.plannedAmount);
    if (input.actualAmount !== undefined)
      updates.actual_amount = Math.round(input.actualAmount);
    if (input.paidBy !== undefined)
      updates.paid_by = input.paidBy?.trim() || null;
    if (input.status !== undefined) updates.status = input.status;
    if (input.notes !== undefined) updates.notes = input.notes?.trim() || null;
    if (input.linkedRitualItemId !== undefined)
      updates.linked_ritual_item_id = input.linkedRitualItemId;
    if (input.linkedVendorId !== undefined)
      updates.linked_vendor_id = input.linkedVendorId;

    const { data, error } = await supabase
      .from("budget_items")
      .update(updates)
      .eq("id", itemId)
      .eq("wedding_id", weddingId)
      .select()
      .single();

    if (error || !data) {
      captureError(error, {
        action: "updateBudgetItemAction",
        weddingId,
        itemId,
      });
      return {
        success: false,
        error: error?.message || "Gagal memperbarui rincian anggaran.",
      };
    }

    revalidatePath(`/workspace/${weddingId}/budget`);
    revalidatePath(`/workspace/${weddingId}`);

    return {
      success: true,
      item: {
        id: data.id,
        weddingId: data.wedding_id,
        category: data.category,
        title: data.title,
        unit: data.unit,
        quantity: Number(data.quantity) || 1,
        unitPrice: Math.round(data.unit_price),
        plannedAmount: Math.round(data.planned_amount),
        actualAmount: Math.round(data.actual_amount),
        paidAmount: 0,
        paidBy: data.paid_by,
        status: data.status as BudgetItemStatus,
        linkedRitualItemId: data.linked_ritual_item_id,
        linkedVendorId: data.linked_vendor_id,
        notes: data.notes,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
        payments: [],
      },
    };
  } catch (err) {
    captureError(err, { action: "updateBudgetItemAction", weddingId, itemId });
    return {
      success: false,
      error: "Terjadi kesalahan sistem saat memperbarui anggaran.",
    };
  }
}

/**
 * Soft delete a budget line item.
 */
export async function deleteBudgetItemAction(
  weddingId: string,
  itemId: string
): Promise<{ success: boolean; error?: string }> {
  if (weddingId === "demo") {
    return { success: true };
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return {
        success: false,
        error: "Anda harus login untuk menghapus anggaran.",
      };
    }

    const { error } = await supabase
      .from("budget_items")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", itemId)
      .eq("wedding_id", weddingId);

    if (error) {
      captureError(error, {
        action: "deleteBudgetItemAction",
        weddingId,
        itemId,
      });
      return { success: false, error: "Gagal menghapus rincian anggaran." };
    }

    revalidatePath(`/workspace/${weddingId}/budget`);
    revalidatePath(`/workspace/${weddingId}`);
    return { success: true };
  } catch (err) {
    captureError(err, { action: "deleteBudgetItemAction", weddingId, itemId });
    return {
      success: false,
      error: "Terjadi kesalahan sistem saat menghapus anggaran.",
    };
  }
}

/**
 * Record a payment / deposit transaction against a budget item.
 */
export async function recordPaymentAction(
  weddingId: string,
  input: CreatePaymentInput
): Promise<{ success: boolean; payment?: BudgetPayment; error?: string }> {
  const amount = Math.round(input.amount);
  if (amount <= 0) {
    return {
      success: false,
      error: "Nominal pembayaran harus lebih besar dari Rp 0.",
    };
  }

  if (!input.paymentDate) {
    return { success: false, error: "Tanggal pembayaran wajib diisi." };
  }

  if (weddingId === "demo") {
    const newPayment: BudgetPayment = {
      id: `demo-pay-${Date.now()}`,
      weddingId: "demo",
      budgetItemId: input.budgetItemId,
      amount,
      paymentDate: input.paymentDate,
      paymentMethod: input.paymentMethod || "Transfer Bank",
      recipient: input.recipient?.trim() || null,
      notes: input.notes?.trim() || null,
      receiptUrl: input.receiptUrl || null,
      createdBy: null,
      createdAt: new Date().toISOString(),
    };
    return { success: true, payment: newPayment };
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return {
        success: false,
        error: "Anda harus login untuk mencatat pembayaran.",
      };
    }

    // 1. Insert payment
    const { data: payment, error: paymentError } = await supabase
      .from("budget_payments")
      .insert({
        wedding_id: weddingId,
        budget_item_id: input.budgetItemId,
        amount,
        payment_date: input.paymentDate,
        payment_method: input.paymentMethod || "Transfer Bank",
        recipient: input.recipient?.trim() || null,
        notes: input.notes?.trim() || null,
        receipt_url: input.receiptUrl || null,
        created_by: user.id,
      })
      .select()
      .single();

    if (paymentError || !payment) {
      captureError(paymentError, {
        action: "recordPaymentAction",
        weddingId,
        input,
      });
      return {
        success: false,
        error: paymentError?.message || "Gagal mencatat pembayaran.",
      };
    }

    // 2. Fetch all payments for this item to update item status
    const { data: allPayments } = await supabase
      .from("budget_payments")
      .select("amount")
      .eq("budget_item_id", input.budgetItemId);

    const totalPaid = (allPayments || []).reduce(
      (sum, p) => sum + Math.round(p.amount),
      0
    );

    // 3. Fetch item actual amount
    const { data: currentItem } = await supabase
      .from("budget_items")
      .select("actual_amount, planned_amount, status")
      .eq("id", input.budgetItemId)
      .single();

    if (currentItem) {
      const effectiveTotal =
        currentItem.actual_amount > 0
          ? currentItem.actual_amount
          : currentItem.planned_amount;

      let nextStatus: BudgetItemStatus = currentItem.status as BudgetItemStatus;
      if (nextStatus !== "canceled") {
        nextStatus = totalPaid >= effectiveTotal ? "paid_full" : "paid_partial";
      }

      await supabase
        .from("budget_items")
        .update({ status: nextStatus, updated_at: new Date().toISOString() })
        .eq("id", input.budgetItemId);
    }

    revalidatePath(`/workspace/${weddingId}/budget`);
    revalidatePath(`/workspace/${weddingId}`);

    return {
      success: true,
      payment: {
        id: payment.id,
        weddingId: payment.wedding_id,
        budgetItemId: payment.budget_item_id,
        amount: Math.round(payment.amount),
        paymentDate: payment.payment_date,
        paymentMethod: payment.payment_method,
        recipient: payment.recipient,
        notes: payment.notes,
        receiptUrl: payment.receipt_url,
        createdBy: payment.created_by,
        createdAt: payment.created_at,
      },
    };
  } catch (err) {
    captureError(err, { action: "recordPaymentAction", weddingId, input });
    return {
      success: false,
      error: "Terjadi kesalahan sistem saat menyimpan transaksi.",
    };
  }
}

/**
 * Delete a payment record and re-reconcile budget item status.
 */
export async function deletePaymentAction(
  weddingId: string,
  paymentId: string,
  budgetItemId: string
): Promise<{ success: boolean; error?: string }> {
  if (weddingId === "demo") {
    return { success: true };
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return {
        success: false,
        error: "Anda harus login untuk menghapus transaksi.",
      };
    }

    const { error } = await supabase
      .from("budget_payments")
      .delete()
      .eq("id", paymentId)
      .eq("wedding_id", weddingId);

    if (error) {
      captureError(error, {
        action: "deletePaymentAction",
        weddingId,
        paymentId,
      });
      return { success: false, error: "Gagal menghapus pembayaran." };
    }

    // Re-reconcile item status
    const { data: remainingPayments } = await supabase
      .from("budget_payments")
      .select("amount")
      .eq("budget_item_id", budgetItemId);

    const totalPaid = (remainingPayments || []).reduce(
      (sum, p) => sum + Math.round(p.amount),
      0
    );

    const { data: item } = await supabase
      .from("budget_items")
      .select("actual_amount, planned_amount, status")
      .eq("id", budgetItemId)
      .single();

    if (item && item.status !== "canceled") {
      const effectiveTotal =
        item.actual_amount > 0 ? item.actual_amount : item.planned_amount;

      let nextStatus: BudgetItemStatus = "booked";
      if (totalPaid >= effectiveTotal && effectiveTotal > 0) {
        nextStatus = "paid_full";
      } else if (totalPaid > 0) {
        nextStatus = "paid_partial";
      } else {
        nextStatus = "booked";
      }

      await supabase
        .from("budget_items")
        .update({ status: nextStatus, updated_at: new Date().toISOString() })
        .eq("id", budgetItemId);
    }

    revalidatePath(`/workspace/${weddingId}/budget`);
    revalidatePath(`/workspace/${weddingId}`);
    return { success: true };
  } catch (err) {
    captureError(err, { action: "deletePaymentAction", weddingId, paymentId });
    return {
      success: false,
      error: "Terjadi kesalahan sistem saat menghapus transaksi.",
    };
  }
}

/**
 * Import canonical starter Balinese wedding budget items.
 */
export async function importStarterBudgetAction(
  weddingId: string
): Promise<{ success: boolean; count?: number; error?: string }> {
  if (weddingId === "demo") {
    return { success: true, count: STARTER_BUDGET_TEMPLATES.length };
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return {
        success: false,
        error: "Anda harus login untuk mengimpor rekomendasi anggaran.",
      };
    }

    const rows = STARTER_BUDGET_TEMPLATES.map((tpl) => ({
      wedding_id: weddingId,
      category: tpl.category,
      title: tpl.title,
      unit: tpl.unit,
      quantity: tpl.defaultQty,
      unit_price: tpl.estimatedPrice,
      planned_amount: Math.round(tpl.defaultQty * tpl.estimatedPrice),
      actual_amount: Math.round(tpl.defaultQty * tpl.estimatedPrice),
      paid_by: tpl.defaultPaidBy,
      status: "estimated" as const,
      notes: tpl.notes,
    }));

    const { error, data } = await supabase
      .from("budget_items")
      .insert(rows)
      .select("id");

    if (error) {
      captureError(error, { action: "importStarterBudgetAction", weddingId });
      return {
        success: false,
        error: error.message || "Gagal mengimpor daftar anggaran.",
      };
    }

    revalidatePath(`/workspace/${weddingId}/budget`);
    revalidatePath(`/workspace/${weddingId}`);

    return { success: true, count: data?.length || rows.length };
  } catch (err) {
    captureError(err, { action: "importStarterBudgetAction", weddingId });
    return {
      success: false,
      error: "Terjadi kesalahan sistem saat mengimpor anggaran.",
    };
  }
}
