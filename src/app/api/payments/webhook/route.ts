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

/**
 * GET and HEAD handlers to support Midtrans Dashboard "Test Notification URL" ping probes
 * and uptime verification checks.
 */
export async function HEAD() {
  return new Response(null, {
    status: 200,
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate",
    },
  });
}

export async function GET() {
  return NextResponse.json(
    {
      status: "ok",
      endpoint: "/api/payments/webhook",
      service: "patemon-midtrans-webhook",
      message:
        "Midtrans Webhook endpoint is active and listening for POST notifications.",
      timestamp: new Date().toISOString(),
    },
    {
      status: 200,
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    }
  );
}

export async function POST(request: Request) {
  try {
    let body: MidtransNotificationPayload | null = null;
    try {
      body = (await request.json()) as MidtransNotificationPayload;
    } catch {
      // Body may be empty or not JSON (e.g. simple ping probes from dashboard tests)
    }

    // Handle empty body / simple ping probes from dashboard tests gracefully
    if (!body || (!body.order_id && !body.transaction_id)) {
      return NextResponse.json(
        {
          success: true,
          status: "test_probe_acknowledged",
          message: "Midtrans webhook ping acknowledged (HTTP 200 OK).",
        },
        { status: 200 }
      );
    }

    // Handle Midtrans Dashboard "Test Notification URL" probes gracefully
    const orderIdLower = String(body.order_id || "").toLowerCase();
    const transactionIdLower = String(body.transaction_id || "").toLowerCase();
    const isTestProbe =
      orderIdLower.includes("test") ||
      orderIdLower.includes("dummy") ||
      orderIdLower.includes("sample") ||
      orderIdLower.includes("probe") ||
      orderIdLower.includes("trial") ||
      orderIdLower === "order-id-test" ||
      transactionIdLower.includes("test") ||
      transactionIdLower === "test-transaction-id";

    if (isTestProbe) {
      logger.info("Acknowledged Midtrans dashboard test notification probe", {
        orderId: body.order_id,
        statusCode: body.status_code,
        grossAmount: body.gross_amount,
      });

      return NextResponse.json(
        {
          success: true,
          status: "test_probe_acknowledged",
          message:
            "Test notification received successfully from Midtrans Dashboard (HTTP 200 OK).",
        },
        { status: 200 }
      );
    }

    if (!body.order_id || !body.status_code || !body.gross_amount) {
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
