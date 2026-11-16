import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

describe("Issue #114: Independent Vertical Columns for Overview Bento Layout", () => {
  const overviewComponentPath = path.resolve(
    __dirname,
    "../src/features/overview/components/overview-dashboard.tsx"
  );

  it("verifies overview-dashboard.tsx implements two independent column stacks", () => {
    expect(fs.existsSync(overviewComponentPath)).toBe(true);
    const content = fs.readFileSync(overviewComponentPath, "utf-8");

    // Parent container with Metronic/PRD token spacing (mobile 20px / desktop 30px)
    expect(content).toContain("grid grid-cols-1 gap-5 lg:grid-cols-3 lg:gap-[30px]");

    // Left column: 2-column span, flex flex-col
    expect(content).toContain("flex flex-col gap-5 lg:col-span-2 lg:gap-[30px]");

    // Right column: 1-column span, flex flex-col
    expect(content).toContain("flex flex-col gap-5 lg:col-span-1 lg:gap-[30px]");
  });

  it("verifies left column contains the primary operational cards in order", () => {
    const content = fs.readFileSync(overviewComponentPath, "utf-8");

    const leftColMatch = content.match(
      /\{\/\* Kolom Kiri[\s\S]*?\{\/\* Kolom Kanan/
    );
    expect(leftColMatch).not.toBeNull();
    const leftColContent = leftColMatch![0];

    // Card order check in left column:
    const countdownIdx = leftColContent.indexOf("<CountdownCard");
    const actionCenterIdx = leftColContent.indexOf("<ActionCenterCard");
    const budgetIdx = leftColContent.indexOf("<BudgetOverviewCard");
    const myTasksIdx = leftColContent.indexOf("<MyTasksCard");
    const ceremonyListIdx = leftColContent.indexOf("<CeremonyList");

    expect(countdownIdx).toBeGreaterThan(-1);
    expect(actionCenterIdx).toBeGreaterThan(countdownIdx);
    expect(budgetIdx).toBeGreaterThan(actionCenterIdx);
    expect(myTasksIdx).toBeGreaterThan(budgetIdx);
    expect(ceremonyListIdx).toBeGreaterThan(myTasksIdx);
  });

  it("verifies right column contains the supporting highlight cards in order", () => {
    const content = fs.readFileSync(overviewComponentPath, "utf-8");

    const rightColMatch = content.match(
      /\{\/\* Kolom Kanan[\s\S]*?<\/div>\s*<\/div>/
    );
    expect(rightColMatch).not.toBeNull();
    const rightColContent = rightColMatch![0];

    // Card order check in right column:
    const readinessIdx = rightColContent.indexOf("<ReadinessCard");
    const upcomingCeremonyIdx = rightColContent.indexOf("<UpcomingCeremonyCard");
    const bantenIdx = rightColContent.indexOf("<BantenOverviewCard");
    const rundownIdx = rightColContent.indexOf("<RundownOverviewCard");
    const quickModulesIdx = rightColContent.indexOf("<QuickModulesCard");

    expect(readinessIdx).toBeGreaterThan(-1);
    expect(upcomingCeremonyIdx).toBeGreaterThan(readinessIdx);
    expect(bantenIdx).toBeGreaterThan(upcomingCeremonyIdx);
    expect(rundownIdx).toBeGreaterThan(bantenIdx);
    expect(quickModulesIdx).toBeGreaterThan(rundownIdx);
  });

  it("ensures no fixed heights or artificial row-locking spacers exist", () => {
    const content = fs.readFileSync(overviewComponentPath, "utf-8");

    // Must not have fixed min-h-[500px] or similar artificial height stretchers
    expect(content).not.toContain("min-h-[400px]");
    expect(content).not.toContain("min-h-[500px]");
    expect(content).not.toContain("min-h-[600px]");
    expect(content).not.toContain("h-[500px]");
    expect(content).not.toContain("h-[600px]");
  });
});
