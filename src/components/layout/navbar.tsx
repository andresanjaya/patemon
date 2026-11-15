import Link from "next/link";
import { Suspense } from "react";
import { Sparkles, CalendarHeart, User, LogOut } from "lucide-react";
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
        <Button variant="ghost" size="sm" asChild className="gap-1.5">
          <Link href="/profile">
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">
              {user.user_metadata?.full_name ||
                user.email?.split("@")[0] ||
                "Profil"}
            </span>
          </Link>
        </Button>
        <Button size="sm" asChild className="gap-1.5">
          <Link href={dashboardHref}>
            <Sparkles className="h-3.5 w-3.5" />
            <span>Buka Dashboard</span>
          </Link>
        </Button>
        <form action={signOutAction}>
          <Button variant="outline" size="sm" type="submit" title="Keluar">
            <LogOut className="h-4 w-4" />
            <span className="sr-only">Keluar</span>
          </Button>
        </form>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2.5">
      <Button variant="ghost" size="sm" asChild>
        <Link href="/login">Masuk</Link>
      </Button>
      <Button size="sm" asChild>
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
      <Button variant="ghost" size="sm" asChild>
        <Link href="/login">Masuk</Link>
      </Button>
      <Button size="sm" asChild>
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
    <header className="border-border/60 bg-background/95 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 w-full border-b backdrop-blur">
      <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="flex items-center gap-2.5 transition-opacity hover:opacity-90"
        >
          <div className="bg-primary text-primary-foreground flex h-9 w-9 items-center justify-center rounded-lg shadow-sm">
            <CalendarHeart className="h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-foreground text-lg font-bold tracking-tight">
              Patemon
            </span>
            <span className="text-muted-foreground text-[10px] font-medium tracking-wider uppercase">
              Bali Hindu Wedding Planner
            </span>
          </div>
        </Link>

        <nav className="text-muted-foreground hidden items-center gap-6 text-sm font-medium md:flex">
          <Link
            href="/#features"
            className="hover:text-foreground transition-colors"
          >
            Fitur Utama
          </Link>
          <Link
            href="/#how-it-works"
            className="hover:text-foreground transition-colors"
          >
            Cara Kerja
          </Link>
          <Link
            href="/#principles"
            className="hover:text-foreground transition-colors"
          >
            Prinsip Adat
          </Link>
          <Link
            href="/pricing"
            className="hover:text-foreground transition-colors"
          >
            Biaya & Paket
          </Link>
          <Link href="/faq" className="hover:text-foreground transition-colors">
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
