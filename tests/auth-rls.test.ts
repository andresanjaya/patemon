import { describe, it, expect } from "vitest";
import {
  canPerformAction,
  isAuthorizedForWedding,
} from "../src/features/auth/permissions";
import fs from "fs";
import path from "path";

describe("Row Level Security & Permission Matrix", () => {
  describe("Role Permission Matrix", () => {
    it("should allow owner to perform all operations including workspace management", () => {
      expect(
        canPerformAction({
          userRole: "owner",
          action: "manage_members",
          resourceType: "member",
        })
      ).toBe(true);
      expect(
        canPerformAction({
          userRole: "owner",
          action: "delete",
          resourceType: "wedding",
        })
      ).toBe(true);
      expect(
        canPerformAction({
          userRole: "owner",
          action: "create",
          resourceType: "ceremony",
        })
      ).toBe(true);
      expect(
        canPerformAction({
          userRole: "owner",
          action: "update",
          resourceType: "budget",
        })
      ).toBe(true);
    });

    it("should allow editor to modify planning resources but block workspace deletion and member management", () => {
      // Allowed operations
      expect(
        canPerformAction({
          userRole: "editor",
          action: "create",
          resourceType: "ceremony",
        })
      ).toBe(true);
      expect(
        canPerformAction({
          userRole: "editor",
          action: "update",
          resourceType: "banten",
        })
      ).toBe(true);
      expect(
        canPerformAction({
          userRole: "editor",
          action: "delete",
          resourceType: "task",
        })
      ).toBe(true);

      // Blocked operations
      expect(
        canPerformAction({
          userRole: "editor",
          action: "manage_members",
          resourceType: "member",
        })
      ).toBe(false);
      expect(
        canPerformAction({
          userRole: "editor",
          action: "delete",
          resourceType: "wedding",
        })
      ).toBe(false);
      expect(
        canPerformAction({
          userRole: "editor",
          action: "update",
          resourceType: "wedding",
        })
      ).toBe(false);
    });

    it("should enforce strict read-only access for viewer role", () => {
      expect(
        canPerformAction({
          userRole: "viewer",
          action: "read",
          resourceType: "ceremony",
        })
      ).toBe(true);
      expect(
        canPerformAction({
          userRole: "viewer",
          action: "read",
          resourceType: "budget",
        })
      ).toBe(true);

      // Mutating actions must all be rejected
      expect(
        canPerformAction({
          userRole: "viewer",
          action: "create",
          resourceType: "ceremony",
        })
      ).toBe(false);
      expect(
        canPerformAction({
          userRole: "viewer",
          action: "update",
          resourceType: "banten",
        })
      ).toBe(false);
      expect(
        canPerformAction({
          userRole: "viewer",
          action: "delete",
          resourceType: "task",
        })
      ).toBe(false);
      expect(
        canPerformAction({
          userRole: "viewer",
          action: "manage_members",
          resourceType: "member",
        })
      ).toBe(false);
    });

    it("should reject any action for unauthenticated or non-member users", () => {
      expect(
        canPerformAction({
          userRole: null,
          action: "read",
          resourceType: "ceremony",
        })
      ).toBe(false);
      expect(
        canPerformAction({
          userRole: null,
          action: "create",
          resourceType: "banten",
        })
      ).toBe(false);
    });
  });

  describe("Multi-Tenant Cross-Wedding Isolation", () => {
    const userMemberships = [
      { weddingId: "wedding-alpha-123", role: "owner" as const },
      { weddingId: "wedding-beta-456", role: "viewer" as const },
    ];

    it("should grant access only to weddings where user holds active membership", () => {
      expect(
        isAuthorizedForWedding(userMemberships, "wedding-alpha-123", "owner")
      ).toBe(true);
      expect(
        isAuthorizedForWedding(userMemberships, "wedding-alpha-123", "editor")
      ).toBe(true);
      expect(
        isAuthorizedForWedding(userMemberships, "wedding-alpha-123", "viewer")
      ).toBe(true);
      expect(
        isAuthorizedForWedding(userMemberships, "wedding-beta-456", "viewer")
      ).toBe(true);
    });

    it("should reject access to weddings the user does not belong to (cross-wedding isolation)", () => {
      expect(
        isAuthorizedForWedding(userMemberships, "wedding-gamma-789", "viewer")
      ).toBe(false);
      expect(
        isAuthorizedForWedding(userMemberships, "wedding-unknown", "owner")
      ).toBe(false);
    });

    it("should reject operations requiring higher privilege than granted", () => {
      // User is only viewer in wedding-beta-456
      expect(
        isAuthorizedForWedding(userMemberships, "wedding-beta-456", "editor")
      ).toBe(false);
      expect(
        isAuthorizedForWedding(userMemberships, "wedding-beta-456", "owner")
      ).toBe(false);
    });
  });

  describe("Security Standards: Service Role Key Isolation", () => {
    it("should verify that SUPABASE_SERVICE_ROLE_KEY is never exposed with NEXT_PUBLIC_ prefix in .env.example", () => {
      const envExample = fs.readFileSync(
        path.join(process.cwd(), ".env.example"),
        "utf-8"
      );
      expect(envExample).not.toContain("NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY");
      expect(envExample).toContain("SUPABASE_SERVICE_ROLE_KEY=");
    });

    it("should verify that browser client only uses NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY", () => {
      const browserClientCode = fs.readFileSync(
        path.join(process.cwd(), "src/lib/supabase/client.ts"),
        "utf-8"
      );
      expect(browserClientCode).toContain(
        "process.env.NEXT_PUBLIC_SUPABASE_URL"
      );
      expect(browserClientCode).toContain(
        "process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY"
      );
      expect(browserClientCode).not.toContain("SUPABASE_SERVICE_ROLE_KEY");
    });

    it("should verify that admin client imports server-only to block client-side bundling", () => {
      const adminClientCode = fs.readFileSync(
        path.join(process.cwd(), "src/lib/supabase/admin.ts"),
        "utf-8"
      );
      expect(adminClientCode).toContain('import "server-only"');
      expect(adminClientCode).toContain("SUPABASE_SERVICE_ROLE_KEY");
    });
  });

  describe("SQL Migration RLS Coverage", () => {
    it("should verify that RLS is explicitly enabled on all tables in 20261114000002_auth_and_rls.sql", () => {
      const migrationSql = fs.readFileSync(
        path.join(
          process.cwd(),
          "supabase/migrations/20261114000002_auth_and_rls.sql"
        ),
        "utf-8"
      );

      const requiredTables = [
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

      for (const table of requiredTables) {
        expect(
          migrationSql,
          `Table public.${table} must have ENABLE ROW LEVEL SECURITY`
        ).toContain(`ALTER TABLE public.${table} ENABLE ROW LEVEL SECURITY;`);
      }
    });
  });
});
