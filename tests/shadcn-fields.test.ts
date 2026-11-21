import { readFileSync, readdirSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "../src/components/ui/field";
import { Input } from "../src/components/ui/input";
import { Textarea } from "../src/components/ui/textarea";
import { NativeSelect } from "../src/components/ui/native-select";
import { Checkbox } from "../src/components/ui/checkbox";

describe("shadcn form fields", () => {
  it("preserves native form constraints, labels, descriptions and disabled state", () => {
    const html = renderToStaticMarkup(
      createElement(
        "form",
        null,
        createElement(
          FieldGroup,
          null,
          createElement(
            FieldSet,
            null,
            createElement(FieldLegend, null, "Profil"),
            createElement(
              Field,
              { "data-invalid": true },
              createElement(FieldLabel, { htmlFor: "name" }, "Nama"),
              createElement(Input, {
                id: "name",
                name: "name",
                required: true,
                minLength: 3,
                "aria-describedby": "name-help name-error",
                "aria-invalid": true,
              }),
              createElement(
                FieldDescription,
                { id: "name-help" },
                "Nama lengkap"
              ),
              createElement(FieldError, {
                id: "name-error",
                errors: [
                  { message: "Wajib diisi" },
                  { message: "Wajib diisi" },
                ],
              })
            ),
            createElement(
              NativeSelect,
              { name: "region", defaultValue: "Bali", disabled: true },
              createElement("option", { value: "Bali" }, "Bali")
            ),
            createElement(Textarea, {
              name: "notes",
              maxLength: 500,
              required: true,
            }),
            createElement(
              Field,
              { orientation: "horizontal" },
              createElement(Checkbox, {
                id: "notify",
                name: "notify",
                defaultChecked: true,
              }),
              createElement(FieldLabel, { htmlFor: "notify" }, "Pengingat")
            )
          )
        )
      )
    );
    expect(html).toContain('for="name"');
    expect(html).toContain('aria-describedby="name-help name-error"');
    expect(html).toContain('minLength="3"');
    expect(html).toContain('maxLength="500"');
    expect(html).toContain('name="region" disabled=""');
    expect(html).toContain('value="Bali" selected=""');
    expect(html).toContain('role="checkbox"');
    expect(html).toContain('aria-checked="true"');
    expect(html).toContain('data-orientation="horizontal"');
    expect(html.match(/Wajib diisi/g)).toHaveLength(1);
    expect(html).toContain('role="alert"');
  });

  it("returns no empty error alerts", () => {
    expect(
      renderToStaticMarkup(
        createElement(FieldError, { errors: [undefined, { message: "" }] })
      )
    ).toBe("");
  });

  it("uses shared fields and controls across user, public and admin forms", () => {
    const files: string[] = [];
    function scan(path: string) {
      for (const entry of readdirSync(path, { withFileTypes: true })) {
        const file = `${path}/${entry.name}`;
        if (entry.isDirectory()) scan(file);
        else if (file.endsWith(".tsx")) files.push(file);
      }
    }
    scan("src/features");
    files.push("src/app/rsvp/[token]/rsvp-client.tsx");
    for (const file of files) {
      const source = readFileSync(file, "utf8");
      expect(source, file).not.toMatch(/<(?:label|Label|select|textarea)\b/);
      if (source.includes("<FieldLabel"))
        expect(source, file).toContain('from "@/components/ui/field"');
      for (const input of source.matchAll(/<input\b[^>]*>/g)) {
        expect(input[0], file).toMatch(/type="(?:hidden|file|radio)"/);
      }
    }
  });
});
