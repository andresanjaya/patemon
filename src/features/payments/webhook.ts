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

export interface ProcessWebhookOptions {
  isDirectProviderQuery?: boolean;
  correlationId?: string;
}

/**
 * Processes incoming Midtrans webhook notification.
 *
 * Guarantees (PRD 5.4, 7.1, 10 & Issue #76):
 * 1. Cryptographic SHA-512 signature verification (bypassed only for direct server TLS queries).
 * 2. Strict gross amount verification against order total.
 * 3. Complete event logging in `payment_events`.
 * 4. Idempotent grant creation with self-healing retry if prior attempt failed.
 * 5. Atomic order + grant activation (grant created before marking order settled; fails closed if grant fails).
 * 6. Protection against late pending downgrading settled orders and replayed settlements after refund.
 * 7. Immediate access revocation on 'refund', 'partial_refund', or 'chargeback'.
 */
export async function processMidtransWebhook(
  payload: MidtransNotificationPayload,
  adminClientOverride?: ReturnType<typeof createAdminClient>,
  options?: ProcessWebhookOptions
): Promise<WebhookProcessResult> {
  const isDirectQuery = options?.isDirectProviderQuery === true;

  // 1. Validate signature key (strictly required for incoming notifications; omitted for direct server TLS queries)
  if (!isDirectQuery) {
    const isSignatureValid = verifyMidtransSignature(payload);
    if (!isSignatureValid) {
      logger.warn(
        "Rejected Midtrans webhook due to invalid SHA-512 signature",
        {
          orderId: payload.order_id,
          statusCode: payload.status_code,
          grossAmount: payload.gross_amount,
          correlationId: options?.correlationId,
        }
      );

      return {
        success: false,
        statusCode: 401,
        status: "invalid_signature",
        error: "Tanda tangan webhook Midtrans tidak valid.",
      };
    }
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

    // 3. Strict Gross Amount Verification (Issue #76)
    const payloadAmount = Math.round(parseFloat(payload.gross_amount));
    if (payloadAmount !== order.amount) {
      logger.warn("Rejected Midtrans webhook due to gross amount mismatch", {
        orderId: payload.order_id,
        orderAmount: order.amount,
        payloadAmount,
      });

      return {
        success: false,
        statusCode: 400,
        status: "amount_mismatch",
        error: `Nominal pembayaran (Rp ${payloadAmount.toLocaleString("id-ID")}) tidak sesuai dengan tagihan pesanan (Rp ${order.amount.toLocaleString("id-ID")}).`,
      };
    }

    // 4. Record raw event in payment_events table
    const { error: eventError } = await supabase.from("payment_events").insert({
      order_id: order.id,
      event_type: isDirectQuery ? "reconciliation" : "notification",
      provider_status: payload.transaction_status,
      signature_key: payload.signature_key || null,
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

    // 5. Determine target status
    const txnStatus = payload.transaction_status;
    const fraudStatus = payload.fraud_status;

    const isSettled =
      txnStatus === "settlement" ||
      (txnStatus === "capture" && fraudStatus === "accept");

    const isRefund =
      txnStatus === "refund" ||
      txnStatus === "partial_refund" ||
      txnStatus === "chargeback";

    const now = new Date().toISOString();

    // 6. Guard against replayed settlement reviving refunded/chargebacked orders
    if (order.status === "cancel" && isSettled && !isDirectQuery) {
      const { data: refundEvent } = await supabase
        .from("payment_events")
        .select("id")
        .eq("order_id", order.id)
        .in("provider_status", ["refund", "partial_refund", "chargeback"])
        .limit(1)
        .maybeSingle();

      if (refundEvent) {
        logger.warn(
          "Rejected late/replayed settlement notification on already refunded order",
          {
            orderId: order.id,
            orderNumber: order.order_number,
          }
        );

        return {
          success: false,
          statusCode: 409,
          status: "order_already_refunded",
          error:
            "Pesanan ini telah direfund dan tidak dapat diaktifkan kembali oleh event kedaluwarsa.",
        };
      }
    }

    // 7. Idempotency Check & Self-Healing: Already settled order
    if (order.status === "settlement" && isSettled) {
      const { data: activeGrant } = await supabase
        .from("access_grants")
        .select("id")
        .eq("wedding_id", order.wedding_id)
        .eq("status", "active")
        .limit(1)
        .maybeSingle();

      if (activeGrant) {
        logger.info(
          "Duplicate settlement notification acknowledged idempotently",
          {
            orderId: order.id,
            orderNumber: order.order_number,
            grantExists: true,
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

      // Self-healing: Order is marked settlement, but active grant is missing
      logger.info(
        "Self-healing: Recreating missing access grant for settled order",
        {
          orderId: order.id,
          orderNumber: order.order_number,
        }
      );

      const validUntil = new Date(
        Date.now() + 365 * 24 * 60 * 60 * 1000
      ).toISOString();

      const { data: healedGrant, error: healError } = await supabase
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

      if (healError || !healedGrant) {
        captureError(healError, {
          action: "processMidtransWebhook.healGrant",
          orderId: order.id,
        });

        return {
          success: false,
          statusCode: 500,
          status: "grant_creation_failed",
          error: "Gagal memulihkan lisensi akses pernikahan.",
        };
      }

      return {
        success: true,
        statusCode: 200,
        status: "healed_grant_created",
        orderId: order.id,
        orderNumber: order.order_number,
        weddingId: order.wedding_id,
        entitlementActivated: true,
      };
    }

    // 8. Handle Settlement / Payment Success (Activate License)
    if (isSettled) {
      // 8a. Check if active grant already exists for this wedding
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

          // Fail-closed: do NOT mark order as settlement if grant creation fails, return 500 to allow provider retry
          return {
            success: false,
            statusCode: 500,
            status: "grant_creation_failed",
            error: "Gagal membuat lisensi akses pernikahan.",
          };
        }

        grantId = newGrant.id;

        // 8b. Audit log in activity_logs
        await supabase.from("activity_logs").insert({
          wedding_id: order.wedding_id,
          user_id: order.user_id,
          action: "license.activated",
          entity_type: "access_grant",
          entity_id: grantId,
          details: {
            orderNumber: order.order_number,
            amount: order.amount,
            paymentType: payload.payment_type,
            validUntil,
          },
        });
      }

      // 8c. Update checkout_orders only after grant is verified/created
      const { error: updateOrderError } = await supabase
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

      if (updateOrderError) {
        captureError(updateOrderError, {
          action: "processMidtransWebhook.updateOrderSettlement",
          orderId: order.id,
        });

        return {
          success: false,
          statusCode: 500,
          status: "order_update_failed",
          error: "Gagal memperbarui status pesanan menjadi settlement.",
        };
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

    // 9. Handle Refund / Chargeback (Revoke License)
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

    // 10. Handle Pending, Expire, Cancel, Deny
    let mappedStatus: PaymentStatus = "pending";
    if (txnStatus === "expire") mappedStatus = "expire";
    else if (txnStatus === "cancel") mappedStatus = "cancel";
    else if (txnStatus === "deny") mappedStatus = "deny";

    // Guard: Do not allow late pending/deny notifications to downgrade an already settled order
    if (order.status === "settlement") {
      logger.warn(
        "Ignored late non-settlement notification for already settled order",
        {
          orderNumber: order.order_number,
          incomingStatus: mappedStatus,
          providerStatus: txnStatus,
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
