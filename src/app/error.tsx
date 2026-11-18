"use client";

import { useEffect } from "react";
import { AlertCircle, RefreshCw, Home } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { captureError } from "@/lib/observability/logger";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    captureError(error, { digest: error.digest });
  }, [error]);

  return (
    <div className="container mx-auto flex min-h-[calc(100vh-14rem)] max-w-lg items-center justify-center px-4 py-12">
      <Card className="border-destructive/20 w-full text-center">
        <CardHeader>
          <div className="bg-destructive/10 text-destructive mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full">
            <AlertCircle className="h-6 w-6" />
          </div>
          <CardTitle className="text-xl">Terjadi Kendala Sistem</CardTitle>
          <CardDescription>
            Mohon maaf, terjadi kendala saat memuat halaman ini.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-muted-foreground text-xs">
            Insiden telah dicatat secara aman dengan enkripsi tanpa memuat
            informasi sensitif atau data pribadi.
          </p>

          {process.env.NODE_ENV !== "production" && error?.message && (
            <div className="rounded-md border border-red-200 bg-red-50 p-3 text-left font-mono text-xs text-red-900">
              <p className="font-semibold text-red-700">Debug Detail (Local Dev):</p>
              <p className="mt-1 break-words">{error.message}</p>
              {error.digest && (
                <p className="mt-1 text-[11px] text-red-600">Digest: {error.digest}</p>
              )}
            </div>
          )}
        </CardContent>
        <CardFooter className="flex flex-col justify-center gap-2 sm:flex-row">
          <Button onClick={() => reset()} className="gap-2">
            <RefreshCw className="h-4 w-4" /> Coba Lagi
          </Button>
          <Button variant="outline" asChild className="gap-2">
            <Link href="/">
              <Home className="h-4 w-4" /> Ke Beranda
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
