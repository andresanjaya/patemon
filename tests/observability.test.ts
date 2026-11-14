import { describe, it, expect, vi } from "vitest";
import { sanitizePayload } from "../src/lib/observability/sanitize";
import { captureError, log } from "../src/lib/observability/logger";
import fs from "fs";
import path from "path";

describe("Observability & Sensitive Payload Sanitization", () => {
  describe("Payload Sanitizer", () => {
    it("should redact sensitive object keys such as password, token, secret, and phone", () => {
      const rawPayload = {
        userId: "usr_123",
        weddingId: "wed_456",
        password: "super-secret-password",
        token: "jwt.token.here",
        authToken: "bearer 123",
        secretKey: "sb_secret_example",
        phone: "+6281234567890",
        guestName: "I Wayan Dharma",
        status: "active",
      };

      const sanitized = sanitizePayload(rawPayload) as Record<string, unknown>;

      expect(sanitized.userId).toBe("usr_123");
      expect(sanitized.weddingId).toBe("wed_456");
      expect(sanitized.guestName).toBe("I Wayan Dharma");
      expect(sanitized.status).toBe("active");

      // Sensitive fields must be redacted
      expect(sanitized.password).toBe("[REDACTED]");
      expect(sanitized.token).toBe("[REDACTED]");
      expect(sanitized.authToken).toBe("[REDACTED]");
      expect(sanitized.secretKey).toBe("[REDACTED]");
      expect(sanitized.phone).toBe("[REDACTED]");
    });

    it("should redact sensitive patterns found in string messages", () => {
      const rawMessage =
        "Failed to connect using secret sb_secret_mock_sample_value_for_testing_purposes and header Bearer eyJhbGciOi...";
      const sanitized = sanitizePayload(rawMessage);

      expect(sanitized).not.toContain(
        "sb_secret_mock_sample_value_for_testing_purposes"
      );
      expect(sanitized).toContain("[REDACTED_SECRET]");
    });

    it("should handle nested arrays and objects recursively", () => {
      const complexData = {
        weddingId: "w1",
        members: [
          { name: "Ketut", role: "editor", phone: "0812345678" },
          { name: "Wayan", role: "viewer", creditCard: "4111222233334444" },
        ],
      };

      const sanitized = sanitizePayload(complexData) as {
        weddingId: string;
        members: Array<Record<string, unknown>>;
      };

      expect(sanitized.weddingId).toBe("w1");
      expect(sanitized.members[0].phone).toBe("[REDACTED]");
      expect(sanitized.members[1].creditCard).toBe("[REDACTED]");
      expect(sanitized.members[0].name).toBe("Ketut");
    });
  });

  describe("Structured Logger & Error Capture", () => {
    it("should produce structured sanitized log output without throwing", () => {
      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      const result = captureError(new Error("Database connection timeout"), {
        weddingId: "wed_789",
        supabaseKey: "sb_secret_test123",
      });

      expect(result.level).toBe("error");
      expect(result.message).toBe("Database connection timeout");
      expect(result.context?.weddingId).toBe("wed_789");
      expect(result.context?.supabaseKey).toBe("[REDACTED]");

      consoleSpy.mockRestore();
    });

    it("should record log levels correctly", () => {
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
      const infoLog = log("info", "Workflow completed", { step: "onboarding" });

      expect(infoLog.level).toBe("info");
      expect(infoLog.message).toBe("Workflow completed");
      expect(infoLog.context?.step).toBe("onboarding");

      consoleSpy.mockRestore();
    });
  });

  describe("CI/CD Configuration Verification", () => {
    it("should verify that .github/workflows/ci.yml exists and configures PR validation", () => {
      const workflowPath = path.join(process.cwd(), ".github/workflows/ci.yml");
      expect(fs.existsSync(workflowPath)).toBe(true);

      const workflowContent = fs.readFileSync(workflowPath, "utf-8");
      expect(workflowContent).toContain("pull_request:");
      expect(workflowContent).toContain("pnpm format:check");
      expect(workflowContent).toContain("pnpm lint");
      expect(workflowContent).toContain("pnpm typecheck");
      expect(workflowContent).toContain("pnpm test");
      expect(workflowContent).toContain("pnpm build");
    });
  });
});
