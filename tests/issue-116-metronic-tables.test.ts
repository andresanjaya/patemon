import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

describe("Issue #116: Metronic Inventory Table Standardization", () => {
  const rootDir = process.cwd();

  const readFile = (relativePath: string) => {
    return fs.readFileSync(path.join(rootDir, relativePath), "utf-8");
  };

  describe("1. Ringkasan Dashboard (action-center-card.tsx)", () => {
    it("renders prioritized tasks in a semantic table with Metronic styling and footer summary", () => {
      const content = readFile("src/features/overview/components/action-center-card.tsx");

      expect(content).toContain("<table");
      expect(content).toContain("<thead");
      expect(content).toContain("<tbody");
      expect(content).toContain('scope="col"');
      expect(content).toContain("divide-y divide-[#f0f0f4]");
      expect(content).toContain("bg-[#f9f9fb]");
      expect(content).toContain("Menampilkan");
      expect(content).toContain("tugas perlu perhatian");
    });
  });

  describe("2. Rencana Upacara (ceremony-overview-grid.tsx)", () => {
    it("adopts unified Metronic card container, row selection checkbox column, and footer count", () => {
      const content = readFile("src/features/ceremonies/components/ceremony-overview-grid.tsx");

      expect(content).toContain("rounded-xl border border-[#e5e5e9] bg-white");
      expect(content).toContain("<table");
      expect(content).toContain("selectedIds");
      expect(content).toContain("toggleSelectAll");
      expect(content).toContain("toggleSelectRow");
      expect(content).toContain('role="status"');
      expect(content).toContain("upacara dipilih");
      expect(content).toContain("Menampilkan");
      expect(content).toContain("prosesi upacara");
    });
  });

  describe("3. Banten & Sarana (banten-planner-dashboard.tsx)", () => {
    it("renders Metronic table card supporting grouping, row selection, and footer summary", () => {
      const content = readFile("src/features/banten/components/banten-planner-dashboard.tsx");

      expect(content).toContain("rounded-xl border border-[#e5e5e9] bg-white");
      expect(content).toContain("<table");
      expect(content).toContain("selectedIds");
      expect(content).toContain('role="status"');
      expect(content).toContain("sarana banten dipilih");
      expect(content).toContain("Menampilkan");
      expect(content).toContain("sarana banten");
    });
  });

  describe("4. Tugas & Checklist (task-dashboard.tsx)", () => {
    it("strictly separates row selection checkbox from completion checkbox", () => {
      const content = readFile("src/features/checklist/components/task-dashboard.tsx");

      expect(content).toContain("rounded-xl border border-[#e5e5e9] bg-white");
      expect(content).toContain("<table");
      expect(content).toContain("selectedIds");
      expect(content).toContain("handleToggle");
      expect(content).toContain("toggleTaskStatusAction");
      expect(content).toContain('role="status"');
      expect(content).toContain("tugas dipilih");
      expect(content).toContain("Menampilkan");
      expect(content).toContain("tugas");
    });
  });

  describe("5. Anggaran & Biaya (budget-dashboard.tsx)", () => {
    it("renders unified Metronic card with selection column, tabular currency, and payment transactions accordion", () => {
      const content = readFile("src/features/budget/components/budget-dashboard.tsx");

      expect(content).toContain("rounded-xl border border-[#e5e5e9] bg-white");
      expect(content).toContain("<table");
      expect(content).toContain('aria-label="Daftar Pos Anggaran"');
      expect(content).toContain("selectedIds");
      expect(content).toContain("toggleSelectAll");
      expect(content).toContain("toggleSelectRow");
      expect(content).toContain("tabular-nums");
      expect(content).toContain("toggleExpandPayments");
      expect(content).toContain("Riwayat Transaksi Pembayaran");
      expect(content).toContain('role="status"');
      expect(content).toContain("baris anggaran dipilih dari total");
      expect(content).toContain("Menampilkan");
      expect(content).toContain("pos pengeluaran");
    });
  });

  describe("6. Rekanan Vendor (vendor-dashboard.tsx)", () => {
    it("defaults to table view on desktop with selection checkbox and Metronic styling", () => {
      const content = readFile("src/features/vendors/components/vendor-dashboard.tsx");

      // Default viewMode must be "table"
      expect(content).toMatch(/const\s+\[viewMode,\s*setViewMode\]\s*=\s*useState<[^>]+>\(\s*["']table["']/);
      expect(content).toContain("rounded-xl border border-[#e5e5e9] bg-white");
      expect(content).toContain("<table");
      expect(content).toContain('aria-label="Daftar Rekanan Vendor"');
      expect(content).toContain("selectedIds");
      expect(content).toContain("toggleSelectAll");
      expect(content).toContain("toggleSelectRow");
      expect(content).toContain('role="status"');
      expect(content).toContain("vendor dipilih dari total");
      expect(content).toContain("Menampilkan");
      expect(content).toContain("vendor");
    });
  });

  describe("7. Tamu & Undangan (guest-dashboard.tsx)", () => {
    it("renders Metronic table with selection checkbox column, pax count, and footer summary", () => {
      const content = readFile("src/features/guests/components/guest-dashboard.tsx");

      expect(content).toContain("rounded-xl border border-[#e5e5e9] bg-white");
      expect(content).toContain("<table");
      expect(content).toContain('aria-label="Daftar Tamu dan Undangan"');
      expect(content).toContain("selectedIds");
      expect(content).toContain("toggleSelectAll");
      expect(content).toContain("toggleSelectRow");
      expect(content).toContain('role="status"');
      expect(content).toContain("tamu dipilih dari total");
      expect(content).toContain("filteredHeadcount");
      expect(content).toContain("Menampilkan");
      expect(content).toContain("tamu (Total");
    });
  });

  describe("8. Susunan Acara Rundown (rundown-dashboard.tsx)", () => {
    it("renders Metronic table with selection checkbox column, WITA times, and delay status pills", () => {
      const content = readFile("src/features/rundown/components/rundown-dashboard.tsx");

      expect(content).toContain("rounded-xl border border-[#e5e5e9] bg-white");
      expect(content).toContain("<table");
      expect(content).toContain('aria-label="Daftar Susunan Acara Rundown"');
      expect(content).toContain("selectedIds");
      expect(content).toContain("toggleSelectAll");
      expect(content).toContain("toggleSelectRow");
      expect(content).toContain('role="status"');
      expect(content).toContain("kegiatan dipilih dari total");
      expect(content).toContain("Menampilkan");
      expect(content).toContain("kegiatan rundown");
    });
  });

  describe("9. Riwayat Aktivitas & Audit Trail (activity-log-card.tsx)", () => {
    it("renders semantic read-only HTML table with actor badges, WITA timestamps, and pagination footer", () => {
      const content = readFile("src/features/activity-logs/components/activity-log-card.tsx");

      expect(content).toContain("<table");
      expect(content).toContain('aria-label="Tabel Riwayat Aktivitas & Audit Trail"');
      expect(content).toContain("Waktu (WITA)");
      expect(content).toContain("Aktor & Peran");
      expect(content).toContain("Modul & Entitas");
      expect(content).toContain("Deskripsi & Perubahan");
      expect(content).toContain("Menampilkan halaman");
      // Read-only audit table does not have selection checkboxes (as per PRD constraint)
      expect(content).not.toContain("selectedIds");
    });
  });

  describe("10. Pengaturan Anggota (member-list.tsx)", () => {
    it("renders semantic HTML table with avatar, role controls, and access status badges", () => {
      const content = readFile("src/features/members/components/member-list.tsx");

      expect(content).toContain("<table");
      expect(content).toContain('aria-label="Daftar Anggota dan Undangan Keluarga"');
      expect(content).toContain("Anggota / Profil");
      expect(content).toContain("Email Undangan");
      expect(content).toContain("Peran & Hak Akses");
      expect(content).toContain("Status Akses");
      expect(content).toContain("Menampilkan");
      expect(content).toContain("anggota keluarga terdaftar");
    });
  });

  describe("11. Pembayaran Lisensi (license-status-card.tsx)", () => {
    it("renders order history table with subtle headers, tabular Rupiah, WITA dates, and receipt button", () => {
      const content = readFile("src/features/payments/components/license-status-card.tsx");

      expect(content).toContain("<table");
      expect(content).toContain('aria-label="Riwayat Transaksi Pembayaran Lisensi"');
      expect(content).toContain("No. Pesanan");
      expect(content).toContain("Tanggal Transaksi (WITA)");
      expect(content).toContain("Nominal");
      expect(content).toContain("Metode Pembayaran");
      expect(content).toContain("Status Pembayaran");
      expect(content).toContain("tabular-nums");
      expect(content).toContain("Total");
      expect(content).toContain("transaksi pembayaran lisensi tercatat");
    });
  });

  describe("12. Detail Upacara Banten (ceremony-banten-manager.tsx)", () => {
    it("renders ceremony-specific ritual banten list as a clean semantic Metronic table", () => {
      const content = readFile("src/features/ceremonies/components/ceremony-banten-manager.tsx");

      expect(content).toContain("<table");
      expect(content).toContain('aria-label="Daftar Kebutuhan Banten Upacara"');
      expect(content).toContain("Banten & Kategori");
      expect(content).toContain("Pengadaan & Jumlah");
      expect(content).toContain("Status Kesiapan");
      expect(content).toContain("PIC");
      expect(content).toContain("Estimasi Biaya");
      expect(content).toContain("Menampilkan");
      expect(content).toContain("kebutuhan banten upacara");
    });
  });

  describe("13. Domain & Cultural Guardrails", () => {
    it("does not leak fake e-commerce terminology from Metronic template", () => {
      const filesToCheck = [
        "src/features/overview/components/action-center-card.tsx",
        "src/features/ceremonies/components/ceremony-overview-grid.tsx",
        "src/features/banten/components/banten-planner-dashboard.tsx",
        "src/features/checklist/components/task-dashboard.tsx",
        "src/features/budget/components/budget-dashboard.tsx",
        "src/features/vendors/components/vendor-dashboard.tsx",
        "src/features/guests/components/guest-dashboard.tsx",
        "src/features/rundown/components/rundown-dashboard.tsx",
      ];

      for (const file of filesToCheck) {
        const text = readFile(file).toLowerCase();
        expect(text).not.toContain("stock planner");
        expect(text).not.toContain("shipping carrier");
        expect(text).not.toContain("warehouse inventory");
        expect(text).not.toContain("stock rating");
      }
    });
  });
});
