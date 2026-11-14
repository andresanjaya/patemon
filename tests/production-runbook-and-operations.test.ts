import { describe, it, expect, vi } from "vitest";
import fs from "fs";
import path from "path";
import { GET as healthHandler } from "../src/app/api/health/route";
import { metadata as privacyMeta } from "../src/app/privacy/page";
import { metadata as termsMeta } from "../src/app/terms/page";
import { metadata as faqMeta } from "../src/app/faq/page";

vi.mock("server-only", () => ({}));

describe("Production Operations: Healthcheck & Uptime Monitoring", () => {
  it("responds with structured health status and checks on GET /api/health", async () => {
    const response = await healthHandler();
    expect(response).toBeDefined();

    const data = await response.json();
    expect(data.service).toBe("patemon-wedding-planner");
    expect(data.version).toBe("1.0.0");
    expect(typeof data.uptimeSeconds).toBe("number");
    expect(data.checks).toBeDefined();
    expect(data.checks.application).toBe("ok");

    // Header validation for dynamic no-cache health probes
    const cacheControl = response.headers.get("Cache-Control");
    expect(cacheControl).toContain("no-store");
  });
});

describe("Production Compliance & Help Content: Metadata & Pages", () => {
  it("defines comprehensive metadata for Privacy page aligned with UU PDP", () => {
    expect(privacyMeta.title).toBeDefined();
    expect(String(privacyMeta.title)).toContain("Kebijakan Privasi");
    expect(String(privacyMeta.description)).toContain("UU No. 27 Tahun 2022");
  });

  it("defines clear metadata for Terms of Service with license and refund policy", () => {
    expect(termsMeta.title).toBeDefined();
    expect(String(termsMeta.title)).toContain("Syarat & Ketentuan");
    expect(String(termsMeta.description)).toContain("pengembalian dana");
  });

  it("defines metadata for FAQ & Help Center covering ceremonies and banten", () => {
    expect(faqMeta.title).toBeDefined();
    expect(String(faqMeta.title)).toContain("Pusat Bantuan");
    expect(String(faqMeta.description)).toContain("pernikahan Hindu Bali");
  });
});

describe("Production Runbooks & Operational Documentation Integrity", () => {
  const rootDir = path.resolve(__dirname, "..");

  it("verifies PRODUCTION-OPERATIONAL-RUNBOOK.md contains required infrastructure and playbooks", () => {
    const runbookPath = path.resolve(
      rootDir,
      "docs/PRODUCTION-OPERATIONAL-RUNBOOK.md"
    );
    expect(fs.existsSync(runbookPath)).toBe(true);

    const content = fs.readFileSync(runbookPath, "utf-8");

    // DNS & Network Configuration
    expect(content).toContain("76.76.21.21");
    expect(content).toContain("cname.vercel-dns.com");
    expect(content).toContain("SSL/TLS");

    // Backup & Recovery
    expect(content).toContain("PITR");
    expect(content).toContain("pg_dump");
    expect(content).toContain("RTO");
    expect(content).toContain("RPO");

    // Incident Response
    expect(content).toContain("Buku Petunjuk Tanggap Insiden");
    expect(content).toContain("Midtrans");
    expect(content).toContain("Rollback");
  });

  it("verifies SUPPORT-FAQ-AND-HELP-CENTER.md contains comprehensive support policies", () => {
    const faqDocPath = path.resolve(
      rootDir,
      "docs/SUPPORT-FAQ-AND-HELP-CENTER.md"
    );
    expect(fs.existsSync(faqDocPath)).toBe(true);

    const content = fs.readFileSync(faqDocPath, "utf-8");

    expect(content).toContain("WhatsApp Support");
    expect(content).toContain("Memadik");
    expect(content).toContain("Nyentana");
    expect(content).toContain("Ngayah");
    expect(content).toContain("double-counting");
    expect(content).toContain("Kuitansi");
    expect(content).toContain("Arsip Permanen");
  });

  it("ensures Footer component integrates links to Privacy, Terms, FAQ, and Pricing", () => {
    const footerPath = path.resolve(
      rootDir,
      "src/components/layout/footer.tsx"
    );
    expect(fs.existsSync(footerPath)).toBe(true);

    const content = fs.readFileSync(footerPath, "utf-8");

    expect(content).toContain('href="/privacy"');
    expect(content).toContain('href="/terms"');
    expect(content).toContain('href="/faq"');
    expect(content).toContain('href="/pricing"');
    expect(content).toContain("Bantuan WhatsApp");
  });
});
