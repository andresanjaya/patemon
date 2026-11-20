import { readFileSync, readdirSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Button, buttonVariants } from "../src/components/ui/button";

describe("shared shadcn buttons", () => {
  it("defines hover, pressed, focus and disabled states for every variant", () => {
    for (const variant of [
      "default",
      "outline",
      "secondary",
      "ghost",
      "destructive",
      "link",
    ] as const) {
      const classes = buttonVariants({ variant });
      expect(classes).toMatch(/hover:/);
      expect(classes).toMatch(/active:/);
      expect(classes).toContain("focus-visible:ring-3");
      expect(classes).toContain("disabled:pointer-events-none");
      expect(classes).toContain("aria-disabled:pointer-events-none");
    }
    expect(buttonVariants()).toContain("bg-primary text-primary-foreground");
    expect(buttonVariants()).not.toContain("hover:bg-primary/80");
  });

  it("preserves native button behavior and semantic links", () => {
    const html = renderToStaticMarkup(
      createElement(Button, { type: "submit", disabled: true }, "Simpan")
    );
    expect(html).toContain('type="submit"');
    expect(html).toContain('disabled=""');
    const link = renderToStaticMarkup(
      createElement(
        "a",
        { href: "/workspaces", className: buttonVariants() },
        "Workspace"
      )
    );
    expect(link).toContain('href="/workspaces"');
    expect(link).not.toContain('role="button"');
  });

  it("uses shared components instead of raw buttons or legacy workspace classes", () => {
    function scan(path: string) {
      for (const entry of readdirSync(path, { withFileTypes: true })) {
        const file = `${path}/${entry.name}`;
        if (entry.isDirectory()) scan(file);
        else if (
          file.endsWith(".tsx") &&
          file !== "src/components/ui/button.tsx"
        ) {
          const source = readFileSync(file, "utf8");
          expect(source, file).not.toMatch(/<button\b|workspace-button/);
        }
      }
    }
    scan("src");
    const page = readFileSync("src/app/page.tsx", "utf8");
    expect(page.match(/<FloatingNavbar\s*\/>/g)).toHaveLength(1);
    expect(page.indexOf("<FloatingNavbar")).toBeLessThan(
      page.indexOf('<header className="hero"')
    );
    const navbar = readFileSync(
      "src/components/layout/floating-navbar.tsx",
      "utf8"
    );
    expect(navbar).toContain("new IntersectionObserver");
    expect(navbar).toContain('floating ? "fixed" : "absolute"');
  });
});
