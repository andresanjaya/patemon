"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { logger, captureError } from "@/lib/observability/logger";
import { MVP_WEDDING_PRICE_IDR } from "./pricing";
import { getWorkspaceEntitlement } from "./entitlements";
import { generateOrderNumber } from "./utils";
import { formatPaymentConfirmationWhatsAppLink } from "./support";
import type {
  CheckoutOrder,
  ManualPaymentInput,
  ManualPaymentResult,
  PaymentStatus,
} from "./types";

/**
 * Submits a manual payment confirmation request (BCA Transfer or QRIS)
 * for a Wedding Workspace to be verified by Master Admin.
 *
 * Security & PRD 5.4 Compliance:
 * 1. Strict server-side price enforcement (MVP_WEDDING_PRICE_IDR = 199.000).
 * 2. Auth & membership validation: User must be authenticated and owner of the wedding workspace.
 * 3. Prevents duplicate charges if workspace is already paid and active.
 * 4. Persists pending order in database and returns pre-populated WhatsApp confirmation URL.
 */
export async function submitManualPaymentRequestAction(
  input: ManualPaymentInput
): Promise<ManualPaymentResult> {
  const { weddingId, paymentMethod, senderName, notes } = input;

  if (weddingId === "demo") {
    return {
      success: false,
      error:
        "Workspace Demo adalah pratinjau publik dan tidak dapat di-upgrade. Silakan buat workspace baru untuk pawiwahan Anda.",
    };
  }

  try {
    const supabase = await createClient();

    // 1. Authenticate user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        success: false,
        error:
          "Sesi telah berakhir. Silakan masuk kembali untuk melanjutkan konfirmasi pembayaran.",
      };
    }

    // 2. Verify user membership and ownership
    const { data: member, error: memberError } = await supabase
      .from("wedding_members")
      .select("role")
      .eq("wedding_id", weddingId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (memberError) {
      captureError(memberError, {
        action: "submitManualPaymentRequestAction.verifyMember",
        weddingId,
        userId: user.id,
      });
    }

    const { data: wedding, error: weddingError } = await supabase
      .from("weddings")
      .select("id, couple_names, created_by, groom_name, bride_name")
      .eq("id", weddingId)
      .maybeSingle();

    if (weddingError || !wedding) {
      return {
        success: false,
        error: "Workspace pernikahan tidak ditemukan.",
      };
    }

    const isOwner =
      member?.role === "owner" || (wedding.created_by === user.id && !member);

    if (!isOwner) {
      return {
        success: false,
        error:
          "Hanya pemilik (owner) workspace yang memiliki wewenang untuk melakukan konfirmasi pembayaran atau aktivasi lisensi.",
      };
    }

    // 3. Verify existing entitlement
    const entitlement = await getWorkspaceEntitlement(weddingId, supabase);
    if (entitlement.isPaid && entitlement.status === "active") {
      return {
        success: false,
        error:
          "Workspace ini sudah memiliki Lisensi Penuh Pawiwahan yang aktif.",
      };
    }

    // 4. Check for active pending order within the last 2 hours to avoid spam
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
    const { data: existingPendingOrder } = await supabase
      .from("checkout_orders")
      .select("*")
      .eq("wedding_id", weddingId)
      .eq("status", "pending")
      .gt("created_at", twoHoursAgo)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const orderNumber =
      existingPendingOrder?.order_number || generateOrderNumber(weddingId);
    const amount = MVP_WEDDING_PRICE_IDR;
    const now = new Date().toISOString();

    const whatsappUrl = formatPaymentConfirmationWhatsAppLink({
      weddingId,
      coupleNames: wedding.couple_names || undefined,
      userEmail: user.email || undefined,
      orderNumber,
      paymentMethod,
      senderName: senderName?.trim() || undefined,
    });

    let orderId: string;

    if (existingPendingOrder) {
      orderId = existingPendingOrder.id;
      // Update payment type or sender notes if provided
      await supabase
        .from("checkout_orders")
        .update({
          payment_type: paymentMethod,
          raw_response: {
            senderName: senderName?.trim() || null,
            notes: notes?.trim() || null,
            updatedAt: now,
          },
          updated_at: now,
        })
        .eq("id", orderId);
    } else {
      // Insert new order
      const { data: newOrder, error: insertError } = await supabase
        .from("checkout_orders")
        .insert({
          wedding_id: weddingId,
          user_id: user.id,
          order_number: orderNumber,
          amount,
          status: "pending",
          payment_type: paymentMethod,
          raw_response: {
            senderName: senderName?.trim() || null,
            notes: notes?.trim() || null,
            submittedAt: now,
          },
          created_at: now,
          updated_at: now,
        })
        .select("id")
        .single();

      if (insertError || !newOrder) {
        captureError(insertError, {
          action: "submitManualPaymentRequestAction.insertOrder",
          weddingId,
          orderNumber,
        });
        return {
          success: false,
          error:
            "Gagal mencatat data pesanan. Silakan coba beberapa saat lagi.",
        };
      }

      orderId = newOrder.id;

      // Audit log
      await supabase.from("activity_logs").insert({
        wedding_id: weddingId,
        user_id: user.id,
        action: "payment.manual_request_submitted",
        entity_type: "checkout_order",
        entity_id: orderId,
        details: {
          orderId,
          orderNumber,
          amount,
          paymentMethod,
          senderName: senderName?.trim() || null,
        },
      });
    }

    logger.info("Successfully recorded manual payment confirmation request", {
      orderId,
      orderNumber,
      weddingId,
      amount,
      paymentMethod,
    });

    revalidatePath(`/workspace/${weddingId}`);
    revalidatePath(`/workspace/${weddingId}/settings`);

    return {
      success: true,
      orderId,
      orderNumber,
      whatsappUrl,
      isReused: Boolean(existingPendingOrder),
    };
  } catch (err) {
    captureError(err, {
      action: "submitManualPaymentRequestAction",
      weddingId,
    });

    return {
      success: false,
      error:
        err instanceof Error
          ? err.message
          : "Terjadi kesalahan sistem saat memproses konfirmasi pembayaran.",
    };
  }
}

