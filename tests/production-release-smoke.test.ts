import { describe, it, expect, vi } from "vitest";
import { GET as healthHandler } from "../src/app/api/health/route";
import {
  calculateCountdown,
  calculateReadinessScore,
} from "../src/features/overview/calculations";
import {
  calculateAccessStateDetails,
  formatReceiptNumber,
} from "../src/features/payments/support";
import { PRICING_TIERS } from "../src/features/payments/pricing";
import { generateCSV } from "../src/lib/csv-export";
import { sanitizePayload } from "../src/lib/observability/sanitize";
import type { WorkspaceEntitlement } from "../src/features/payments/types";

vi.mock("server-only", () => ({}));

describe("Final Release Smoke Test: Health & Uptime Endpoint", () => {
  it("verifies production health check returns structured payload", async () => {
    // In configured production environment:
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-anon-key";

    const res = await healthHandler();
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.status).toBe("healthy");
    expect(data.service).toBe("patemon-wedding-planner");
    expect(data.version).toBe("1.0.0");
    expect(data.checks.application).toBe("ok");
    expect(data.checks.databaseConfigured).toBe(true);
  });
});

describe("Final Release Smoke Test: Monetization, Pricing & Receipt Engine", () => {
  it("enforces fixed server-side single-fee pricing of Rp 199.000 (PRD 5.1)", () => {
    const fullTier = PRICING_TIERS.find((t) => t.id === "full");
    expect(fullTier).toBeDefined();
    expect(fullTier?.price).toBe(199000);
    expect(fullTier?.tagline).toBeDefined();

    const freeTier = PRICING_TIERS.find((t) => t.id === "preview");
    expect(freeTier).toBeDefined();
    expect(freeTier?.price).toBe(0);
  });

  it("formats deterministic digital receipt numbers with KW- prefix", () => {
    expect(formatReceiptNumber("WED123-ABC")).toBe("KW-WED123-ABC");
    expect(formatReceiptNumber("ORDER-999-XYZ")).toBe("KW-ORDER-999-XYZ");
  });

  it("validates all 6 entitlement lifecycle states and data sovereignty guarantees", () => {
    const baseEntitlement: WorkspaceEntitlement = {
      weddingId: "wed-smoke",
      status: "active",
      isPaid: true,
      isDemo: false,
      grantedAt: "2026-11-14",
      validUntil: "2027-11-14",
      canEdit: true,
      canInviteMembers: true,
      canExportCSV: true,
      planName: "Paket Pawiwahan Penuh",
      badgeLabel: "Aktif",
      daysRemaining: 365,
    };

    // 1. Active Lifetime / Long-term
    const activeDetails = calculateAccessStateDetails(baseEntitlement);
    expect(activeDetails.state).toBe("active_lifetime");
    expect(activeDetails.canExportCSV).toBe(true);
    expect(activeDetails.canEdit).toBe(true);

    // 2. Expiring soon (25 days)
    const expiringSoon = calculateAccessStateDetails({
      ...baseEntitlement,
      daysRemaining: 25,
    });
    expect(expiringSoon.state).toBe("expiring_soon");
    expect(expiringSoon.canExportCSV).toBe(true);

    // 3. Critical expiring (7 days)
    const criticalExpiring = calculateAccessStateDetails({
      ...baseEntitlement,
      daysRemaining: 7,
    });
    expect(criticalExpiring.state).toBe("critical_expiring");
    expect(criticalExpiring.canExportCSV).toBe(true);

    // 4. Free Preview
    const previewDetails = calculateAccessStateDetails({
      ...baseEntitlement,
      isPaid: false,
      status: "free_preview",
    });
    expect(previewDetails.state).toBe("free_preview");
    expect(previewDetails.canExportCSV).toBe(true);

    // 5. Expired Archive Mode (PRD 5.4 - Read-only with data sovereignty)
    const archiveDetails = calculateAccessStateDetails({
      ...baseEntitlement,
      status: "expired",
    });
    expect(archiveDetails.state).toBe("expired_archive");
    expect(archiveDetails.canEdit).toBe(false);
    expect(archiveDetails.canExportCSV).toBe(true); // Permanent data export

    // 6. Revoked (Refund / Chargeback)
    const revokedDetails = calculateAccessStateDetails({
      ...baseEntitlement,
      status: "revoked",
    });
    expect(revokedDetails.state).toBe("revoked");
    expect(revokedDetails.canEdit).toBe(false);
    expect(revokedDetails.canExportCSV).toBe(true); // Data remains user's property
  });
});

