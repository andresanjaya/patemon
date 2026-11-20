import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { calculateReadinessScore } from "../src/features/overview/calculations";
import { ReadinessCard } from "../src/features/overview/components/readiness-card";

describe("ReadinessCard (Issue #126)", () => {
  const emptyScore = calculateReadinessScore({});

  it.each([
    [0, 0],
    [37, 37],
    [100, 100],
    [-10, 0],
    [110, 100],
    [NaN, 0],
    [Infinity, 0],
  ])(
    "keeps text, accessible value and fill consistent for %s",
    (input, value) => {
      const html = renderToStaticMarkup(
        createElement(ReadinessCard, {
          score: { ...emptyScore, overallScore: input },
        })
      );

      expect(html).toContain('role="progressbar"');
      expect(html).toContain('aria-label="Skor kesiapan"');
      expect(html).toContain('aria-valuemin="0"');
      expect(html).toContain('aria-valuemax="100"');
      expect(html).toContain(`aria-valuenow="${value}"`);
      expect(html).toContain(`style="width:${value}%"`);
      expect(html).toMatch(
        new RegExp(`<strong[^>]*>${value}<span[^>]*>%</span>`)
      );
      expect(html).toContain(
        "Skor berbobot dari upacara, banten, tugas, vendor, anggaran, dan rundown"
      );
      expect(html).toContain("bukan persentase jumlah tugas selesai.");
      expect(html).not.toContain("Berjalan");
      expect(html).not.toContain("Berikutnya");
      expect(html).not.toContain("Selesai (");
    }
  );
});
