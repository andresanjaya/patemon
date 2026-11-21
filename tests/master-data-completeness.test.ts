import { expect, it } from "vitest";
import { readFileSync } from "node:fs";
import workbook from "../src/data/wedding-master-data.json";
import {
  MASTER_BANTEN,
  MASTER_BUDGET,
  MASTER_CEREMONIES,
  MASTER_TASKS,
  MASTER_VENDORS,
} from "../src/data/master-templates";
import { DEFAULT_RITUAL_CATALOG } from "../src/features/banten/seeds";
import { DEFAULT_CEREMONY_TEMPLATES } from "../src/features/ceremonies/seeds";
import { STARTER_TASK_TEMPLATES } from "../src/features/checklist/seeds";
import { STARTER_BUDGET_TEMPLATES } from "../src/features/budget/seeds";
import { STARTER_VENDOR_TEMPLATES } from "../src/features/vendors/seeds";
import {
  getPreviewBantenItems,
  getPreviewBudgetItems,
  getPreviewCeremonies,
  getPreviewTasks,
  getPreviewVendors,
} from "../src/features/preview/preview-data";

it("keeps every workbook record available in demo and recommendation pickers", () => {
  const groups = [
    [
      workbook.Prosesi,
      MASTER_CEREMONIES,
      DEFAULT_CEREMONY_TEMPLATES,
      getPreviewCeremonies("demo"),
      "C",
      "title",
      20,
    ],
    [
      workbook.Banten_Sarana,
      MASTER_BANTEN,
      DEFAULT_RITUAL_CATALOG,
      getPreviewBantenItems("demo"),
      "C",
      "name",
      66,
    ],
    [
      workbook.Checklist,
      MASTER_TASKS,
      STARTER_TASK_TEMPLATES,
      getPreviewTasks("demo"),
      "E",
      "title",
      157,
    ],
    [
      workbook.Anggaran,
      MASTER_BUDGET,
      STARTER_BUDGET_TEMPLATES,
      getPreviewBudgetItems("demo"),
      "D",
      "title",
      119,
    ],
    [
      workbook.Vendor_PIC,
      MASTER_VENDORS,
      STARTER_VENDOR_TEMPLATES,
      getPreviewVendors("demo").vendors,
      "B",
      "name",
      22,
    ],
  ] as const;
  for (const [sheet, master, picker, demo, column, field, count] of groups) {
    expect(master).toHaveLength(count);
    expect(demo).toHaveLength(count);
    expect(
      demo.map((row) => (row as unknown as Record<string, unknown>)[field])
    ).toEqual(
      sheet.slice(1).map((row) => (row as Record<string, string>)[column])
    );
    expect(new Set(picker.map((row) => row.id)).size).toBe(picker.length);
    for (const row of master)
      expect(picker.some((item) => item.id === row.id)).toBe(true);
  }
  expect(
    getPreviewBantenItems("demo").every(
      (item) => item.reviewStatus === "needs_review"
    )
  ).toBe(true);
  expect(
    getPreviewVendors("demo").vendors.every((item) => item.phone === null)
  ).toBe(true);
});

it("uses landing navigation on workspace list and only one ceremony detail button", () => {
  const shell = readFileSync("src/components/layout/app-shell.tsx", "utf8");
  expect(shell).toContain('pathname === "/workspaces"');
  expect(shell).toContain("<FloatingNavbar solid />");
  const list = readFileSync(
    "src/features/ceremonies/components/ceremony-list.tsx",
    "utf8"
  );
  expect(list.match(/<span>Detail & Rundown<\/span>/g)).toHaveLength(1);
  const tasks = readFileSync(
    "src/features/checklist/components/task-dashboard.tsx",
    "utf8"
  );
  expect(tasks).toContain('className="flex flex-col items-start gap-1.5"');
});
