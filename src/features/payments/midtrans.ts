import "server-only";
import crypto from "crypto";
import { logger } from "@/lib/observability/logger";
import type {
  SnapTransactionRequest,
  SnapTransactionResponse,
  MidtransNotificationPayload,
} from "./types";

/**
 * Midtrans Configuration & Environment Resolution
 * Strictly server-side: MIDTRANS_SERVER_KEY must never be exposed to client bundles.
 */
export function getMidtransConfig() {
  const isProduction =
    process.env.MIDTRANS_IS_PRODUCTION === "true" ||
    (process.env.NODE_ENV === "production" &&
      process.env.NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION === "true");

  const serverKey = process.env.MIDTRANS_SERVER_KEY || "";
  const clientKey = process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || "";

  const snapApiUrl = isProduction
    ? "https://app.midtrans.com/snap/v1/transactions"
    : "https://app.sandbox.midtrans.com/snap/v1/transactions";

  const snapScriptUrl =
    process.env.MIDTRANS_SNAP_URL ||
    (isProduction
      ? "https://app.midtrans.com/snap/snap.js"
      : "https://app.sandbox.midtrans.com/snap/snap.js");

  const isMockMode =
    !serverKey ||
    serverKey.includes("your-server-key") ||
    serverKey.startsWith("mock-") ||
    process.env.NODE_ENV === "test";

  return {
    isProduction,
    serverKey,
    clientKey,
    snapApiUrl,
    snapScriptUrl,
    isMockMode,
  };
}

/**
 * Create Midtrans Snap Transaction Token & Redirect URL
 * Uses native fetch with HTTP Basic Auth.
 * Falls back to deterministic mock token in test/dev simulation environments.
 */
export async function createSnapTransaction(
  payload: SnapTransactionRequest
): Promise<SnapTransactionResponse> {
  const config = getMidtransConfig();

  logger.info("Initiating Midtrans Snap transaction creation", {
    orderId: payload.transaction_details.order_id,
    grossAmount: payload.transaction_details.gross_amount,
    isProduction: config.isProduction,
    isMockMode: config.isMockMode,
  });

  // Mock / Sandbox simulation fallback when server key is not configured or in test suite
  if (config.isMockMode) {
    const rawId = payload.transaction_details.order_id;
    const hex = Buffer.from(rawId).toString("hex").padEnd(32, "0").slice(0, 32);
    const mockToken = `mock-snap-${hex}`;
    const mockRedirectUrl = `${config.snapApiUrl.replace("/snap/v1/transactions", "")}/snap/v2/vtweb/${mockToken}`;

    logger.info("Generated mock Midtrans Snap transaction token", {
      orderId: rawId,
      mockToken,
    });

    return {
      token: mockToken,
      redirect_url: mockRedirectUrl,
    };
  }

  // Production or live sandbox with real server key
  const basicAuth = Buffer.from(`${config.serverKey}:`).toString("base64");

  try {
    const response = await fetch(config.snapApiUrl, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Basic ${basicAuth}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorJson: { error_messages?: string[] } | null = null;
      try {
        errorJson = JSON.parse(errorText);
      } catch {
        // Ignored
      }

      const errorMessage =
        errorJson?.error_messages?.join(", ") ||
        `Midtrans API error: HTTP ${response.status} ${response.statusText}`;

      logger.error("Midtrans Snap transaction creation failed", {
        status: response.status,
        error: errorMessage,
        orderId: payload.transaction_details.order_id,
      });

      throw new Error(errorMessage);
    }

    const data = (await response.json()) as SnapTransactionResponse;

    logger.info("Midtrans Snap transaction created successfully", {
      orderId: payload.transaction_details.order_id,
      tokenLength: data.token?.length,
    });

    return data;
  } catch (err) {
    logger.error(
      "Network or unexpected error creating Midtrans Snap transaction",
      {
        orderId: payload.transaction_details.order_id,
        error: err instanceof Error ? err.message : String(err),
      }
    );
    throw err;
  }
}

/**
 * Computes the official Midtrans SHA-512 signature key.
 * Formula: SHA512(order_id + status_code + gross_amount + ServerKey)
 */
export function computeMidtransSignature(
  orderId: string,
  statusCode: string,
  grossAmount: string,
  serverKey: string
): string {
  const rawString = `${orderId}${statusCode}${grossAmount}${serverKey}`;
  return crypto.createHash("sha512").update(rawString).digest("hex");
}

/**
 * Verifies the authenticity of a Midtrans webhook notification.
 * Uses timing-safe string comparison to mitigate timing attacks.
 */
export function verifyMidtransSignature(
  payload: MidtransNotificationPayload,
  serverKeyOverride?: string
): boolean {
  const config = getMidtransConfig();
  const serverKey = serverKeyOverride || config.serverKey;

  // In test / mock simulation mode without a real key
  if (
    config.isMockMode &&
    (!serverKey || serverKey.includes("your-server-key"))
  ) {
    // If incoming signature starts with "mock-", consider valid for test purposes
    if (payload.signature_key?.startsWith("mock-")) {
      return true;
    }
  }

  if (!serverKey) {
    logger.warn("Midtrans signature verification skipped: no server key found");
    return false;
  }

  if (!payload.signature_key) {
    logger.warn("Midtrans signature verification failed: empty signature_key");
    return false;
  }

  const expectedSignature = computeMidtransSignature(
    payload.order_id,
    payload.status_code,
    payload.gross_amount,
    serverKey
  );

  if (expectedSignature.length !== payload.signature_key.length) {
    return false;
  }

  try {
    return crypto.timingSafeEqual(
      Buffer.from(expectedSignature, "utf8"),
      Buffer.from(payload.signature_key, "utf8")
    );
  } catch {
    return false;
  }
}

/**
 * Fetches transaction status directly from Midtrans Core API.
 * Used for manual reconciliation and status re-verification.
 */
export async function getMidtransTransactionStatus(
  orderNumber: string
): Promise<MidtransNotificationPayload | null> {
  const config = getMidtransConfig();

  logger.info("Fetching transaction status from Midtrans Core API", {
    orderNumber,
    isProduction: config.isProduction,
    isMockMode: config.isMockMode,
  });

  if (config.isMockMode) {
    return {
      order_id: orderNumber,
      status_code: "200",
      gross_amount: "199000.00",
      transaction_status: "settlement",
      transaction_id: `mock-txn-${orderNumber}`,
      status_message: "Success, transaction is found",
      payment_type: "qris",
      signature_key: `mock-sig-${orderNumber}`,
      transaction_time: new Date().toISOString(),
      settlement_time: new Date().toISOString(),
    };
  }

  const statusUrl = config.isProduction
    ? `https://api.midtrans.com/v2/${orderNumber}/status`
    : `https://api.sandbox.midtrans.com/v2/${orderNumber}/status`;

  const basicAuth = Buffer.from(`${config.serverKey}:`).toString("base64");

  try {
    const response = await fetch(statusUrl, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Basic ${basicAuth}`,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      logger.warn("Midtrans status check returned non-200", {
        orderNumber,
        status: response.status,
      });
      return null;
    }

    return (await response.json()) as MidtransNotificationPayload;
  } catch (err) {
    logger.error("Failed to query Midtrans transaction status", {
      orderNumber,
      error: err instanceof Error ? err.message : String(err),
    });
    return null;
  }
}
