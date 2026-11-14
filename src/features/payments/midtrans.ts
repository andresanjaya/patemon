import "server-only";
import { logger } from "@/lib/observability/logger";
import type { SnapTransactionRequest, SnapTransactionResponse } from "./types";

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
