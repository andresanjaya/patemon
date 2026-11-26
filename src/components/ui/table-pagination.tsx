"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

const PAGE_SIZE = 50;

export function paginateTableRows<T>(items: T[], requestedPage: number) {
  const totalPages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
  const page = Math.min(
    totalPages,
    Math.max(1, Math.trunc(requestedPage) || 1)
  );
  const offset = (page - 1) * PAGE_SIZE;

  return {
    items: items.slice(offset, offset + PAGE_SIZE),
    page,
    totalPages,
    total: items.length,
    start: items.length === 0 ? 0 : offset + 1,
    end: Math.min(offset + PAGE_SIZE, items.length),
  };
}

export function useTablePagination<T>(items: T[], resetKey: string) {
  const key = `${resetKey}:${items.length}`;
  const [selection, setSelection] = useState({ key, page: 1 });
  if (selection.key !== key) {
    setSelection({ key, page: 1 });
  }
  const result = paginateTableRows(
    items,
    selection.key === key ? selection.page : 1
  );

  return {
    ...result,
    onPageChange: (page: number) => setSelection({ key, page }),
  };
}

interface TablePaginationProps {
  pagination: Omit<ReturnType<typeof useTablePagination>, "items">;
  label: string;
}

export function TablePagination({ pagination, label }: TablePaginationProps) {
  if (pagination.totalPages <= 1) return null;

  return (
    <nav
      aria-label={`Halaman ${label}`}
      className="bg-card flex flex-wrap items-center justify-between gap-3 rounded-xl border px-4 py-3 text-sm"
    >
      <span aria-live="polite" className="text-muted-foreground tabular-nums">
        {pagination.start}–{pagination.end} dari {pagination.total} {label}
      </span>
      <div className="flex items-center gap-3">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="min-h-11"
          disabled={pagination.page === 1}
          onClick={() => pagination.onPageChange(pagination.page - 1)}
        >
          Sebelumnya
        </Button>
        <span className="text-muted-foreground tabular-nums">
          {pagination.page} / {pagination.totalPages}
        </span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="min-h-11"
          disabled={pagination.page === pagination.totalPages}
          onClick={() => pagination.onPageChange(pagination.page + 1)}
        >
          Berikutnya
        </Button>
      </div>
    </nav>
  );
}
