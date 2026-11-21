import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import { createWorkspaceBreadcrumbs } from "../src/features/workspaces/components/dashboard-page-header";

describe("Issue #115: Standardized Page Titles, Breadcrumbs & Toolbars", () => {
  const rootDir = path.resolve(__dirname, "..");
  const srcDir = path.resolve(rootDir, "src");

  describe("1. Breadcrumb Hierarchy Generator", () => {
    it("generates correct 3-segment breadcrumb for workspace root (Ringkasan)", () => {
      const crumbs = createWorkspaceBreadcrumbs(
        "Wayan & Ketut",
        "w-123",
        "Ringkasan"
      );
      expect(crumbs).toHaveLength(3);

      expect(crumbs[0].label).toBe("Ruang Kerja");
      expect(crumbs[0].href).toBe("/workspaces");

      expect(crumbs[1].label).toBe("Wayan & Ketut");
      expect(crumbs[1].href).toBe("/workspace/w-123");

      expect(crumbs[2].label).toBe("Ringkasan");
      expect(crumbs[2].current).toBe(true);
      expect(crumbs[2].href).toBeUndefined();
    });

    it("generates correct breadcrumb for workspace modules (e.g. Banten, Tasks)", () => {
      const crumbs = createWorkspaceBreadcrumbs(
        "Wayan & Ketut",
        "w-123",
        "Banten & Sarana"
      );
      expect(crumbs).toHaveLength(3);

      expect(crumbs[0].label).toBe("Ruang Kerja");
      expect(crumbs[1].label).toBe("Wayan & Ketut");
      expect(crumbs[2].label).toBe("Banten & Sarana");
      expect(crumbs[2].current).toBe(true);
    });

    it("generates correct 4-segment breadcrumb for detail pages (Ceremony Detail)", () => {
      const crumbs = createWorkspaceBreadcrumbs(
        "Wayan & Ketut",
        "w-123",
        "Rencana Upacara",
        "Puncak Pawiwahan ring Merajan"
      );
      expect(crumbs).toHaveLength(4);

      expect(crumbs[0].label).toBe("Ruang Kerja");
      expect(crumbs[0].href).toBe("/workspaces");

      expect(crumbs[1].label).toBe("Wayan & Ketut");
      expect(crumbs[1].href).toBe("/workspace/w-123");

      expect(crumbs[2].label).toBe("Rencana Upacara");
      expect(crumbs[2].href).toBe("/workspace/w-123/ceremonies");

      expect(crumbs[3].label).toBe("Puncak Pawiwahan ring Merajan");
      expect(crumbs[3].current).toBe(true);
      expect(crumbs[3].href).toBeUndefined();
    });
  });

  describe("2. Component Typography and Accessibility", () => {
    const headerPath = path.resolve(
      srcDir,
      "features/workspaces/components/dashboard-page-header.tsx"
    );

    it("ensures DashboardPageHeader defines standard Metronic #101 typography", () => {
      expect(fs.existsSync(headerPath)).toBe(true);
      const content = fs.readFileSync(headerPath, "utf-8");

      // H1 Title specs: 22px / 600 / 28px
      expect(content).toContain("text-[22px]");
      expect(content).toContain("font-semibold");
      expect(content).toContain("leading-[28px]");

      // Breadcrumb specs: 14px / 400 / 20px
      expect(content).toContain("text-[14px]");
      expect(content).toContain("leading-[20px]");

      // Accessibility: aria-label="Breadcrumb", aria-hidden="true" on separator, aria-current="page" on current item
      expect(content).toContain('aria-label="Breadcrumb"');
      expect(content).toContain('aria-hidden="true"');
      expect(content).toContain('aria-current="page"');
    });
  });

  describe("3. Route Coverage Verification", () => {
    const routesToCheck = [
      {
        file: "src/app/(dashboard)/workspace/[weddingId]/page.tsx",
        name: "Ringkasan",
      },
      {
        file: "src/features/ceremonies/components/ceremony-overview-grid.tsx",
        name: "Rencana Upacara",
      },
      {
        file: "src/features/ceremonies/components/ceremony-detail-header.tsx",
        name: "Upacara Detail",
      },
      {
        file: "src/features/banten/components/banten-planner-dashboard.tsx",
        name: "Banten & Sarana",
      },
      {
        file: "src/features/checklist/components/task-dashboard.tsx",
        name: "Tugas & Checklist",
      },
      {
        file: "src/features/budget/components/budget-dashboard.tsx",
        name: "Anggaran & Biaya",
      },
      {
        file: "src/features/vendors/components/vendor-dashboard.tsx",
        name: "Vendor",
      },
      {
        file: "src/features/guests/components/guest-dashboard.tsx",
        name: "Tamu",
      },
      {
        file: "src/features/rundown/components/rundown-dashboard.tsx",
        name: "Rundown",
      },
      {
        file: "src/app/(dashboard)/workspace/[weddingId]/history/page.tsx",
        name: "Riwayat",
      },
      {
        file: "src/app/(dashboard)/workspace/[weddingId]/settings/page.tsx",
        name: "Pengaturan",
      },
      {
        file: "src/app/(dashboard)/workspace/[weddingId]/onboarding/page.tsx",
        name: "Onboarding",
      },
      {
        file: "src/app/(dashboard)/workspace/new/page.tsx",
        name: "Buat Ruang Kerja Baru",
      },
      {
        file: "src/app/(dashboard)/profile/page.tsx",
        name: "Profil",
      },
    ];

    routesToCheck.forEach(({ file, name }) => {
      it(`verifies ${name} integrates DashboardPageHeader (${file})`, () => {
        const fullPath = path.resolve(rootDir, file);
        expect(fs.existsSync(fullPath)).toBe(true);
        const content = fs.readFileSync(fullPath, "utf-8");

        expect(content).toContain("DashboardPageHeader");
      });
    });
  });
});
