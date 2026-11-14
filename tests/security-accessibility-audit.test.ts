import { describe, it, expect, vi } from "vitest";
import fs from "fs";
import path from "path";
import { sanitizePayload } from "../src/lib/observability/sanitize";
import { escapeCSVCell, generateCSV } from "../src/lib/csv-export";

vi.mock("server-only", () => ({}));

describe("Security Audit: Secret Key Isolation & Leak Prevention", () => {
  const rootDir = path.resolve(__dirname, "..");
  const srcDir = path.resolve(rootDir, "src");

  it("ensures .env.example does not contain real secret keys or exposed NEXT_PUBLIC secrets", () => {
    const envExamplePath = path.resolve(rootDir, ".env.example");
    expect(fs.existsSync(envExamplePath)).toBe(true);

    const envContent = fs.readFileSync(envExamplePath, "utf-8");

    // Must not leak service role key as public
    expect(envContent).not.toContain("NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY");
    expect(envContent).not.toContain("NEXT_PUBLIC_MIDTRANS_SERVER_KEY");

    // Keys in .env.example must be placeholders
    const lines = envContent.split("\n");
    for (const line of lines) {
      if (
        line.startsWith("SUPABASE_SERVICE_ROLE_KEY=") ||
        line.startsWith("MIDTRANS_SERVER_KEY=")
      ) {
        const value = line.split("=")[1]?.trim();
        expect(value).toMatch(
          /^["']?(your-|placeholder|sb_service_role_secret|sb-mid-server-your)/i
        );
      }
    }
  });

  it("ensures client-side components ('use client') never reference server secrets", () => {
    function getFiles(dir: string): string[] {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      const files: string[] = [];
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          files.push(...getFiles(fullPath));
        } else if (/\.(ts|tsx)$/.test(entry.name)) {
          files.push(fullPath);
        }
      }
      return files;
    }

    const allSourceFiles = getFiles(srcDir);
    const clientFiles = allSourceFiles.filter((file) => {
      const content = fs.readFileSync(file, "utf-8");
      return (
        content.trim().startsWith('"use client"') ||
        content.trim().startsWith("'use client'")
      );
    });

    for (const clientFile of clientFiles) {
      const content = fs.readFileSync(clientFile, "utf-8");
      const relativePath = path.relative(rootDir, clientFile);

      expect(
        content.includes("SUPABASE_SERVICE_ROLE_KEY"),
        `Client component ${relativePath} must NOT reference SUPABASE_SERVICE_ROLE_KEY`
      ).toBe(false);

      expect(
        content.includes("MIDTRANS_SERVER_KEY"),
        `Client component ${relativePath} must NOT reference MIDTRANS_SERVER_KEY`
      ).toBe(false);

      expect(
        content.includes("NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY"),
        `File ${relativePath} references illegal NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY`
      ).toBe(false);
    }
  });
});

describe("Privacy Audit: PII & Observability Log Sanitization", () => {
  it("redacts sensitive keys including passwords, tokens, auth, credit cards, cvv, and phones", () => {
    const rawPayload = {
      id: "usr_123",
      email: "bali.couple@example.com",
      password: "SuperSecretPassword123!",
      authToken: "jwt_token_secret_value",
      creditCard: "4111-2222-3333-4444",
      cvv: "123",
      phone: "+6281234567890",
      notes: "Mohon konfirmasi Sulinggih",
    };

    const sanitized = sanitizePayload(rawPayload);

    expect(sanitized.id).toBe("usr_123");
    expect(sanitized.email).toBe("bali.couple@example.com");
    expect(sanitized.password).toBe("[REDACTED]");
    expect(sanitized.authToken).toBe("[REDACTED]");
    expect(sanitized.creditCard).toBe("[REDACTED]");
    expect(sanitized.cvv).toBe("[REDACTED]");
    expect(sanitized.phone).toBe("[REDACTED]");
    expect(sanitized.notes).toBe("Mohon konfirmasi Sulinggih");
  });

  it("redacts raw token substrings and secrets inside arbitrary string values", () => {
    const secretString =
      "Connection failed with Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9 and sb_secret_production_key_999";
    const sanitized = sanitizePayload(secretString);

    expect(sanitized).not.toContain("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9");
    expect(sanitized).not.toContain("sb_secret_production_key_999");
    expect(sanitized).toContain("[REDACTED_SECRET]");
  });

  it("recursively sanitizes deeply nested payloads and arrays", () => {
    const complexData = {
      weddingId: "wed-999",
      guests: [
        {
          name: "I Made Sudarma",
          phoneNumber: "081999888777",
          meta: {
            authSecret: "nested_secret_token",
            allergies: "None",
          },
        },
      ],
    };

    const sanitized = sanitizePayload(complexData);

    expect(sanitized.weddingId).toBe("wed-999");
    expect(sanitized.guests[0].name).toBe("I Made Sudarma");
    expect(sanitized.guests[0].phoneNumber).toBe("[REDACTED]");
    expect(sanitized.guests[0].meta.authSecret).toBe("[REDACTED]");
    expect(sanitized.guests[0].meta.allergies).toBe("None");
  });
});

