"use client";
import { Button } from "@/components/ui/button";

import { useState, useTransition } from "react";
import { listAdminAccountsAction } from "../actions";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";

type AccountsResult = Awaited<ReturnType<typeof listAdminAccountsAction>>;

function formatDate(value: string | null) {
  return value
    ? new Date(value).toLocaleString("id-ID", { timeZone: "Asia/Makassar" })
    : "Belum pernah masuk";
}

export function AdminAccountsTable({
  initialResult,
}: {
  initialResult: AccountsResult;
}) {
  const [result, setResult] = useState(initialResult);
  const [error, setError] = useState(initialResult.error);
  const [pending, startTransition] = useTransition();

  function load(page: number) {
    startTransition(async () => {
      setError(undefined);
      try {
        const next = await listAdminAccountsAction(page);
        if (next.success) setResult(next);
        else setError(next.error);
      } catch {
        setError("Koneksi gagal. Muat ulang daftar akun untuk mencoba lagi.");
      }
    });
  }

  return (
    <section
      className="workspace-card"
      aria-labelledby="admin-accounts-title"
      aria-busy={pending}
    >
      <header className="workspace-card-header flex-wrap gap-3">
        <div>
          <h2 id="admin-accounts-title" className="text-sm font-semibold">
            Akun Terdaftar {result.success ? `(${result.total})` : ""}
          </h2>
          <p className="mt-1 text-xs text-[#65656f]">
            Sumber: Supabase Auth. Termasuk akun yang belum membuat workspace.
            Jumlah akun berbeda dari jumlah workspace. Waktu ditampilkan dalam
            WITA.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={pending}
          onClick={() => load(result.page)}
        >
          {pending ? "Memuat…" : "Muat ulang akun"}
        </Button>
      </header>
      {error && (
        <p role="alert" className="m-4 text-sm text-red-700">
          {error}
        </p>
      )}
      <Table className="min-w-[800px]">
        <caption className="sr-only">
          Daftar akun Supabase Auth, terpisah dari daftar workspace dan lisensi
        </caption>
        <TableHeader>
          <TableRow>
            {[
              "Nama & ID akun",
              "Email",
              "Metode masuk",
              "Terdaftar (WITA)",
              "Login terakhir (WITA)",
            ].map((label) => (
              <TableHead key={label} scope="col">
                {label}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {result.users.map((user) => (
            <TableRow key={user.id}>
              <TableCell>
                <div>{user.name || "Nama belum diisi"}</div>
                <div className="mt-1 font-mono text-xs text-[#65656f]">
                  {user.id}
                </div>
              </TableCell>
              <TableCell>{user.email || "Tanpa email"}</TableCell>
              <TableCell>{user.providers.join(", ") || "—"}</TableCell>
              <TableCell className="whitespace-nowrap">
                {formatDate(user.createdAt)}
              </TableCell>
              <TableCell className="whitespace-nowrap">
                {formatDate(user.lastSignInAt)}
              </TableCell>
            </TableRow>
          ))}
          {result.success && result.users.length === 0 && (
            <TableRow>
              <TableCell
                colSpan={5}
                className="text-muted-foreground p-5 text-center"
              >
                Belum ada akun pada halaman ini.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-[#e9e9ed] p-4 text-xs">
        <span aria-live="polite">
          Halaman {result.page} · {result.users.length} akun ditampilkan
        </span>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={pending || result.page <= 1}
            onClick={() => load(result.page - 1)}
          >
            Sebelumnya
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={pending || !result.hasMore}
            onClick={() => load(result.page + 1)}
          >
            Berikutnya
          </Button>
        </div>
      </footer>
    </section>
  );
}
