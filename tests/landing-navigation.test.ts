import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("../src/lib/supabase/client", () => ({ createClient: vi.fn() }));
vi.mock("../src/features/auth/actions", () => ({ getCurrentUserAction: vi.fn() }));
vi.mock("../src/features/workspaces/actions", () => ({ getUserWorkspaces: vi.fn() }));

import { FloatingNavbar } from "../src/components/layout/floating-navbar";

describe("Landing navigation (Issue #119)", () => {
  it("renders navigation before hydration without hidden focus targets", () => {
    const html = renderToStaticMarkup(createElement(FloatingNavbar));
    expect(html).toContain("landing-navbar fixed");
    expect(html).not.toContain("opacity-0");
    expect(html).not.toContain("pointer-events-none");
    for (const href of ["/login", "/pricing", "/faq"]) {
      expect(html).toContain(`href="${href}"`);
    }
    expect(html).toContain('aria-expanded="false"');
    expect(html).toContain('aria-controls="');
    expect(html).not.toContain('class="floating-nav-panel');
  });

  it("uses one responsive breakpoint for toggle, panel and resize cleanup", () => {
    const css = readFileSync("src/app/editorial-landing.css", "utf8");
    const component = readFileSync("src/components/layout/floating-navbar.tsx", "utf8");
    const mobile = css.slice(css.indexOf("@media (max-width: 1280px)"));
    expect(mobile).toContain(".floating-nav-toggle");
    expect(mobile).toContain(".floating-nav-panel");
    expect(mobile).toContain(".floating-nav-menu");
    expect(component).toContain('(min-width: 1281px)');
    expect(component).not.toContain("md:hidden");
    expect(component).toContain('menuToggleRef.current?.focus()');
  });

  it("mounts only one navigation, outside clipped hero", () => {
    const page = readFileSync("src/app/page.tsx", "utf8");
    expect(page.match(/<FloatingNavbar\s*\/>/g)).toHaveLength(1);
    expect(page.indexOf("<FloatingNavbar />")).toBeLessThan(page.indexOf('<header className="hero"'));
    expect(page).not.toContain('aria-label="Main navigation"');
  });
});
