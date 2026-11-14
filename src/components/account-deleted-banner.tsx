"use client";

import { useSearchParams } from "next/navigation";
import { CheckCircle2 } from "lucide-react";

export function AccountDeletedBanner() {
  const searchParams = useSearchParams();
  const isAccountDeleted = searchParams.get("deleted") === "true";

  if (!isAccountDeleted) return null;

  return (
    <div className="border-b border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-center text-xs text-emerald-800 sm:text-sm dark:text-emerald-300">
      <div className="container mx-auto flex items-center justify-center gap-2">
        <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
        <span>
          Akun dan seluruh data pribadi Anda telah berhasil dihapus secara
          permanen. Terima kasih telah menggunakan Patemon.
        </span>
      </div>
    </div>
  );
}
