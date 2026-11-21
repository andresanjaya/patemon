"use client";

import {
  FieldLabel,
  FieldGroup,
  Field,
  FieldError,
  FieldDescription,
} from "@/components/ui/field";
import { NativeSelect } from "@/components/ui/native-select";
import { useActionState, useState } from "react";
import Link from "next/link";
import { Sparkles, Loader2, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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
      <FieldGroup className="gap-4">
        {state?.message && !state.success && (
          <div className="bg-destructive/10 text-destructive border-destructive/20 rounded-md border p-3 text-sm">
            {state.message}
          </div>
        )}

        {/* Couple Names / Wedding Title */}
        <Field>
          <FieldLabel htmlFor="coupleNames">
            Nama Pasangan / Judul Pawiwahan{" "}
            <span className="text-destructive">*</span>
          </FieldLabel>
          <Input
            id="coupleNames"
            name="coupleNames"
            placeholder="Contoh: Pawiwahan Arya & Ratna"
            required
            disabled={isPending}
          />
          {state?.errors?.coupleNames && (
            <FieldError className="text-destructive">
              {state.errors.coupleNames}
            </FieldError>
          )}
        </Field>

        {/* Individual Names (Optional) */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="groomName">
              Nama Mempelai Pria (Purusa)
            </FieldLabel>
            <Input
              id="groomName"
              name="groomName"
              placeholder="Contoh: I Gede Arya Wijaya"
              disabled={isPending}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="brideName">
              Nama Mempelai Wanita (Pradana)
            </FieldLabel>
            <Input
              id="brideName"
              name="brideName"
              placeholder="Contoh: Ni Luh Ratna Dewi"
              disabled={isPending}
            />
          </Field>
        </div>

        {/* Marriage Form (Bentuk Perkawinan Adat) */}
        <Field>
          <FieldLabel htmlFor="marriageForm">
            Bentuk Perkawinan Adat Bali{" "}
            <span className="text-destructive">*</span>
          </FieldLabel>
          <NativeSelect
            id="marriageForm"
            name="marriageForm"
            value={marriageForm}
            onChange={(e) => setMarriageForm(e.target.value as MarriageForm)}
            disabled={isPending}
            className="border-input focus-visible:border-ring focus-visible:ring-ring/50 flex w-full rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] md:text-sm"
          >
            {MARRIAGE_FORMS.map((form) => (
              <option key={form.value} value={form.value}>
                {form.label}
              </option>
            ))}
          </NativeSelect>
          {selectedFormInfo && (
            <div className="bg-muted/50 text-muted-foreground flex items-start gap-2 rounded-md p-2.5 text-xs">
              <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span>{selectedFormInfo.description}</span>
            </div>
          )}
          {state?.errors?.marriageForm && (
            <FieldError className="text-destructive">
              {state.errors.marriageForm}
            </FieldError>
          )}
        </Field>

        {/* Region & Prospective Date */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="locationRegion">
              Kabupaten / Wilayah Dresta
            </FieldLabel>
            <NativeSelect
              id="locationRegion"
              name="locationRegion"
              defaultValue="Denpasar"
              disabled={isPending}
              className="border-input focus-visible:border-ring focus-visible:ring-ring/50 flex w-full rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] md:text-sm"
            >
              <option value="">Pilih Wilayah (Opsional)</option>
              {BALI_REGIONS.map((region) => (
                <option key={region} value={region}>
                  {region}
                </option>
              ))}
            </NativeSelect>
          </Field>

          <Field>
            <FieldLabel htmlFor="prospectiveDate">
              Rencana Tanggal / Dewasa Ayu
            </FieldLabel>
            <Input
              id="prospectiveDate"
              name="prospectiveDate"
              type="date"
              disabled={isPending}
            />
            <FieldDescription className="text-muted-foreground">
              Dapat dikosongkan jika belum diputuskan bersama
              keluarga/sulanggih.
            </FieldDescription>
            {state?.errors?.prospectiveDate && (
              <FieldError className="text-destructive">
                {state.errors.prospectiveDate}
              </FieldError>
            )}
          </Field>
        </div>

        {/* Target Budget */}
        <Field>
          <div className="flex items-center justify-between">
            <FieldLabel htmlFor="targetBudget">
              Estimasi Alokasi Anggaran (IDR)
            </FieldLabel>
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
            onChange={(e) =>
              setBudgetPreview(parseInt(e.target.value, 10) || 0)
            }
            disabled={isPending}
          />
          <FieldDescription className="text-muted-foreground">
            Anggaran fleksibel sebagai panduan banten, konsumsi, dan sarana.
          </FieldDescription>
          {state?.errors?.targetBudget && (
            <FieldError className="text-destructive">
              {state.errors.targetBudget}
            </FieldError>
          )}
        </Field>

        {/* Notes / Catatan Adat */}
        <Field>
          <FieldLabel htmlFor="notes">
            Catatan Khusus / Pesan Keluarga
          </FieldLabel>
          <Textarea
            id="notes"
            name="notes"
            placeholder="Catatan dresta keluarga, sulanggih/pemangku yang memimpin, atau hal khusus lainnya..."
            rows={3}
            disabled={isPending}
          />
        </Field>

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
      </FieldGroup>
    </form>
  );
}
