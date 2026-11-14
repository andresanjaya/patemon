"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { logger, captureError } from "@/lib/observability/logger";
import { MVP_WEDDING_PRICE_IDR } from "./pricing";
import { createSnapTransaction, getMidtransConfig } from "./midtrans";
import { getWorkspaceEntitlement } from "./entitlements";
import { generateOrderNumber } from "./utils";
import type {
  CheckoutOrder,
  CreateCheckoutResult,
  PaymentStatus,
} from "./types";

/**
 * Create or Reuse a Midtrans Snap Checkout Session for a Wedding Workspace.
 *
 * Security & PRD 5.4 Compliance:
 * 1. Strict server-side price enforcement (MVP_WEDDING_PRICE_IDR = 199.000). Price is never accepted from client.
 * 2. Auth & membership validation: User must be authenticated and associated with the wedding workspace.
 * 3. Prevents duplicate charges if workspace is already paid and active.
 * 4. Idempotency: Reuses active pending order if created within the last 45 minutes to prevent redundant Snap transactions.
 */
export async function createCheckoutOrderAction(
  weddingId: string
): Promise<CreateCheckoutResult> {
  const config = getMidtransConfig();

  // 1. Sandbox demo protection
  if (weddingId === "demo") {
    return {
      success: false,
      error:
        "Workspace Demo adalah pratinjau publik dan tidak dapat di-upgrade. Silakan buat workspace baru untuk pawiwahan Anda.",
    };
  }

  try {
    const supabase = await createClient();

    // 2. Authenticate user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        success: false,
        error:
          "Sesi telah berakhir. Silakan masuk kembali untuk melanjutkan pembayaran.",
      };
    }

    // 3. Verify user membership/access to wedding
    const { data: member, error: memberError } = await supabase
      .from("wedding_members")
      .select("role")
      .eq("wedding_id", weddingId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (memberError) {
      captureError(memberError, {
        action: "createCheckoutOrderAction.verifyMember",
        weddingId,
        userId: user.id,
      });
    }

    // Also check if user is the wedding creator if member record is absent
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

    const isOwnerOrMember =
      wedding.created_by === user.id ||
      member?.role === "owner" ||
      member?.role === "editor";

    if (!isOwnerOrMember) {
      return {
        success: false,
        error:
          "Hanya pemilik atau pengelola workspace yang dapat melakukan aktivasi lisensi.",
      };
    }

    // 4. Verify existing entitlement (Prevent duplicate purchase on already-active workspace)
    const entitlement = await getWorkspaceEntitlement(weddingId, supabase);
    if (entitlement.isPaid && entitlement.status === "active") {
      return {
        success: false,
        error:
          "Workspace ini sudah memiliki Lisensi Penuh Pawiwahan yang aktif.",
      };
    }

    // 5. Idempotency Check: Reuse existing pending order within 45-minute window
    const fortyFiveMinutesAgo = new Date(
      Date.now() - 45 * 60 * 1000
    ).toISOString();
    const { data: existingPendingOrder } = await supabase
      .from("checkout_orders")
      .select("*")
      .eq("wedding_id", weddingId)
      .eq("status", "pending")
      .gt("created_at", fortyFiveMinutesAgo)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (
      existingPendingOrder &&
      existingPendingOrder.snap_token &&
      existingPendingOrder.snap_redirect_url
    ) {
      logger.info("Reusing existing pending Midtrans checkout order", {
        orderId: existingPendingOrder.id,
        orderNumber: existingPendingOrder.order_number,
        weddingId,
      });

      return {
        success: true,
        isReused: true,
        orderId: existingPendingOrder.id,
        orderNumber: existingPendingOrder.order_number,
        snapToken: existingPendingOrder.snap_token,
        redirectUrl: existingPendingOrder.snap_redirect_url,
        clientKey: config.clientKey,
        snapUrl: config.snapScriptUrl,
      };
    }

    // 6. Fetch user profile for customer details
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, phone")
      .eq("id", user.id)
      .maybeSingle();

    const orderNumber = generateOrderNumber(weddingId);
    const amount = MVP_WEDDING_PRICE_IDR; // Server-enforced price

    // 7. Request Snap Transaction from Midtrans
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    const customerName =
      profile?.full_name?.trim() ||
      user.user_metadata?.full_name ||
      user.email?.split("@")[0] ||
      "Keluarga Pawiwahan";

    const snapResponse = await createSnapTransaction({
      transaction_details: {
        order_id: orderNumber,
        gross_amount: amount,
      },
      item_details: [
        {
          id: "pawiwahan-mvp-license",
          price: amount,
          quantity: 1,
          name: "Lisensi Akses Penuh Pawiwahan Patemon",
          category: "Digital Wedding License",
        },
      ],
      customer_details: {
        first_name: customerName,
        email: user.email || undefined,
        phone: profile?.phone || undefined,
      },
      callbacks: {
        finish: `${appUrl}/workspace/${weddingId}/settings?payment=finish&orderId=${orderNumber}`,
      },
    });

    if (!snapResponse.token) {
      return {
        success: false,
        error:
          "Gagal mendapatkan token pembayaran dari Midtrans. Silakan coba lagi.",
      };
    }

    // 8. Persist Order in Supabase checkout_orders
    const now = new Date().toISOString();
    const { data: newOrder, error: insertError } = await supabase
      .from("checkout_orders")
      .insert({
        wedding_id: weddingId,
        user_id: user.id,
        order_number: orderNumber,
        amount,
        status: "pending",
        snap_token: snapResponse.token,
        snap_redirect_url: snapResponse.redirect_url,
        created_at: now,
        updated_at: now,
      })
      .select("id")
      .single();

    if (insertError || !newOrder) {
      captureError(insertError, {
        action: "createCheckoutOrderAction.insertOrder",
        weddingId,
        orderNumber,
      });
      return {
        success: false,
        error: "Gagal mencatat data pesanan. Silakan coba beberapa saat lagi.",
      };
    }

    // 9. Record audit trail in activity_logs
    await supabase.from("activity_logs").insert({
      wedding_id: weddingId,
      user_id: user.id,
      action: "payment.checkout_initiated",
      entity_type: "checkout_order",
      entity_id: newOrder.id,
      details: {
        orderId: newOrder.id,
        orderNumber,
        amount,
        currency: "IDR",
      },
    });

    logger.info("Successfully created and persisted checkout order", {
      orderId: newOrder.id,
      orderNumber,
      weddingId,
      amount,
    });

    revalidatePath(`/workspace/${weddingId}/settings`);

    return {
      success: true,
      isReused: false,
      orderId: newOrder.id,
      orderNumber,
      snapToken: snapResponse.token,
      redirectUrl: snapResponse.redirect_url,
      clientKey: config.clientKey,
      snapUrl: config.snapScriptUrl,
    };
  } catch (err) {
    captureError(err, {
      action: "createCheckoutOrderAction",
      weddingId,
    });

    return {
      success: false,
      error:
        err instanceof Error
          ? err.message
          : "Terjadi kesalahan sistem saat memproses transaksi pembayaran.",
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

    return {
      id: data.id,
      weddingId: data.wedding_id,
      userId: data.user_id,
      orderNumber: data.order_number,
      amount: data.amount,
      status: data.status as PaymentStatus,
      snapToken: data.snap_token,
      snapRedirectUrl: data.snap_redirect_url,
      paymentType: data.payment_type,
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

    return data.map((d) => ({
      id: d.id,
      weddingId: d.wedding_id,
      userId: d.user_id,
      orderNumber: d.order_number,
      amount: d.amount,
      status: d.status as PaymentStatus,
      snapToken: d.snap_token,
      snapRedirectUrl: d.snap_redirect_url,
      paymentType: d.payment_type,
      transactionTime: d.transaction_time,
      settlementTime: d.settlement_time,
      createdAt: d.created_at,
      updatedAt: d.updated_at,
    }));
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
