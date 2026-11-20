"use client";
import { Button } from "@/components/ui/button";

import { useState, useTransition } from "react";
import { listAdminAccountsAction } from "../actions";

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
          variant="outline"
          type="button"
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
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left text-sm">
          <caption className="sr-only">
            Daftar akun Supabase Auth, terpisah dari daftar workspace dan
            lisensi
          </caption>
          <thead className="bg-[#fafafa] text-xs text-[#65656f]">
            <tr className="divide-x divide-[#e9e9ed] border-b border-[#e9e9ed]">
              {[
                "Nama & ID akun",
                "Email",
                "Metode masuk",
                "Terdaftar (WITA)",
                "Login terakhir (WITA)",
              ].map((label) => (
                <th key={label} scope="col" className="px-4 py-3 font-semibold">
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#e9e9ed]">
            {result.users.map((user) => (
              <tr key={user.id} className="divide-x divide-[#e9e9ed]">
                <td className="px-4 py-3">
                  <div>{user.name || "Nama belum diisi"}</div>
                  <div className="mt-1 font-mono text-xs text-[#65656f]">
                    {user.id}
                  </div>
                </td>
                <td className="px-4 py-3">{user.email || "Tanpa email"}</td>
                <td className="px-4 py-3">
                  {user.providers.join(", ") || "—"}
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  {formatDate(user.createdAt)}
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  {formatDate(user.lastSignInAt)}
                </td>
              </tr>
            ))}
            {result.success && result.users.length === 0 && (
              <tr>
                <td colSpan={5} className="p-5 text-center text-[#65656f]">
                  Belum ada akun pada halaman ini.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-[#e9e9ed] p-4 text-xs">
        <span aria-live="polite">
          Halaman {result.page} · {result.users.length} akun ditampilkan
        </span>
        <div className="flex gap-2">
          <Button
            variant="outline"
            type="button"
            disabled={pending || result.page <= 1}
            onClick={() => load(result.page - 1)}
          >
            Sebelumnya
          </Button>
          <Button
            variant="outline"
            type="button"
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