describe("Injection Defense: OWASP CSV Formula Injection Mitigation", () => {
  it("escapes spreadsheet formula triggers (=, +, -, @, tabs, carriage returns)", () => {
    expect(escapeCSVCell("=cmd|'/C calc'!A0")).toBe("\"'=cmd|'/C calc'!A0\"");
    expect(escapeCSVCell("+1234567890")).toBe('"\'+1234567890"');
    expect(escapeCSVCell("@SUM(1, 2)")).toBe('"\'@SUM(1, 2)"');
    expect(escapeCSVCell("-some_text_formula")).toBe('"\'-some_text_formula"');
  });

  it("preserves regular numeric negative amounts without escaping quote", () => {
    expect(escapeCSVCell("-500000")).toBe('"-500000"');
    expect(escapeCSVCell("-12.50")).toBe('"-12.50"');
    expect(escapeCSVCell(0)).toBe('"0"');
  });

  it("handles standard RFC-4180 quote escaping and prepends UTF-8 BOM", () => {
    const headers = ["Nama Upacara", "Catatan"];
    const rows = [
      ['Upacara "Pawiwahan"', "Hadir tepat waktu"],
      ["Mapepada", "Siapkan banten"],
    ];

    const csv = generateCSV(headers, rows);

    expect(csv.charCodeAt(0)).toBe(0xfeff); // UTF-8 Byte Order Mark
    expect(csv).toContain('"Upacara ""Pawiwahan"""');
    expect(csv).toContain('"Hadir tepat waktu"');
  });
});

describe("Database Security Audit: Row Level Security (RLS) Coverage", () => {
  const migrationPath = path.resolve(
    __dirname,
    "../supabase/migrations/20261114000002_auth_and_rls.sql"
  );

  it("verifies RLS is explicitly enabled on all 20 public database tables", () => {
    expect(fs.existsSync(migrationPath)).toBe(true);
    const sql = fs.readFileSync(migrationPath, "utf-8");

    const expectedTables = [
      "profiles",
      "weddings",
      "wedding_members",
      "sources",
      "ceremony_templates",
      "ritual_catalog",
      "task_templates",
      "budget_item_templates",
      "wedding_ceremonies",
      "wedding_ritual_items",
      "wedding_tasks",
      "vendors",
      "budget_items",
      "budget_payments",
      "guests",
      "rundown_events",
      "checkout_orders",
      "payment_events",
      "access_grants",
      "activity_logs",
    ];

    for (const table of expectedTables) {
      const rlsStatement = `ALTER TABLE public.${table} ENABLE ROW LEVEL SECURITY;`;
      expect(
        sql.includes(rlsStatement),
        `Table public.${table} must have Row Level Security enabled in ${migrationPath}`
      ).toBe(true);
    }
  });

  it("verifies security helper functions and role hierarchy enforcement exist in migration", () => {
    const sql = fs.readFileSync(migrationPath, "utf-8");

    // Role helper functions
    expect(sql).toContain("CREATE OR REPLACE FUNCTION public.get_wedding_role");
    expect(sql).toContain("CREATE OR REPLACE FUNCTION public.has_wedding_role");
    expect(sql).toContain("CREATE OR REPLACE FUNCTION public.handle_new_user");

    // Security definer search path protection
    expect(sql).toContain("SECURITY DEFINER SET search_path = public");
  });
});

describe("Accessibility Audit: WCAG 2.1 AA Dialog Attributes on Modals", () => {
  const modalFiles = [
    "src/features/banten/components/banten-item-modal.tsx",
    "src/features/banten/components/catalog-picker-modal.tsx",
    "src/features/budget/components/budget-item-modal.tsx",
    "src/features/budget/components/payment-modal.tsx",
    "src/features/checklist/components/task-modal.tsx",
    "src/features/checklist/components/task-template-picker-modal.tsx",
    "src/features/guests/components/guest-modal.tsx",
    "src/features/members/components/invite-member-modal.tsx",
    "src/features/payments/components/customer-support-modal.tsx",
    "src/features/payments/components/digital-receipt-modal.tsx",
    "src/features/payments/components/upgrade-prompt-modal.tsx",
    "src/features/profile/components/delete-account-modal.tsx",
    "src/features/rundown/components/rundown-modal.tsx",
    "src/features/vendors/components/vendor-modal.tsx",
    "src/features/vendors/components/vendor-starter-modal.tsx",
  ];

  it("verifies all modal components comply with WCAG 2.1 AA dialog role and aria attributes", () => {
    for (const modalRelPath of modalFiles) {
      const fullPath = path.resolve(__dirname, "..", modalRelPath);
      expect(
        fs.existsSync(fullPath),
        `Modal file ${modalRelPath} must exist`
      ).toBe(true);

      const content = fs.readFileSync(fullPath, "utf-8");

      expect(
        content.includes('role="dialog"'),
        `Modal ${modalRelPath} must specify role="dialog"`
      ).toBe(true);

      expect(
        content.includes('aria-modal="true"'),
        `Modal ${modalRelPath} must specify aria-modal="true"`
      ).toBe(true);

      expect(
        content.includes("aria-labelledby="),
        `Modal ${modalRelPath} must specify an aria-labelledby reference`
      ).toBe(true);

      expect(
        content.includes('aria-label="Tutup'),
        `Modal ${modalRelPath} must provide an accessible close button label starting with 'aria-label="Tutup'`
      ).toBe(true);
    }
  });
});
