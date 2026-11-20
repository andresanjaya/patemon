"use client";
import { Button } from "@/components/ui/button";

import { useEffect } from "react";
import { captureError } from "@/lib/observability/logger";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    captureError(error, { digest: error.digest, type: "global_boundary" });
  }, [error]);

  return (
    <html lang="id">
      <body className="flex min-h-screen flex-col items-center justify-center bg-stone-50 p-4 text-stone-900">
        <div className="w-full max-w-md rounded-xl border border-stone-200 bg-white p-6 text-center shadow-sm">
          <h2 className="text-xl font-bold">Terjadi Kesalahan Kritis</h2>
          <p className="mt-2 text-sm text-stone-600">
            Aplikasi mengalami kendala tak terduga. Silakan muat ulang halaman.
          </p>
          <Button
            onClick={() => reset()}
            className="mt-6 rounded-lg px-4 py-2 text-sm font-medium"
          >
            Muat Ulang
          </Button>
        </div>
      </body>
    </html>
  );
}
