import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/observability/logger", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

import {
  computeMidtransSignature,
  createSnapTransaction,
  getMidtransConfig,
  getMidtransTransactionStatus,
  verifyMidtransSignature,
} from "@/features/payments/midtrans";

const transaction = {
  transaction_details: {
    order_id: "PATEMON-CREDENTIAL-TEST",
    gross_amount: 199000,
  },
};
const notification = {
  order_id: "PATEMON-CREDENTIAL-TEST",
  status_code: "200",
  gross_amount: "199000.00",
  transaction_status: "settlement" as const,
  transaction_id: "test-transaction",
  payment_type: "qris",
  transaction_time: "2026-11-16 12:00:00",
  status_message: "Test fixture",
};

describe("Midtrans credentials and payment verification", () => {
  beforeEach(() => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("MIDTRANS_IS_PRODUCTION", "false");
    vi.stubEnv("NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION", "false");
    vi.stubEnv(
      "MIDTRANS_SNAP_URL",
      "https://app.sandbox.midtrans.com/snap/snap.js"
    );
    vi.stubEnv("MIDTRANS_SERVER_KEY", "Mid-server-test.api-only");
    vi.stubEnv(
      "MIDTRANS_SIGNATURE_SECRET_KEY",
      "Mid-server-test.signature-only"
    );
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("uses Sandbox endpoints without rewriting key characters or prefixes", () => {
    const config = getMidtransConfig();
    expect(config.serverKey).toBe("Mid-server-test.api-only");
    expect(config.snapApiUrl).toBe(
      "https://app.sandbox.midtrans.com/snap/v1/transactions"
    );
    expect(config.isMockMode).toBe(false);
  });

  it("verifies with the separate signature secret and rejects an API-key signature", () => {
    const sign = (key: string) =>
      computeMidtransSignature(
        notification.order_id,
        notification.status_code,
        notification.gross_amount,
        key
      );
    expect(
      verifyMidtransSignature({
        ...notification,
        signature_key: sign("Mid-server-test.signature-only"),
      })
    ).toBe(true);
    expect(
      verifyMidtransSignature({
        ...notification,
        signature_key: sign("Mid-server-test.api-only"),
      })
    ).toBe(false);
    expect(
      verifyMidtransSignature({
        ...notification,
        signature_key: "é".repeat(128),
      })
    ).toBe(false);
  });

  it("retains legacy verification only when no separate secret is configured", () => {
    vi.stubEnv("MIDTRANS_SIGNATURE_SECRET_KEY", "");
    const signature = computeMidtransSignature(
      notification.order_id,
      notification.status_code,
      notification.gross_amount,
      "Mid-server-test.api-only"
    );
    expect(
      verifyMidtransSignature({ ...notification, signature_key: signature })
    ).toBe(true);
  });

  it("falls back to mock token on sandbox 401 so simulation flow is available", async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(
        JSON.stringify({ error_messages: ["Unauthorized test credentials"] }),
        { status: 401 }
      )
    );
    const result = await createSnapTransaction(transaction);
    expect(result.token).toMatch(/^mock-snap-/);
    expect(result.redirect_url).toContain("/snap/v2/vtweb/mock-snap-");
    expect(fetch).toHaveBeenCalledWith(
      "https://app.sandbox.midtrans.com/snap/v1/transactions",
      expect.any(Object)
    );
  });

  it("propagates 401 in production mode without fallback", async () => {
    vi.stubEnv("MIDTRANS_IS_PRODUCTION", "true");
    vi.mocked(fetch).mockResolvedValue(
      new Response(
        JSON.stringify({ error_messages: ["Unauthorized test credentials"] }),
        { status: 401 }
      )
    );
    await expect(createSnapTransaction(transaction)).rejects.toThrow(
      "Unauthorized test credentials"
    );
  });

  it("never simulates a checkout or settled payment when credentials are missing", async () => {
    vi.stubEnv("MIDTRANS_SERVER_KEY", "");
    expect(getMidtransConfig().isMockMode).toBe(false);
    await expect(createSnapTransaction(transaction)).rejects.toThrow(
      "MIDTRANS_SERVER_KEY"
    );
    await expect(
      getMidtransTransactionStatus(notification.order_id)
    ).resolves.toBeNull();
    expect(fetch).not.toHaveBeenCalled();
  });
});
