"use client";

import React, { useState, useEffect, useRef, useId } from "react";
import Link from "next/link";
import { Sparkles, User, Menu, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { getCurrentUserAction } from "@/features/auth/actions";
import { getUserWorkspaces } from "@/features/workspaces/actions";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function FloatingNavbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [dashboardHref, setDashboardHref] = useState<string>("/workspace/new");
  const [loading, setLoading] = useState(true);
  const [floating, setFloating] = useState(false);
  const menuToggleRef = useRef<HTMLButtonElement>(null);
  const menuId = useId();

  useEffect(() => {
    const hero = document.getElementById("top");
    if (!hero) return;
    const observer = new IntersectionObserver(([entry]) => {
      setFloating(
        !entry.isIntersecting && entry.boundingClientRect.bottom <= 0
      );
    });
    observer.observe(hero);
    return () => observer.disconnect();
  }, []);

  // Disclosure navigation: Escape closes panel and returns focus to toggle.
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMobileMenuOpen(false);
        menuToggleRef.current?.focus();
      }
    };
    if (mobileMenuOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [mobileMenuOpen]);

  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 1281px)");
    const closeMenu = () => setMobileMenuOpen(false);
    desktop.addEventListener("change", closeMenu);
    return () => desktop.removeEventListener("change", closeMenu);
  }, []);

  // Resolve user auth state for intelligent CTA.
  useEffect(() => {
    let isMounted = true;

    async function resolveAuth() {
      try {
        let currentUser: SupabaseUser | null = null;
        try {
          currentUser = (await getCurrentUserAction()) as SupabaseUser | null;
        } catch {
          currentUser = null;
        }

        if (!currentUser) {
          try {
            const supabase = createClient();
            const { data } = await supabase.auth.getUser();
            currentUser = data?.user || null;
          } catch {
            // ignore
          }
        }

        if (!isMounted) return;
        setUser(currentUser);

        if (currentUser) {
          let targetHref = "/workspaces";
          try {
            const workspaces = await getUserWorkspaces();
            if (workspaces.length === 0) {
              targetHref = "/workspace/new";
            } else {
              targetHref = `/workspace/${workspaces[0].id}`;
            }
          } catch {
            targetHref = "/workspaces";
          }
          if (isMounted) setDashboardHref(targetHref);
        }
      } catch {
        if (isMounted) setUser(null);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    resolveAuth();

    let unsubscribe = () => {};
    try {
      const supabase = createClient();
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange(() => {
        resolveAuth();
      });
      unsubscribe = () => subscription.unsubscribe();
    } catch {
      // ignore
    }

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  return (
    <aside
      data-floating={floating}
      aria-label="Navigasi Patemon"
      className={cn(
        "landing-navbar top-3 right-3 left-3 z-50 sm:top-4 sm:right-6 sm:left-6 md:right-8 md:left-8",
        floating ? "fixed" : "absolute"
      )}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          setMobileMenuOpen(false);
        }
      }}
    >
      <div
        className={cn(
          "flex w-full items-center justify-between rounded-full border px-5 py-2.5 sm:px-7 sm:py-3",
          floating
            ? "border-white/15 bg-[#1b322b]/95 shadow-xl backdrop-blur-md"
            : "border-transparent bg-transparent"
        )}
      >
        {/* Left: Brand Logo */}
        <Link
          href="/#top"
          className="group flex items-center gap-2 transition-opacity hover:opacity-90"
          aria-label="Kembali ke atas"
        >
          <div className="flex h-7 w-7 items-center justify-center rounded-full border border-[#e4c874]/40 bg-[#e4c874]/15 text-xs text-[#e4c874]">
            ✳
          </div>
          <span className="font-editorial text-2xl font-bold tracking-tight text-white">
            patemon<span className="text-[#e4c874]">.</span>
          </span>
        </Link>

        {/* Center: Navigation Links */}
        <nav className="floating-nav-menu" aria-label="Navigasi Halaman">
          <Link href="/#features">Fitur Utama</Link>
          <Link href="/#how-it-works">Cara Kerja</Link>
          <Link href="/#principles">Prinsip Adat</Link>
          <Link href="/pricing">Biaya & Paket</Link>
          <Link href="/faq">Bantuan / FAQ</Link>
        </nav>

        {/* Right: Auth / Action Buttons */}
        <div className="flex items-center gap-3">
          <div className="floating-nav-auth">
            {!loading && user ? (
              <div className="flex items-center gap-2">
                <Link
                  href="/profile"
                  className="hidden items-center gap-1.5 rounded-full px-2.5 py-1 text-xs text-zinc-300 hover:text-white sm:inline-flex"
                  title="Profil Saya"
                >
                  <User className="h-3.5 w-3.5" />
                  <span className="max-w-[100px] truncate">
                    {user.user_metadata?.full_name ||
                      user.email?.split("@")[0] ||
                      "Profil"}
                  </span>
                </Link>
                <Link
                  href={dashboardHref}
                  className={buttonVariants({
                    className:
                      "gap-1.5 rounded-full px-4 text-xs font-semibold shadow-sm",
                  })}
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Buka Dashboard</span>
                </Link>
              </div>
            ) : (
              <div className="flex items-center gap-2 sm:gap-3">
                <Link
                  href="/login"
                  className="px-2 py-1 text-xs font-medium text-zinc-300 transition-colors hover:text-white"
                >
                  Masuk
                </Link>
                <Link
                  href="/register"
                  className={buttonVariants({
                    className:
                      "gap-1 rounded-full px-4 text-xs font-semibold shadow-sm",
                  })}
                >
                  <span>Mulai Gratis</span>
                  <span aria-hidden="true">→</span>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Toggle Button */}
          <Button
            variant="ghost"
            type="button"
            ref={menuToggleRef}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="floating-nav-toggle h-11 w-11 rounded-full"
            aria-label={mobileMenuOpen ? "Tutup menu" : "Buka menu navigasi"}
            aria-expanded={mobileMenuOpen}
            aria-controls={menuId}
          >
            {mobileMenuOpen ? (
              <X className="h-4 w-4" />
            ) : (
              <Menu className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Mobile Dropdown Menu with Blurry Glass Effect */}
      {mobileMenuOpen && (
        <div
          id={menuId}
          className="floating-nav-panel mt-2 max-h-[calc(100dvh-110px)] overflow-y-auto rounded-2xl border border-white/15 bg-[#1b322b]/95 p-5 shadow-2xl backdrop-blur-xl"
          style={{
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
          }}
        >
          <nav
            className="flex flex-col gap-3 text-sm font-medium text-zinc-200"
            aria-label="Menu Mobile"
          >
            <Link
              href="/#features"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1 transition-colors hover:text-[#e4c874]"
            >
              Fitur Utama
            </Link>
            <Link
              href="/#how-it-works"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1 transition-colors hover:text-[#e4c874]"
            >
              Cara Kerja
            </Link>
            <Link
              href="/#principles"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1 transition-colors hover:text-[#e4c874]"
            >
              Prinsip Adat
            </Link>
            <Link
              href="/pricing"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1 transition-colors hover:text-[#e4c874]"
            >
              Biaya & Paket
            </Link>
            <Link
              href="/faq"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1 transition-colors hover:text-[#e4c874]"
            >
              Bantuan / FAQ
            </Link>
          </nav>

          <div className="mt-4 border-t border-white/10 pt-4">
            {user ? (
              <Link
                href={dashboardHref}
                onClick={() => setMobileMenuOpen(false)}
                className={buttonVariants({
                  className:
                    "h-11 w-full gap-2 rounded-full text-xs font-semibold",
                })}
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>Buka Dashboard</span>
              </Link>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className={buttonVariants({
                    variant: "outline",
                    className: "h-11 flex-1 rounded-full text-xs",
                  })}
                >
                  Masuk
                </Link>
                <Link
                  href="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className={buttonVariants({
                    className: "h-11 flex-1 rounded-full text-xs font-semibold",
                  })}
                >
                  Daftar Gratis
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </aside>
  );
}
