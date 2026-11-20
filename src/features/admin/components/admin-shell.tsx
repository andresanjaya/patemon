"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Shield,
  ShieldCheck,
  Layers,
  ArrowLeft,
  ExternalLink,
  Menu,
  X,
  User,
  LogOut,
  FolderLock,
  History,
} from "lucide-react";
import { signOutAction } from "@/features/auth/actions";

interface AdminShellProps {
  adminEmail: string;
  role: "superadmin" | "support_operator";
  children: React.ReactNode;
}

export function AdminShell({ adminEmail, role, children }: AdminShellProps) {
  const pathname = usePathname();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const navItems = [
    {
      label: "Pusat Lisensi & Akses",
      href: "/admin",
      icon: ShieldCheck,
      active: pathname === "/admin" || pathname.startsWith("/admin/weddings"),
    },
    {
      label: "Daftar Workspace Saya",
      href: "/workspaces",
      icon: Layers,
      active: false,
    },
    {
      label: "Ke Beranda Utama",
      href: "/",
      icon: ArrowLeft,
      active: false,
    },
  ];

  const renderSidebar = (isMobile = false) => (
    <div className="flex h-full flex-col justify-between p-4">
      <div className="space-y-6">
        {/* Brand Header */}
        <div className="flex items-center justify-between border-b border-[#25252a] pb-4">
          <Link
            href="/admin"
            onClick={() => isMobile && setIsDrawerOpen(false)}
            className="flex items-center gap-2.5 font-bold tracking-tight text-white"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-amber-500/30 bg-amber-500/20 text-amber-400">
              <Shield className="h-4.5 w-4.5 text-amber-400" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold tracking-wide text-white">
                PATEMON ADMIN
              </span>
              <span className="text-[10px] font-medium text-amber-400">
                {role === "superadmin"
                  ? "Master Administrator"
                  : "Support Operator"}
              </span>
            </div>
          </Link>

          {isMobile && (
            <button
              type="button"
              onClick={() => setIsDrawerOpen(false)}
              className="rounded-md p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-white"
              aria-label="Tutup menu"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Navigation Items */}
        <nav
          className="flex flex-col space-y-1.5"
          aria-label="Navigasi Master Admin"
        >
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => isMobile && setIsDrawerOpen(false)}
                className={`flex min-h-[42px] items-center gap-3 rounded-[6px] px-3 py-2 text-xs font-medium transition-colors ${
                  item.active
                    ? "bg-[#28282b] text-white"
                    : "text-[#c4c4ce] hover:bg-[#252528] hover:text-white"
                }`}
                aria-current={item.active ? "page" : undefined}
              >
                <Icon
                  className={`h-4 w-4 shrink-0 ${
                    item.active ? "text-[#edc27b]" : "text-[#8a8a94]"
                  }`}
                />
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Admin Profile Box */}
      <div className="border-t border-[#25252a] pt-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-amber-500/30 bg-amber-500/20 text-xs font-bold text-amber-300">
            AS
          </div>
          <div className="flex min-w-0 flex-1 flex-col truncate">
            <span className="truncate text-xs font-semibold text-white">
              Master Admin
            </span>
            <span className="truncate font-mono text-[10px] text-zinc-400">
              {adminEmail}
            </span>
          </div>

          <span
            className="h-2 w-2 shrink-0 rounded-full bg-emerald-500"
            title="Aktif & Berwenang"
          />

          <form action={signOutAction}>
            <button
              type="submit"
              className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-white"
              title="Keluar dari Akun"
              aria-label="Keluar dari Akun"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#101012] bg-zinc-950 font-sans text-zinc-100">
      {/* Mobile Top Header (<1024px) */}
      <header className="sticky top-0 z-40 flex h-[60px] items-center justify-between border-b border-[#303034] bg-[#101012] px-4 text-white lg:hidden">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setIsDrawerOpen(true)}
            className="flex h-10 w-10 items-center justify-center rounded-lg text-zinc-300 hover:bg-zinc-800"
            aria-label="Buka navigasi admin"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2 text-sm font-bold text-white">
            <Shield className="h-4 w-4 text-amber-400" />
            <span>Patemon Master Admin</span>
          </div>
        </div>

        <Link
          href="/workspaces"
          className="flex items-center gap-1 text-xs text-zinc-300 hover:text-white"
        >
          <span>Workspaces</span>
          <ExternalLink className="h-3 w-3" />
        </Link>
      </header>

      {/* Mobile Drawer */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-black/75 backdrop-blur-xs transition-opacity"
            onClick={() => setIsDrawerOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 z-50 flex w-[270px] flex-col bg-[#101012] shadow-2xl">
            {renderSidebar(true)}
          </div>
        </div>
      )}

      {/* Desktop Fixed Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[270px] border-r border-[#202024] bg-[#101012] lg:flex lg:flex-col">
        {renderSidebar(false)}
      </aside>

      {/* Main Content Area */}
      <div className="min-h-screen lg:pl-[270px]">
        <div className="flex min-h-screen flex-col border-[#e5e5e9] bg-white text-[#18181b] shadow-sm lg:rounded-tl-2xl lg:rounded-bl-2xl lg:border-l">
          <main className="flex-1">{children}</main>
        </div>
      </div>
    </div>
  );
}
