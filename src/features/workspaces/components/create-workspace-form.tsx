"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { Sparkles, Loader2, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  createWeddingWorkspaceAction,
  type WorkspaceActionResult,
} from "../actions";
import { MARRIAGE_FORMS, BALI_REGIONS, formatRupiah } from "../validation";
import type { MarriageForm } from "../types";

export function CreateWorkspaceForm() {
  const [state, formAction, isPending] = useActionState<
    WorkspaceActionResult | null,
    FormData
  >(createWeddingWorkspaceAction, null);

  const [marriageForm, setMarriageForm] = useState<MarriageForm>("memadik");
  const [budgetPreview, setBudgetPreview] = useState<number>(50000000);

  const selectedFormInfo = MARRIAGE_FORMS.find((f) => f.value === marriageForm);

  return (
    <form action={formAction} className="space-y-6">
      {state?.message && !state.success && (
        <div className="bg-destructive/10 text-destructive border-destructive/20 rounded-md border p-3 text-sm">
          {state.message}
        </div>
      )}

      {/* Couple Names / Wedding Title */}
      <div className="space-y-2">
        <Label htmlFor="coupleNames">
          Nama Pasangan / Judul Pawiwahan{" "}
          <span className="text-destructive">*</span>
        </Label>
        <Input
          id="coupleNames"
          name="coupleNames"
          placeholder="Contoh: Pawiwahan Arya & Ratna"
          required
          disabled={isPending}
        />
        {state?.errors?.coupleNames && (
          <p className="text-destructive text-xs">{state.errors.coupleNames}</p>
        )}
      </div>

      {/* Individual Names (Optional) */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="groomName">Nama Mempelai Pria (Purusa)</Label>
          <Input
            id="groomName"
            name="groomName"
            placeholder="Contoh: I Gede Arya Wijaya"
            disabled={isPending}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="brideName">Nama Mempelai Wanita (Pradana)</Label>
          <Input
            id="brideName"
            name="brideName"
            placeholder="Contoh: Ni Luh Ratna Dewi"
            disabled={isPending}
          />
        </div>
      </div>

      {/* Marriage Form (Bentuk Perkawinan Adat) */}
      <div className="space-y-2">
        <Label htmlFor="marriageForm">
          Bentuk Perkawinan Adat Bali{" "}
          <span className="text-destructive">*</span>
        </Label>
        <select
          id="marriageForm"
          name="marriageForm"
          value={marriageForm}
          onChange={(e) => setMarriageForm(e.target.value as MarriageForm)}
          disabled={isPending}
          className="border-input focus-visible:border-ring focus-visible:ring-ring/50 flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] md:text-sm"
        >
          {MARRIAGE_FORMS.map((form) => (
            <option key={form.value} value={form.value}>
              {form.label}
            </option>
          ))}
        </select>
        {selectedFormInfo && (
          <div className="bg-muted/50 text-muted-foreground flex items-start gap-2 rounded-md p-2.5 text-xs">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>{selectedFormInfo.description}</span>
          </div>
        )}
        {state?.errors?.marriageForm && (
          <p className="text-destructive text-xs">
            {state.errors.marriageForm}
          </p>
        )}
      </div>

      {/* Region & Prospective Date */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="locationRegion">Kabupaten / Wilayah Dresta</Label>
          <select
            id="locationRegion"
            name="locationRegion"
            defaultValue="Denpasar"
            disabled={isPending}
            className="border-input focus-visible:border-ring focus-visible:ring-ring/50 flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] md:text-sm"
          >
            <option value="">Pilih Wilayah (Opsional)</option>
            {BALI_REGIONS.map((region) => (
              <option key={region} value={region}>
                {region}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="prospectiveDate">Rencana Tanggal / Dewasa Ayu</Label>
          <Input
            id="prospectiveDate"
            name="prospectiveDate"
            type="date"
            disabled={isPending}
          />
          <p className="text-muted-foreground text-[11px]">
            Dapat dikosongkan jika belum diputuskan bersama keluarga/sulanggih.
          </p>
          {state?.errors?.prospectiveDate && (
            <p className="text-destructive text-xs">
              {state.errors.prospectiveDate}
            </p>
          )}
        </div>
      </div>

      {/* Target Budget */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="targetBudget">Estimasi Alokasi Anggaran (IDR)</Label>
          <span className="text-muted-foreground text-xs font-semibold">
            {formatRupiah(budgetPreview)}
          </span>
        </div>
        <Input
          id="targetBudget"
          name="targetBudget"
          type="number"
          min={0}
          step={5000000}
          defaultValue={50000000}
          onChange={(e) => setBudgetPreview(parseInt(e.target.value, 10) || 0)}
          disabled={isPending}
        />
        <p className="text-muted-foreground text-[11px]">
          Anggaran fleksibel sebagai panduan banten, konsumsi, dan sarana.
        </p>
        {state?.errors?.targetBudget && (
          <p className="text-destructive text-xs">
            {state.errors.targetBudget}
          </p>
        )}
      </div>

      {/* Notes / Catatan Adat */}
      <div className="space-y-2">
        <Label htmlFor="notes">Catatan Khusus / Pesan Keluarga</Label>
        <Textarea
          id="notes"
          name="notes"
          placeholder="Catatan dresta keluarga, sulanggih/pemangku yang memimpin, atau hal khusus lainnya..."
          rows={3}
          disabled={isPending}
        />
      </div>

      <div className="flex items-center justify-end gap-3 pt-2">
        <Button variant="outline" asChild disabled={isPending}>
          <Link href="/workspaces">Batal</Link>
        </Button>
        <Button type="submit" disabled={isPending} className="gap-2">
          {isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Membuat Workspace...</span>
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              <span>Buat Workspace Pawiwahan</span>
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
