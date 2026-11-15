import Link from "next/link";
import { Shield, ArrowLeft, ExternalLink, Terminal } from "lucide-react";

interface AdminNavProps {
  adminEmail: string;
  role: string;
}

export function AdminNav({ adminEmail, role }: AdminNavProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-amber-950/20 bg-stone-900 text-stone-100 shadow-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4">
          <Link
            href="/admin"
            className="flex items-center gap-2 font-serif text-lg font-bold text-amber-400 transition-colors hover:text-amber-300"
          >
            <Shield className="h-5 w-5 text-amber-500" />
            <span>Patemon Platform Ops</span>
          </Link>
          <span className="rounded-full border border-amber-500/30 bg-amber-500/20 px-2.5 py-0.5 text-xs font-semibold tracking-wider text-amber-300 uppercase">
            {role === "superadmin" ? "Superadmin" : "Operator Support"}
          </span>
        </div>

        <div className="flex items-center gap-4 text-sm">
          <div className="hidden items-center gap-2 font-mono text-xs text-stone-400 sm:flex">
            <Terminal className="h-3.5 w-3.5 text-stone-500" />
            <span>{adminEmail}</span>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/admin"
              className="rounded-md px-3 py-1.5 text-xs font-medium text-stone-300 transition-colors hover:bg-stone-800 hover:text-white"
            >
              Semua Workspace
            </Link>
            <Link
              href="/workspaces"
              className="flex items-center gap-1 rounded-md border border-stone-700 bg-stone-800 px-3 py-1.5 text-xs font-medium text-stone-200 transition-colors hover:bg-stone-700 hover:text-white"
            >
              <span>App Workspace</span>
              <ExternalLink className="h-3 w-3" />
            </Link>
            <Link
              href="/"
              className="ml-2 flex items-center gap-1 text-xs text-stone-400 transition-colors hover:text-stone-200"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Beranda</span>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
