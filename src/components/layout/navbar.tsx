import Link from "next/link";
import { Suspense } from "react";
import { Sparkles, User, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getCurrentUserAction, signOutAction } from "@/features/auth/actions";
import { getUserWorkspaces } from "@/features/workspaces/actions";
import { getWorkspaceEntitlement } from "@/features/payments/entitlements";

async function NavbarAuth() {
  let user = null;
  let dashboardHref = "/workspace/new";

  try {
    const currentUser = await getCurrentUserAction();
    user = currentUser;

    if (user) {
      const workspaces = await getUserWorkspaces();
      if (workspaces.length === 0) {
        // Tanpa workspace diarahkan ke pembuatan draft baru (Issue #77)
        dashboardHref = "/workspace/new";
      } else {
        const primaryWorkspace = workspaces[0];
        const entitlement = await getWorkspaceEntitlement(primaryWorkspace.id);
        // Unpaid diarahkan ke status/paket di settings; aktif ke workspace utama
        if (entitlement.status === "unpaid") {
          dashboardHref = `/workspace/${primaryWorkspace.id}/settings`;
        } else {
          dashboardHref = `/workspace/${primaryWorkspace.id}`;
        }
      }
    }
  } catch {
    user = null;
  }

  if (user) {
    return (
      <div className="flex items-center gap-2.5">
        <Button
          variant="ghost"
          size="sm"
          asChild
          className="gap-1.5 text-xs text-[#fcf8e9] hover:bg-[#2b4c41] hover:text-white"
        >
          <Link href="/profile">
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">
              {user.user_metadata?.full_name ||
                user.email?.split("@")[0] ||
                "Profil"}
            </span>
          </Link>
        </Button>
        <Button
          size="sm"
          asChild
          className="gap-1.5 rounded-full bg-[#e4c874] px-5 text-xs font-semibold text-[#233f36] transition-colors hover:bg-[#d8bd6c]"
        >
          <Link href={dashboardHref}>
            <Sparkles className="h-3.5 w-3.5" />
            <span>Buka Dashboard</span>
          </Link>
        </Button>
        <form action={signOutAction}>
          <Button
            variant="ghost"
            size="sm"
            type="submit"
            title="Keluar"
            className="text-[#c9d3c7] hover:bg-[#2b4c41] hover:text-white"
          >
            <LogOut className="h-4 w-4" />
            <span className="sr-only">Keluar</span>
          </Button>
        </form>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2.5">
      <Button
        variant="ghost"
        size="sm"
        asChild
        className="text-xs text-[#fcf8e9] hover:bg-[#2b4c41] hover:text-white"
      >
        <Link href="/login">Masuk</Link>
      </Button>
      <Button
        size="sm"
        asChild
        className="rounded-full bg-[#e4c874] px-5 text-xs font-semibold text-[#233f36] transition-colors hover:bg-[#d8bd6c]"
      >
        <Link href="/register">
          <Sparkles className="mr-1.5 h-3.5 w-3.5" />
          Daftar
        </Link>
      </Button>
    </div>
  );
}

function NavbarAuthSkeleton() {
  return (
    <div className="flex items-center gap-2.5">
      <Button
        variant="ghost"
        size="sm"
        asChild
        className="text-xs text-[#fcf8e9]"
      >
        <Link href="/login">Masuk</Link>
      </Button>
      <Button
        size="sm"
        asChild
        className="rounded-full bg-[#e4c874] px-5 text-xs font-semibold text-[#233f36]"
      >
        <Link href="/register">
          <Sparkles className="mr-1.5 h-3.5 w-3.5" />
          Daftar
        </Link>
      </Button>
    </div>
  );
}

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-[#ffffff1a] bg-[#233f36] text-[#fcf8e9] backdrop-blur supports-[backdrop-filter]:bg-[#233f36]/95">
      <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="font-body-editorial flex items-center gap-2.5 transition-opacity hover:opacity-90"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#e4c874]/30 bg-[#2b4c41] text-[#e4c874] shadow-sm">
            <span className="text-lg">✳</span>
          </div>
          <div className="flex flex-col">
            <span className="font-editorial text-xl font-bold tracking-tight text-white">
              patemon<span className="text-[#e4c874]">.</span>
            </span>
            <span className="text-[10px] font-medium tracking-wider text-[#c9d3c7] uppercase">
              Bali Hindu Wedding Planner
            </span>
          </div>
        </Link>

        <nav className="hidden items-center gap-6 text-xs font-medium text-[#c9d3c7] md:flex">
          <Link
            href="/#features"
            className="transition-colors hover:text-[#e4c874]"
          >
            Fitur Utama
          </Link>
          <Link
            href="/#how-it-works"
            className="transition-colors hover:text-[#e4c874]"
          >
            Cara Kerja
          </Link>
          <Link
            href="/#principles"
            className="transition-colors hover:text-[#e4c874]"
          >
            Prinsip Adat
          </Link>
          <Link
            href="/pricing"
            className="transition-colors hover:text-[#e4c874]"
          >
            Biaya & Paket
          </Link>
          <Link href="/faq" className="transition-colors hover:text-[#e4c874]">
            Bantuan / FAQ
          </Link>
        </nav>

        <Suspense fallback={<NavbarAuthSkeleton />}>
          <NavbarAuth />
        </Suspense>
      </div>
    </header>
  );
}