describe("Final Release Smoke Test: Countdown & Readiness Calculators", () => {
  const refDate = new Date("2026-11-14T00:00:00Z");

  it("evaluates milestone labels across countdown lifecycle", () => {
    // Future H-100
    const h100 = calculateCountdown("2027-02-22", refDate);
    expect(h100.status).toBe("upcoming");
    expect(h100.daysRemaining).toBe(100);

    // Tomorrow H-1
    const h1 = calculateCountdown("2026-11-15", refDate);
    expect(h1.status).toBe("upcoming");
    expect(h1.daysRemaining).toBe(1);
    expect(h1.milestoneLabel).toContain("H-1");

    // Today (Hari H)
    const today = calculateCountdown("2026-11-14", refDate);
    expect(today.status).toBe("today");
    expect(today.daysRemaining).toBe(0);
    expect(today.milestoneLabel).toBe("Rahina Pawiwahan (Hari H)");

    // Past (Terlaksana)
    const past = calculateCountdown("2026-11-10", refDate);
    expect(past.status).toBe("past");
    expect(past.milestoneLabel).toBe("Pawiwahan Telah Terlaksana");
  });

  it("computes comprehensive readiness score without crash on empty or full inputs", () => {
    // Empty state
    const emptyScore = calculateReadinessScore({});
    expect(emptyScore.overallScore).toBe(0);
    expect(emptyScore.level).toBe("persiapan_awal");

    // Partial state
    const partialScore = calculateReadinessScore({
      ceremonies: [
        {
          id: "c-1",
          weddingId: "w-1",
          title: "Pawiwahan",
          scheduledDate: "2026-12-01",
          location: "Umah Purusa",
          orderIndex: 1,
          personInCharge: "Pak Ketut",
          status: "confirmed",
        },
      ],
      bantenItems: [
        {
          id: "b-1",
          weddingId: "w-1",
          name: "Pejati",
          category: "Utama",
          quantity: 2,
          unit: "tanding",
          sourcingMethod: "self_made",
          status: "ready",
          assigneeName: "Ibu Kadek",
          estimatedPrice: 300000,
          actualPrice: 280000,
          notes: null,
          ceremonyTitle: "Pawiwahan",
          createdAt: "2026-11-14",
          updatedAt: "2026-11-14",
        },
      ],
    });

    expect(partialScore.overallScore).toBeGreaterThan(0);
    expect(partialScore.categories.ceremonies.score).toBe(100);
    expect(partialScore.categories.banten.score).toBe(100);
  });
});

describe("Final Release Smoke Test: Security, Privacy & Export Integrity", () => {
  it("sanitizes sensitive fields from error logs and traces", () => {
    const raw = {
      secretToken: "sb_secret_prod_12345",
      password: "secret_password",
      phone: "+62812345678",
      weddingName: "Wayan & Kadek",
    };

    const cleaned = sanitizePayload(raw);
    expect(cleaned.secretToken).toBe("[REDACTED]");
    expect(cleaned.password).toBe("[REDACTED]");
    expect(cleaned.phone).toBe("[REDACTED]");
    expect(cleaned.weddingName).toBe("Wayan & Kadek");
  });

  it("escapes CSV injection vectors and adds UTF-8 BOM", () => {
    const csv = generateCSV(
      ["Nama Tamu", "Catatan"],
      [["@Dadia Pasek", "=CMD()"]]
    );
    expect(csv.charCodeAt(0)).toBe(0xfeff); // BOM
    expect(csv).toContain('"\'@Dadia Pasek"');
    expect(csv).toContain('"\'=CMD()"');
  });
});
