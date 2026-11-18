"use client";

import React, { Suspense } from "react";
import { usePathname } from "next/navigation";
import { Navbar } from "./navbar";
import { Footer } from "./footer";

interface AppShellProps {
  children: React.ReactNode;
}

function AppShellInner({ children }: AppShellProps) {
  const pathname = usePathname();

  // Match workspace dashboards and admin portal (both have dedicated dashboard shells)
  const isDashboardRoute = Boolean(
    pathname &&
      ((pathname.startsWith("/workspace/") &&
        !pathname.startsWith("/workspace/new")) ||
        pathname.startsWith("/admin"))
  );

  if (isDashboardRoute) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}

/**
 * AppShell separates the public marketing/auth layout from the workspace dashboard layout (Issue #77).
 * - Public routes, auth, pricing, terms, profile, and workspace creation retain the marketing Navbar and Footer.
 * - Workspace routes (/workspace/[weddingId]/*) render children cleanly inside the Demo 10 WorkspaceShell.
 */
export function AppShell(props: AppShellProps) {
  return (
    <Suspense fallback={<div className="flex min-h-screen flex-col" />}>
      <AppShellInner {...props} />
    </Suspense>
  );
}
