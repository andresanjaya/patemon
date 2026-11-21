"use client";

import React, { Suspense } from "react";
import { usePathname } from "next/navigation";
import { Navbar } from "./navbar";
import { Footer } from "./footer";
import { FloatingNavbar } from "./floating-navbar";
import "@/app/editorial-landing.css";

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

  // The landing page ("/") uses an integrated editorial header and closing footer.
  // Suppress the global marketing Navbar and Footer on "/" to eliminate duplicate bars.
  if (pathname === "/") {
    return <>{children}</>;
  }

  if (pathname === "/workspaces") {
    return (
      <div className="il-editorial bg-background text-foreground flex min-h-screen flex-col">
        <FloatingNavbar solid />
        <main className="flex-1 pt-28">{children}</main>
        <Footer />
      </div>
    );
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
