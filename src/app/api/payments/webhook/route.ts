import { NextResponse } from "next/server";
import { processMidtransWebhook } from "@/features/payments/webhook";
import { logger } from "@/lib/observability/logger";
import type { MidtransNotificationPayload } from "@/features/payments/types";

/**
 * Midtrans Webhook Notification Endpoint
 * URL: /api/payments/webhook
 *
 * Receives automated server-to-server notifications from Midtrans payment gateway.
 * Verifies SHA-512 cryptographic signatures, updates order status idempotently,
 * and activates/revokes access grants per PRD 5.4.
 */
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as MidtransNotificationPayload;

    if (!body || !body.order_id || !body.status_code || !body.gross_amount) {
      logger.warn("Received malformed Midtrans webhook payload", {
        hasBody: Boolean(body),
      });

      return NextResponse.json(
        {
          success: false,
          error: "Payload webhook Midtrans tidak lengkap.",
        },
        { status: 400 }
      );
    }

    const result = await processMidtransWebhook(body);

    return NextResponse.json(
      {
        success: result.success,
        status: result.status,
        message: result.error || "Webhook diproses.",
      },
      { status: result.statusCode }
    );
  } catch (err) {
    logger.error("Failed to parse or process Midtrans webhook", {
      error: err instanceof Error ? err.message : String(err),
    });

    return NextResponse.json(
      {
        success: false,
        error: "Terjadi kesalahan internal saat memproses webhook.",
      },
      { status: 500 }
    );
  }
}