/**
 * Fetch the latest checkout order for a wedding workspace.
 */
export async function getLatestOrderForWedding(
  weddingId: string
): Promise<CheckoutOrder | null> {
  if (weddingId === "demo") {
    return null;
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("checkout_orders")
      .select("*")
      .eq("wedding_id", weddingId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !data) {
      return null;
    }

    const raw = data.raw_response as { senderName?: string } | null;

    return {
      id: data.id,
      weddingId: data.wedding_id,
      userId: data.user_id,
      orderNumber: data.order_number,
      amount: data.amount,
      status: data.status as PaymentStatus,
      paymentType: data.payment_type,
      senderName: raw?.senderName || null,
      snapToken: data.snap_token,
      snapRedirectUrl: data.snap_redirect_url,
      transactionTime: data.transaction_time,
      settlementTime: data.settlement_time,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  } catch {
    return null;
  }
}

/**
 * Fetch all checkout orders for a workspace (Order History in Settings).
 */
export async function getOrderHistoryForWedding(
  weddingId: string
): Promise<CheckoutOrder[]> {
  if (weddingId === "demo") {
    return [];
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("checkout_orders")
      .select("*")
      .eq("wedding_id", weddingId)
      .order("created_at", { ascending: false });

    if (error || !data) {
      return [];
    }

    return data.map((d) => {
      const raw = d.raw_response as { senderName?: string } | null;
      return {
        id: d.id,
        weddingId: d.wedding_id,
        userId: d.user_id,
        orderNumber: d.order_number,
        amount: d.amount,
        status: d.status as PaymentStatus,
        paymentType: d.payment_type,
        senderName: raw?.senderName || null,
        snapToken: d.snap_token,
        snapRedirectUrl: d.snap_redirect_url,
        transactionTime: d.transaction_time,
        settlementTime: d.settlement_time,
        createdAt: d.created_at,
        updatedAt: d.updated_at,
      };
    });
  } catch {
    return [];
  }
}

/**
 * Cancel a pending checkout order if user wishes to abandon or regenerate it.
 */
export async function cancelPendingOrderAction(
  weddingId: string,
  orderNumber: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();

    const { error } = await supabase
      .from("checkout_orders")
      .update({
        status: "cancel",
        updated_at: new Date().toISOString(),
      })
      .eq("wedding_id", weddingId)
      .eq("order_number", orderNumber)
      .eq("status", "pending");

    if (error) {
      return { success: false, error: "Gagal membatalkan pesanan pending." };
    }

    revalidatePath(`/workspace/${weddingId}/settings`);
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Kesalahan sistem.",
    };
  }
}
