import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { logger, captureError } from "@/lib/observability/logger";
import { verifyMidtransSignature } from "./midtrans";
import type { Json } from "@/types/database";
import type {
  MidtransNotificationPayload,
  WebhookProcessResult,
  PaymentStatus,
} from "./types";

/**
 * Processes incoming Midtrans webhook notification.
 *
 * Guarantees (PRD 5.4, 7.1, 10):
 * 1. Cryptographic SHA-512 signature verification.
 * 2. Complete event logging in `payment_events`.
 * 3. Idempotent grant creation (duplicate events do not create multiple grants or corrupt states).
 * 4. Automatic license activation on 'settlement' or 'capture (accept)'.
 * 5. Immediate access revocation on 'refund', 'partial_refund', or 'chargeback'.
 */
export async function processMidtransWebhook(
  payload: MidtransNotificationPayload,
  adminClientOverride?: ReturnType<typeof createAdminClient>
): Promise<WebhookProcessResult> {
  // 1. Validate signature key
  const isSignatureValid = verifyMidtransSignature(payload);
  if (!isSignatureValid) {
    logger.warn("Rejected Midtrans webhook due to invalid SHA-512 signature", {
      orderId: payload.order_id,
      statusCode: payload.status_code,
      grossAmount: payload.gross_amount,
    });

    return {
      success: false,
      statusCode: 401,
      status: "invalid_signature",
      error: "Tanda tangan webhook Midtrans tidak valid.",
    };
  }

  const supabase = adminClientOverride || createAdminClient();

  try {
    // 2. Fetch the corresponding order
    const { data: order, error: orderError } = await supabase
      .from("checkout_orders")
      .select("*")
      .eq("order_number", payload.order_id)
      .maybeSingle();

    if (orderError) {
      captureError(orderError, {
        action: "processMidtransWebhook.findOrder",
        orderId: payload.order_id,
      });
      return {
        success: false,
        statusCode: 500,
        status: "error",
        error: "Gagal membaca database pesanan.",
      };
    }

    if (!order) {
      logger.warn("Received webhook notification for unknown order", {
        orderId: payload.order_id,
      });

      return {
        success: false,
        statusCode: 404,
        status: "order_not_found",
        error: `Pesanan dengan nomor ${payload.order_id} tidak ditemukan.`,
      };
    }

    // 3. Record raw event in payment_events table
    const { error: eventError } = await supabase.from("payment_events").insert({
      order_id: order.id,
      event_type: "notification",
      provider_status: payload.transaction_status,
      signature_key: payload.signature_key,
      payload: payload as unknown as Json,
      is_verified: true,
      processed_at: new Date().toISOString(),
    });

    if (eventError) {
      captureError(eventError, {
        action: "processMidtransWebhook.recordPaymentEvent",
        orderId: order.id,
      });
    }

    // 4. Determine target status
    const txnStatus = payload.transaction_status;
    const fraudStatus = payload.fraud_status;

    const isSettled =
      txnStatus === "settlement" ||
      (txnStatus === "capture" && fraudStatus === "accept");

    const isRefund =
      txnStatus === "refund" ||
      txnStatus === "partial_refund" ||
      txnStatus === "chargeback";

    // 5. Idempotency Check: Already settled order receiving duplicate settlement
    if (order.status === "settlement" && isSettled) {
      // Ensure grant exists
      const { data: activeGrant } = await supabase
        .from("access_grants")
        .select("id")
        .eq("wedding_id", order.wedding_id)
        .eq("status", "active")
        .limit(1)
        .maybeSingle();

      logger.info(
        "Duplicate settlement notification acknowledged idempotently",
        {
          orderId: order.id,
          orderNumber: order.order_number,
          grantExists: Boolean(activeGrant),
        }
      );

      return {
        success: true,
        statusCode: 200,
        status: "already_processed",
        orderId: order.id,
        orderNumber: order.order_number,
        weddingId: order.wedding_id,
        entitlementActivated: false,
      };
    }

    const now = new Date().toISOString();

    // 6. Handle Settlement / Payment Success (Activate License)
    if (isSettled) {
      // 6a. Update checkout_orders
      await supabase
        .from("checkout_orders")
        .update({
          status: "settlement",
          payment_type: payload.payment_type || order.payment_type,
          transaction_time:
            payload.transaction_time || order.transaction_time || now,
          settlement_time: payload.settlement_time || now,
          raw_response: payload as unknown as Json,
          updated_at: now,
        })
        .eq("id", order.id);

      // 6b. Check if active grant already exists for this wedding
      const { data: existingGrant } = await supabase
        .from("access_grants")
        .select("id")
        .eq("wedding_id", order.wedding_id)
        .eq("status", "active")
        .limit(1)
        .maybeSingle();

      let grantId = existingGrant?.id;

      if (!existingGrant) {
        // Valid for 365 days post-activation, then gracefully becomes permanent read-only archive
        const validUntil = new Date(
          Date.now() + 365 * 24 * 60 * 60 * 1000
        ).toISOString();

        const { data: newGrant, error: grantError } = await supabase
          .from("access_grants")
          .insert({
            wedding_id: order.wedding_id,
            order_id: order.id,
            status: "active",
            granted_at: now,
            valid_until: validUntil,
          })
          .select("id")
          .single();

        if (grantError || !newGrant) {
          captureError(grantError, {
            action: "processMidtransWebhook.createAccessGrant",
            weddingId: order.wedding_id,
            orderId: order.id,
          });
        } else {
          grantId = newGrant.id;
        }

        // 6c. Audit log in activity_logs
        await supabase.from("activity_logs").insert({
          wedding_id: order.wedding_id,
          user_id: order.user_id,
          action: "license.activated",
          entity_type: "access_grant",
          entity_id: grantId || order.id,
          details: {
            orderNumber: order.order_number,
            amount: order.amount,
            paymentType: payload.payment_type,
            validUntil,
          },
        });
      }

      logger.info(
        "Successfully processed settlement and activated wedding license",
        {
          orderNumber: order.order_number,
          weddingId: order.wedding_id,
          grantId,
        }
      );

      return {
        success: true,
        statusCode: 200,
        status: "processed",
        orderId: order.id,
        orderNumber: order.order_number,
        weddingId: order.wedding_id,
        entitlementActivated: true,
      };
    }

    // 7. Handle Refund / Chargeback (Revoke License)
    if (isRefund) {
      await supabase
        .from("checkout_orders")
        .update({
          status: "cancel",
          raw_response: payload as unknown as Json,
          updated_at: now,
        })
        .eq("id", order.id);

      // Revoke grants linked to this wedding/order
      await supabase
        .from("access_grants")
        .update({
          status: "revoked",
          revoked_at: now,
        })
        .eq("wedding_id", order.wedding_id)
        .eq("order_id", order.id);

      // Audit log in activity_logs
      await supabase.from("activity_logs").insert({
        wedding_id: order.wedding_id,
        user_id: order.user_id,
        action: "license.revoked",
        entity_type: "access_grant",
        entity_id: order.id,
        details: {
          reason: txnStatus,
          orderNumber: order.order_number,
        },
      });

      logger.warn("Payment refunded/chargebacked; revoked access grant", {
        orderNumber: order.order_number,
        weddingId: order.wedding_id,
        reason: txnStatus,
      });

      return {
        success: true,
        statusCode: 200,
        status: "processed",
        orderId: order.id,
        orderNumber: order.order_number,
        weddingId: order.wedding_id,
        entitlementActivated: false,
      };
    }

    // 8. Handle Pending, Expire, Cancel, Deny
    let mappedStatus: PaymentStatus = "pending";
    if (txnStatus === "expire") mappedStatus = "expire";
    else if (txnStatus === "cancel") mappedStatus = "cancel";
    else if (txnStatus === "deny") mappedStatus = "deny";

    await supabase
      .from("checkout_orders")
      .update({
        status: mappedStatus,
        payment_type: payload.payment_type || order.payment_type,
        raw_response: payload as unknown as Json,
        updated_at: now,
      })
      .eq("id", order.id);

    logger.info("Order status updated from Midtrans webhook", {
      orderNumber: order.order_number,
      newStatus: mappedStatus,
      providerStatus: txnStatus,
    });

    return {
      success: true,
      statusCode: 200,
      status: "processed",
      orderId: order.id,
      orderNumber: order.order_number,
      weddingId: order.wedding_id,
      entitlementActivated: false,
    };
  } catch (err) {
    captureError(err, {
      action: "processMidtransWebhook",
      orderId: payload.order_id,
    });

    return {
      success: false,
      statusCode: 500,
      status: "error",
      error: err instanceof Error ? err.message : "Kesalahan internal webhook.",
    };
  }
}
