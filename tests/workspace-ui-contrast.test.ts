import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { QuickModulesCard } from "../src/features/overview/components/quick-modules-card";

describe("workspace UI contrast", () => {
  it("keeps workspace brand colors separate from shadcn surface tokens", () => {
    const css = readFileSync("src/app/globals.css", "utf8");
    const shell = css.match(/\.workspace-shell\s*\{([^}]+)\}/)?.[1];
    expect(shell).toContain("--workspace-accent:");
    expect(shell).not.toMatch(/--(?:muted|accent):/);
    expect(css).not.toContain("hsl(var(--");
    expect(css.match(/--color-muted:/g)).toHaveLength(1);
  });

  it("renders readable module rows with keyboard focus and stable destinations", () => {
    const html = renderToStaticMarkup(
      createElement(QuickModulesCard, {
        weddingId: "demo",
        tasksCount: 4,
        completedTasksCount: 1,
        vendorsCount: 2,
        bookedVendorsCount: 1,
        guestsCount: 3,
        confirmedHeadcount: 2,
        totalHeadcount: 6,
      })
    );
    expect(html).toContain("1 dari 4 selesai (25%)");
    expect(html).toContain("1 dari 2 dipesan (deal)");
    expect(html).toContain("2 hadir / estimasi 6 pax");
    for (const route of ["tasks", "vendors", "guests"]) {
      expect(html).toContain(`href="/workspace/demo/${route}"`);
    }
    expect(html.match(/focus-visible:ring-2/g)).toHaveLength(3);
    expect(html.match(/text-xs leading-relaxed/g)).toHaveLength(3);
    expect(html).not.toContain("text-[11px]");
    expect(html).not.toContain("bg-muted/20");
  });
});
