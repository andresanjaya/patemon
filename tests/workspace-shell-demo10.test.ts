import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

describe("Demo 10 Workspace Shell & Navigation Architecture (Issue #77)", () => {
  const rootDir = path.resolve(__dirname, "..");
  const srcDir = path.resolve(rootDir, "src");

  describe("AppShell Route Segregation Contract", () => {
    const appShellPath = path.resolve(
      srcDir,
      "components/layout/app-shell.tsx"
    );

    it("verifies app-shell.tsx exists and is a client component", () => {
      expect(fs.existsSync(appShellPath)).toBe(true);
      const content = fs.readFileSync(appShellPath, "utf-8");
      expect(content).toContain('"use client"');
      expect(content).toContain("export function AppShell");
    });

    it("correctly segregates workspace dashboard routes from public marketing routes", () => {
      const content = fs.readFileSync(appShellPath, "utf-8");

      // Logic check: matches /workspace/ except /workspace/new
      expect(content).toContain('pathname.startsWith("/workspace/")');
      expect(content).toContain('!pathname.startsWith("/workspace/new")');

      // Helper function replicating AppShell's route matching logic
      function isWorkspaceDashboard(pathname: string): boolean {
        return Boolean(
          pathname &&
          pathname.startsWith("/workspace/") &&
          !pathname.startsWith("/workspace/new")
        );
      }

      // Workspace dashboard routes (must NOT render public navbar/footer)
      expect(isWorkspaceDashboard("/workspace/w-123")).toBe(true);
      expect(isWorkspaceDashboard("/workspace/w-123/ceremonies")).toBe(true);
      expect(isWorkspaceDashboard("/workspace/w-123/ceremonies/c-456")).toBe(
        true
      );
      expect(isWorkspaceDashboard("/workspace/w-123/banten")).toBe(true);
      expect(isWorkspaceDashboard("/workspace/w-123/budget")).toBe(true);
      expect(isWorkspaceDashboard("/workspace/w-123/settings")).toBe(true);
      expect(isWorkspaceDashboard("/workspace/demo")).toBe(true);

      // Public / Marketing / Creation routes (MUST render public navbar/footer)
      expect(isWorkspaceDashboard("/")).toBe(false);
      expect(isWorkspaceDashboard("/pricing")).toBe(false);
      expect(isWorkspaceDashboard("/faq")).toBe(false);
      expect(isWorkspaceDashboard("/privacy")).toBe(false);
      expect(isWorkspaceDashboard("/terms")).toBe(false);
      expect(isWorkspaceDashboard("/login")).toBe(false);
      expect(isWorkspaceDashboard("/register")).toBe(false);
      expect(isWorkspaceDashboard("/profile")).toBe(false);
      expect(isWorkspaceDashboard("/workspaces")).toBe(false);
      expect(isWorkspaceDashboard("/workspace/new")).toBe(false);
    });

    it("ensures root layout.tsx delegates to AppShell", () => {
      const layoutPath = path.resolve(srcDir, "app/layout.tsx");
      const content = fs.readFileSync(layoutPath, "utf-8");
      expect(content).toContain("<AppShell>{children}</AppShell>");
      expect(content).not.toContain("<Navbar />");
      expect(content).not.toContain("<Footer />");
    });
  });

  describe("WorkspaceLayout & WorkspaceShell Design Specifications", () => {
    const layoutPath = path.resolve(
      srcDir,
      "app/(dashboard)/workspace/[weddingId]/layout.tsx"
    );
    const shellPath = path.resolve(
      srcDir,
      "features/workspaces/components/workspace-shell.tsx"
    );

    it("verifies shared workspace layout exists and loads server state", () => {
      expect(fs.existsSync(layoutPath)).toBe(true);
      const content = fs.readFileSync(layoutPath, "utf-8");
      expect(content).toContain(
        "export default async function WorkspaceLayout"
      );
      expect(content).toContain("getWeddingWorkspace");
      expect(content).toContain("getUserWorkspaces");
      expect(content).toContain("getWorkspaceEntitlement");
      expect(content).toContain("<WorkspaceShell");
    });

    it("verifies WorkspaceShell implements Metronic Demo 10 dimensions and styles", () => {
      expect(fs.existsSync(shellPath)).toBe(true);
      const content = fs.readFileSync(shellPath, "utf-8");

      // Desktop fixed sidebar (270px)
      expect(content).toContain("w-[270px]");
      expect(content).toContain("bg-zinc-950");
      expect(content).toContain("lg:flex");

      // Mobile header (60px)
      expect(content).toContain("h-[60px]");
      expect(content).toContain("lg:hidden");

      // Content canvas (white/light canvas with desktop left margin and rounded corners)
      expect(content).toContain("lg:pl-[270px]");
      expect(content).toContain("lg:rounded-tl-2xl");
      expect(content).toContain("lg:rounded-bl-2xl");

      // Accessibility skip link targeting #main-content
      expect(content).toContain('href="#main-content"');
      expect(content).toContain("Loncat ke konten utama");
      expect(content).toContain('id="main-content"');

      // Mobile drawer with modal attributes, Escape key, and close button
      expect(content).toContain('aria-label="Buka menu navigasi"');
      expect(content).toContain('aria-label="Tutup menu navigasi"');
      expect(content).toContain('role="dialog"');
      expect(content).toContain('aria-modal="true"');
      expect(content).toContain('event.key === "Escape"');

      // Touch target size >= 44px on mobile
      expect(content).toContain("min-h-[44px]");
    });

    it("verifies all 9 core navigation items are defined in WorkspaceShell", () => {
      const content = fs.readFileSync(shellPath, "utf-8");

      const requiredItems = [
        "Ringkasan",
        "Rencana Upacara",
        "Banten & Sarana",
        "Tugas & Checklist",
        "Anggaran",
        "Vendor",
        "Tamu",
        "Rundown",
        "Pengaturan",
      ];

      for (const item of requiredItems) {
        expect(content).toContain(`label: "${item}"`);
      }
    });

    it("verifies workspace switcher and user profile are integrated into sidebar", () => {
      const content = fs.readFileSync(shellPath, "utf-8");
      expect(content).toContain("Pilih Ruang Kerja Pawiwahan");
      expect(content).toContain("Ganti Ruang Kerja");
      expect(content).toContain("Buat Ruang Kerja Baru");
      expect(content).toContain("/workspace/new");
      expect(content).toContain("/profile");
      expect(content).toContain("signOutAction");
    });
  });

  describe("Audit: No Duplicate WorkspaceHeader or Headers in Dashboard Pages", () => {
    const workspacePages = [
      "app/(dashboard)/workspace/[weddingId]/page.tsx",
      "app/(dashboard)/workspace/[weddingId]/banten/page.tsx",
      "app/(dashboard)/workspace/[weddingId]/budget/page.tsx",
      "app/(dashboard)/workspace/[weddingId]/ceremonies/page.tsx",
      "app/(dashboard)/workspace/[weddingId]/ceremonies/[ceremonyId]/page.tsx",
      "app/(dashboard)/workspace/[weddingId]/guests/page.tsx",
      "app/(dashboard)/workspace/[weddingId]/onboarding/page.tsx",
      "app/(dashboard)/workspace/[weddingId]/rundown/page.tsx",
      "app/(dashboard)/workspace/[weddingId]/settings/page.tsx",
      "app/(dashboard)/workspace/[weddingId]/tasks/page.tsx",
      "app/(dashboard)/workspace/[weddingId]/vendors/page.tsx",
    ];

    it("ensures none of the 11 workspace pages render duplicate WorkspaceHeader", () => {
      for (const pageRelPath of workspacePages) {
        const fullPath = path.resolve(srcDir, pageRelPath);
        expect(fs.existsSync(fullPath)).toBe(true);

        const content = fs.readFileSync(fullPath, "utf-8");
        expect(content).not.toContain("<WorkspaceHeader");
        expect(content).not.toContain(
          'from "@/features/workspaces/components/workspace-header"'
        );
      }
    });
  });

  describe("CTA Buka Dashboard on Public Navbar & License Status", () => {
    it("ensures public navbar includes intelligent Buka Dashboard CTA for logged in users", () => {
      const navbarPath = path.resolve(srcDir, "components/layout/navbar.tsx");
      const content = fs.readFileSync(navbarPath, "utf-8");

      expect(content).toContain("Buka Dashboard");
      expect(content).toContain("getUserWorkspaces");
      expect(content).toContain("getWorkspaceEntitlement");
      // Routes without workspace to /workspace/new
      expect(content).toContain('dashboardHref = "/workspace/new"');
      // Routes unpaid workspace to settings/package
      expect(content).toContain(
        "dashboardHref = `/workspace/${primaryWorkspace.id}/settings`"
      );
      // Routes active workspace to workspace home
      expect(content).toContain(
        "dashboardHref = `/workspace/${primaryWorkspace.id}`"
      );
    });

    it("ensures license status card provides Buka Dashboard button when paid/active", () => {
      const cardPath = path.resolve(
        srcDir,
        "features/payments/components/license-status-card.tsx"
      );
      const content = fs.readFileSync(cardPath, "utf-8");

      expect(content).toContain("entitlement.isPaid");
      expect(content).toContain("Buka Dashboard");
      expect(content).toContain("href={`/workspace/${weddingId}`}");
    });
  });

  describe("Cleanliness: No Research Dummies or Unauthorized Assets", () => {
    it("verifies no design research toggle, mock counters, or dummy links in production shell", () => {
      const shellPath = path.resolve(
        srcDir,
        "features/workspaces/components/workspace-shell.tsx"
      );
      const content = fs.readFileSync(shellPath, "utf-8");

      expect(content).not.toContain("Hasil analisis");
      expect(content).not.toContain("Panduan desain");
      expect(content).not.toContain("Pemetaan ke Patemon");
      expect(content).not.toContain("palette-toggle");
    });
  });
});
