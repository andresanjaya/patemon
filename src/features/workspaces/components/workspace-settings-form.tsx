"use client";

import { useActionState, useState } from "react";
import { Loader2, Save, Trash2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  updateWeddingWorkspaceAction,
  deleteWeddingWorkspaceAction,
  type WorkspaceActionResult,
} from "../actions";
import { MARRIAGE_FORMS, BALI_REGIONS, formatRupiah } from "../validation";
import type { MarriageForm, WeddingWorkspace, WorkspaceRole } from "../types";

interface WorkspaceSettingsFormProps {
  workspace: WeddingWorkspace;
  userRole: WorkspaceRole;
}

export function WorkspaceSettingsForm({
  workspace,
  userRole,
}: WorkspaceSettingsFormProps) {
  const updateActionWithId = updateWeddingWorkspaceAction.bind(
    null,
    workspace.id
  );

  const [state, formAction, isPending] = useActionState<
    WorkspaceActionResult | null,
    FormData
  >(updateActionWithId, null);

  const [budgetPreview, setBudgetPreview] = useState<number>(
    workspace.targetBudget || 0
  );
  const [marriageForm, setMarriageForm] = useState<MarriageForm>(
    workspace.marriageForm
  );
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const isOwner = userRole === "owner";
  const canEdit = isOwner || userRole === "editor";

  const handleDelete = async () => {
    if (!isOwner) return;
    setIsDeleting(true);
    await deleteWeddingWorkspaceAction(workspace.id);
  };

  return (
    <div className="space-y-10">
      <form action={formAction} className="space-y-6">
        {state?.message && (
          <div
            className={`rounded-md border p-3 text-sm ${
              state.success
                ? "bg-primary/10 text-primary border-primary/20"
                : "bg-destructive/10 text-destructive border-destructive/20"
            }`}
          >
            {state.message}
          </div>
        )}

        {/* Couple Names */}
        <div className="space-y-2">
          <Label htmlFor="coupleNames">
            Nama Pasangan / Judul Pawiwahan{" "}
            <span className="text-destructive">*</span>
          </Label>
          <Input
            id="coupleNames"
            name="coupleNames"
            defaultValue={workspace.coupleNames}
            required
            disabled={!canEdit || isPending}
          />
          {state?.errors?.coupleNames && (
            <p className="text-destructive text-xs">
              {state.errors.coupleNames}
            </p>
          )}
        </div>

        {/* Individual Names */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="groomName">Nama Mempelai Pria (Purusa)</Label>
            <Input
              id="groomName"
              name="groomName"
              defaultValue={workspace.groomName || ""}
              disabled={!canEdit || isPending}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="brideName">Nama Mempelai Wanita (Pradana)</Label>
            <Input
              id="brideName"
              name="brideName"
              defaultValue={workspace.brideName || ""}
              disabled={!canEdit || isPending}
            />
          </div>
        </div>

        {/* Marriage Form */}
        <div className="space-y-2">
          <Label htmlFor="marriageForm">Bentuk Perkawinan Adat Bali</Label>
          <select
            id="marriageForm"
            name="marriageForm"
            value={marriageForm}
            onChange={(e) => setMarriageForm(e.target.value as MarriageForm)}
            disabled={!canEdit || isPending}
            className="border-input focus-visible:border-ring focus-visible:ring-ring/50 flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] md:text-sm"
          >
            {MARRIAGE_FORMS.map((form) => (
              <option key={form.value} value={form.value}>
                {form.label}
              </option>
            ))}
          </select>
        </div>

        {/* Region & Prospective Date */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="locationRegion">Kabupaten / Wilayah Dresta</Label>
            <select
              id="locationRegion"
              name="locationRegion"
              defaultValue={workspace.locationRegion || ""}
              disabled={!canEdit || isPending}
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
            <Label htmlFor="prospectiveDate">
              Rencana Tanggal / Dewasa Ayu
            </Label>
            <Input
              id="prospectiveDate"
              name="prospectiveDate"
              type="date"
              defaultValue={workspace.prospectiveDate || ""}
              disabled={!canEdit || isPending}
            />
          </div>
        </div>

        {/* Target Budget */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="targetBudget">
              Estimasi Alokasi Anggaran (IDR)
            </Label>
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
            defaultValue={workspace.targetBudget}
            onChange={(e) =>
              setBudgetPreview(parseInt(e.target.value, 10) || 0)
            }
            disabled={!canEdit || isPending}
          />
        </div>

        {/* Notes */}
        <div className="space-y-2">
          <Label htmlFor="notes">Catatan Khusus / Pesan Keluarga</Label>
          <Textarea
            id="notes"
            name="notes"
            defaultValue={workspace.notes || ""}
            rows={3}
            disabled={!canEdit || isPending}
          />
        </div>

        {canEdit && (
          <div className="flex justify-end pt-2">
            <Button type="submit" disabled={isPending} className="gap-2">
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  <span>Simpan Perubahan</span>
                </>
              )}
            </Button>
          </div>
        )}
      </form>

      {/* Danger Zone: Soft Delete Workspace */}
      {isOwner && workspace.id !== "demo" && (
        <div className="border-destructive/30 bg-destructive/5 rounded-lg border p-6">
          <h3 className="text-destructive flex items-center gap-2 text-base font-semibold">
            <AlertTriangle className="h-5 w-5" />
            Zona Bahaya
          </h3>
          <p className="text-muted-foreground mt-1 text-sm">
            Menghapus workspace akan menyembunyikan pawiwahan ini dari seluruh
            anggota dan rencana upacara yang telah disusun.
          </p>

          {!showDeleteConfirm ? (
            <Button
              variant="outline"
              className="border-destructive/40 text-destructive hover:bg-destructive hover:text-destructive-foreground mt-4 gap-2"
              onClick={() => setShowDeleteConfirm(true)}
            >
              <Trash2 className="h-4 w-4" />
              <span>Hapus Workspace Ini</span>
            </Button>
          ) : (
            <div className="mt-4 space-y-3">
              <p className="text-destructive text-sm font-medium">
                Apakah Anda yakin ingin menghapus workspace ini? Tindakan ini
                tidak dapat dibatalkan secara mandiri.
              </p>
              <div className="flex items-center gap-3">
                <Button
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="gap-2"
                >
                  {isDeleting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                  <span>Ya, Hapus Sekarang</span>
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={isDeleting}
                >
                  Batal
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
