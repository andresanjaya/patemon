import { expect, test } from "vitest";
import { withoutSourceReference } from "../src/lib/notes";

test("hides legacy citations without dropping operational notes", () => {
  expect(
    withoutSourceReference("Catatan. Sumber: https://example.com/path?q=1")
  ).toBe("Catatan.");
  expect(
    withoutSourceReference(
      "Catatan. Sumber: https://example.com/\nBawa dua dulang."
    )
  ).toBe("Catatan.\nBawa dua dulang.");
  expect(withoutSourceReference("Catatan. Sumber: XL-BN-001")).toBe("Catatan.");
  expect(withoutSourceReference("Catatan. Sumber: XL-CK-001")).toBe("Catatan.");
  expect(withoutSourceReference("Sumber: keluarga, hubungi ibu.")).toBe(
    "Sumber: keluarga, hubungi ibu."
  );
  expect(
    withoutSourceReference("Cek https://example.com sebelum datang.")
  ).toBe("Cek https://example.com sebelum datang.");
  expect(withoutSourceReference("")).toBe("");
});
