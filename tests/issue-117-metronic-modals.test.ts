import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

describe("Issue #117: Metronic Two-Panel Modal Standardization", () => {
  const readComponent = (relativePath: string) => {
    const fullPath = path.resolve(process.cwd(), relativePath);
    return fs.readFileSync(fullPath, "utf-8");
  };

  // Tailwind formatting can reorder classes; require all tokens on one element.
  const expectClasses = (code: string, classes: string) => {
    const attributes = [...code.matchAll(/className="([^"]*)"/g)];
    expect(
      attributes.some(([, value]) =>
        classes.split(" ").every((token) => value.split(/\s+/).includes(token))
      )
    ).toBe(true);
  };

  describe("Primary Two-Panel Modals Layout & Structure", () => {
    it("standardizes BantenItemModal with Metronic 2-panel layout, sticky footer, and accessibility attributes", () => {
      const code = readComponent(
        "src/features/banten/components/banten-item-modal.tsx"
      );
      expect(code).toContain('role="dialog"');
      expect(code).toContain('aria-modal="true"');
      expect(code).toContain('aria-labelledby="banten-modal-title"');
      expect(code).toContain('aria-label="Tutup"');
      expect(code).toMatch(/lg:grid-cols-12/);
      expect(code).toMatch(/lg:col-span-7/);
      expect(code).toMatch(/lg:col-span-5/);
      expect(code).toMatch(/lg:border-l/);
      expectClasses(code, "border-t border-[#f0f0f4]");
      expectClasses(code, "shrink-0 bg-[#fbfbfd]");
      expect(code).toContain("Detail & Edit Kebutuhan Banten");
    });

    it("standardizes BantenReviewModal with Metronic 2-panel layout and dresta guideline card", () => {
      const code = readComponent(
        "src/features/banten/components/banten-review-modal.tsx"
      );
      expect(code).toContain('role="dialog"');
      expect(code).toContain('aria-modal="true"');
      expect(code).toContain('aria-labelledby="banten-review-modal-title"');
      expect(code).toContain('aria-label="Tutup"');
      expect(code).toMatch(/lg:grid-cols-12/);
      expect(code).toMatch(/lg:col-span-7/);
      expect(code).toMatch(/lg:col-span-5/);
      expect(code).toMatch(/lg:border-l/);
      expectClasses(code, "border-t border-[#f0f0f4]");
      expectClasses(code, "shrink-0 bg-[#fbfbfd]");
      expect(code).toContain("Tinjauan Adat & Dresta Keluarga");
      expect(code).toContain("Identitas Sarana Upakara");
      expect(code).toContain("Panduan Dresta Keluarga");
    });

    it("standardizes TaskModal with Metronic 2-panel layout and PIC assignment selector", () => {
      const code = readComponent(
        "src/features/checklist/components/task-modal.tsx"
      );
      expect(code).toContain('role="dialog"');
      expect(code).toContain('aria-modal="true"');
      expect(code).toContain('aria-labelledby="task-modal-title"');
      expect(code).toContain('aria-label="Tutup"');
      expect(code).toMatch(/lg:grid-cols-12/);
      expect(code).toMatch(/lg:col-span-7/);
      expect(code).toMatch(/lg:col-span-5/);
      expect(code).toMatch(/lg:border-l/);
      expectClasses(code, "border-t border-[#f0f0f4]");
      expectClasses(code, "shrink-0 bg-[#fbfbfd]");
      expect(code).toContain("Penanggung Jawab (PIC Assignment)");
      expect(code).toContain("Tenggat Waktu (Batas Tanggal)");
    });

    it("standardizes BudgetItemModal with Metronic 2-panel layout and financial variance summary", () => {
      const code = readComponent(
        "src/features/budget/components/budget-item-modal.tsx"
      );
      expect(code).toContain('role="dialog"');
      expect(code).toContain('aria-modal="true"');
      expect(code).toContain('aria-labelledby="budget-item-modal-title"');
      expect(code).toContain('aria-label="Tutup"');
      expect(code).toMatch(/lg:grid-cols-12/);
      expect(code).toMatch(/lg:col-span-7/);
      expect(code).toMatch(/lg:col-span-5/);
      expect(code).toMatch(/lg:border-l/);
      expectClasses(code, "border-t border-[#f0f0f4]");
      expectClasses(code, "shrink-0 bg-[#fbfbfd]");
      expect(code).toContain("Ringkasan Finansial Pos");
      expect(code).toContain("Rencana Biaya");
      expect(code).toContain("Realisasi / Kontrak");
    });

    it("standardizes PaymentModal with Metronic 2-panel layout and budget item snapshot", () => {
      const code = readComponent(
        "src/features/budget/components/payment-modal.tsx"
      );
      expect(code).toContain('role="dialog"');
      expect(code).toContain('aria-modal="true"');
      expect(code).toContain('aria-labelledby="payment-modal-title"');
      expect(code).toContain('aria-label="Tutup"');
      expect(code).toMatch(/lg:grid-cols-12/);
      expect(code).toMatch(/lg:col-span-7/);
      expect(code).toMatch(/lg:col-span-5/);
      expect(code).toMatch(/lg:border-l/);
      expectClasses(code, "border-t border-[#f0f0f4]");
      expectClasses(code, "shrink-0 bg-[#fbfbfd]");
      expect(code).toContain("Ringkasan Pos Anggaran");
      expect(code).toContain("Nominal Pembayaran (IDR)");
      expect(code).toContain("Proyeksi Sisa");
    });

    it("standardizes VendorModal with Metronic 2-panel layout, quote card, and budget link", () => {
      const code = readComponent(
        "src/features/vendors/components/vendor-modal.tsx"
      );
      expect(code).toContain('role="dialog"');
      expect(code).toContain('aria-modal="true"');
      expect(code).toContain('aria-labelledby="vendor-modal-title"');
      expect(code).toContain('aria-label="Tutup"');
      expect(code).toMatch(/lg:grid-cols-12/);
      expect(code).toMatch(/lg:col-span-7/);
      expect(code).toMatch(/lg:col-span-5/);
      expect(code).toMatch(/lg:border-l/);
      expectClasses(code, "border-t border-[#f0f0f4]");
      expectClasses(code, "shrink-0 bg-[#fbfbfd]");
      expect(code).toContain("Penawaran & Anggaran");
      expect(code).toContain("Sinkronkan ke Anggaran");
    });

    it("standardizes GuestModal with Metronic 2-panel layout, catering pax, and invitation status", () => {
      const code = readComponent(
        "src/features/guests/components/guest-modal.tsx"
      );
      expect(code).toContain('role="dialog"');
      expect(code).toContain('aria-modal="true"');
      expect(code).toContain('aria-labelledby="guest-modal-title"');
      expect(code).toContain('aria-label="Tutup"');
      expect(code).toMatch(/lg:grid-cols-12/);
      expect(code).toMatch(/lg:col-span-7/);
      expect(code).toMatch(/lg:col-span-5/);
      expect(code).toMatch(/lg:border-l/);
      expectClasses(code, "border-t border-[#f0f0f4]");
      expectClasses(code, "shrink-0 bg-[#fbfbfd]");
      expect(code).toContain("Nama Tamu / Kepala Keluarga");
      expect(code).toContain("Alokasi Konsumsi Pawiwahan");
      expect(code).toContain("Perkiraan Pax / Rombongan");
    });

    it("standardizes RundownModal with Metronic 2-panel layout, WITA scheduling, and day-of execution", () => {
      const code = readComponent(
        "src/features/rundown/components/rundown-modal.tsx"
      );
      expect(code).toContain('role="dialog"');
      expect(code).toContain('aria-modal="true"');
      expect(code).toContain('aria-labelledby="rundown-modal-title"');
      expect(code).toContain('aria-label="Tutup"');
      expect(code).toMatch(/lg:grid-cols-12/);
      expect(code).toMatch(/lg:col-span-7/);
      expect(code).toMatch(/lg:col-span-5/);
      expect(code).toMatch(/lg:border-l/);
      expectClasses(code, "border-t border-[#f0f0f4]");
      expectClasses(code, "shrink-0 bg-[#fbfbfd]");
      expect(code).toContain("Mulai (WITA)");
      expect(code).toContain("Selesai (WITA)");
      expect(code).toContain("Pencatatan Aktual Hari-H");
    });

    it("standardizes Custom Ceremony modal in ceremony-overview-grid with Metronic 2-panel layout", () => {
      const code = readComponent(
        "src/features/ceremonies/components/ceremony-overview-grid.tsx"
      );
      expect(code).toContain('aria-labelledby="ceremony-modal-title"');
      expect(code).toContain('aria-label="Tutup"');
      expect(code).toMatch(/lg:grid-cols-12/);
      expect(code).toMatch(/lg:col-span-7/);
      expect(code).toMatch(/lg:col-span-5/);
      expect(code).toMatch(/lg:border-l/);
      expect(code).toContain("Tambah Upacara Kustom");
      expect(code).toContain("Fase Pelaksanaan");
      expect(code).toContain("Integrasi Linimasa Adat");
    });
  });

  describe("Catalog & Template Picker Modals Shell Consistency", () => {
    it("ensures TaskTemplatePickerModal follows the Metronic shell with header, scrollable body, and sticky footer", () => {
      const code = readComponent(
        "src/features/checklist/components/task-template-picker-modal.tsx"
      );
      expect(code).toContain('role="dialog"');
      expect(code).toContain('aria-modal="true"');
      expect(code).toContain('aria-labelledby="task-template-picker-title"');
      expect(code).toContain('aria-label="Tutup"');
      expectClasses(code, "px-6 py-4 border-b");
      expectClasses(code, "px-6 py-3.5 border-t");
      expectClasses(code, "flex-1 overflow-y-auto");
    });

    it("ensures VendorStarterModal follows the Metronic shell with header, scrollable body, and sticky footer", () => {
      const code = readComponent(
        "src/features/vendors/components/vendor-starter-modal.tsx"
      );
      expect(code).toContain('role="dialog"');
      expect(code).toContain('aria-modal="true"');
      expect(code).toContain('aria-labelledby="vendor-starter-title"');
      expect(code).toContain('aria-label="Tutup"');
      expectClasses(code, "px-6 py-4 border-b");
      expectClasses(code, "px-6 py-3.5 border-t");
      expectClasses(code, "flex-1 overflow-y-auto");
    });

    it("ensures CatalogPickerModal follows the Metronic shell with header, search subheader, and sticky footer", () => {
      const code = readComponent(
        "src/features/banten/components/catalog-picker-modal.tsx"
      );
      expect(code).toContain('role="dialog"');
      expect(code).toContain('aria-modal="true"');
      expect(code).toContain('aria-labelledby="catalog-picker-title"');
      expect(code).toContain('aria-label="Tutup"');
      expectClasses(code, "px-6 py-4 border-b");
      expectClasses(code, "px-6 py-3.5 border-t");
      expectClasses(code, "flex-1 overflow-y-auto");
    });
  });

  describe("Guardrails: Domain Authenticity & No Fake E-Commerce Injections", () => {
    const modalFiles = [
      "src/features/banten/components/banten-item-modal.tsx",
      "src/features/banten/components/banten-review-modal.tsx",
      "src/features/checklist/components/task-modal.tsx",
      "src/features/budget/components/budget-item-modal.tsx",
      "src/features/budget/components/payment-modal.tsx",
      "src/features/vendors/components/vendor-modal.tsx",
      "src/features/guests/components/guest-modal.tsx",
      "src/features/rundown/components/rundown-modal.tsx",
    ];

    it("does not inject fake e-commerce fields from Metronic templates", () => {
      modalFiles.forEach((file) => {
        const code = readComponent(file);
        expect(code).not.toMatch(/\bPrint Label\b/i);
        expect(code).not.toMatch(/\bCarrier Tracking\b/i);
        expect(code).not.toMatch(/\bStock Rating\b/i);
        expect(code).not.toMatch(/\bReorder Point\b/i);
        expect(code).not.toMatch(/\bShipping Method\b/i);
      });
    });

    it("faithfully preserves Balinese Hindu cultural context across all standardized modals", () => {
      const bantenCode = readComponent(
        "src/features/banten/components/banten-item-modal.tsx"
      );
      expect(bantenCode).toMatch(/serati|upakara|pawiwahan|ngayah/i);

      const reviewCode = readComponent(
        "src/features/banten/components/banten-review-modal.tsx"
      );
      expect(reviewCode).toMatch(/dresta|pemangku|lontar|yadnya/i);

      const rundownCode = readComponent(
        "src/features/rundown/components/rundown-modal.tsx"
      );
      expect(rundownCode).toMatch(/WITA|prosesi|adat/i);

      const guestCode = readComponent(
        "src/features/guests/components/guest-modal.tsx"
      );
      expect(guestCode).toMatch(/purusa|pradana|banjar|dadia/i);
    });
  });
});
