import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "../src/components/ui/card";

describe("Card header dividers", () => {
  it("gives shared headers one bottom border and space before body", () => {
    const html = renderToStaticMarkup(
      createElement(
        Card,
        null,
        createElement(
          CardHeader,
          { className: "pb-3" },
          createElement(CardTitle, null, "Tugas Saya")
        ),
        createElement(CardContent, null, "Isi kartu")
      )
    );
    expect(html).toMatch(/class="[^"]*border-b[^"]*"/);
    expect(html).toContain("border-border");
    expect(html).toContain("mb-6");
    expect(html).toContain("pb-3");
    expect(html.match(/\bborder-b\b/g)).toHaveLength(1);
    expect(html.indexOf("Tugas Saya")).toBeLessThan(html.indexOf("Isi kartu"));
  });

  it("keeps legacy workspace headers aligned with theme border color", () => {
    const css = readFileSync("src/app/globals.css", "utf8");
    const header = css.match(/\.workspace-card-header\s*\{([^}]+)\}/)?.[1];
    expect(header).toContain("border-bottom: 1px solid var(--border, #e9e9ed)");
  });

  it("covers custom admin card headers outside shared CardHeader", () => {
    for (const file of [
      "src/features/admin/components/admin-audit-log-card.tsx",
      "src/features/admin/components/admin-freeze-controls.tsx",
      "src/features/admin/components/admin-grant-override-form.tsx",
      "src/features/admin/components/admin-order-reconcile-card.tsx",
      "src/app/admin/weddings/[weddingId]/page.tsx",
    ]) {
      expect(readFileSync(file, "utf8")).toMatch(
        /className="[^"]*border-border[^"]*border-b[^"]*"/
      );
    }
  });
});
