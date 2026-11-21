"use client";

import {
  FieldLabel,
  FieldGroup,
  Field,
  FieldError,
} from "@/components/ui/field";
import { NativeSelect } from "@/components/ui/native-select";
import { useActionState, useState } from "react";
import { Loader2, Save, Trash2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { Textarea } from "@/components/ui/textarea";
import {
  updateWeddingWorkspaceAction,
  deleteWeddingWorkspaceAction,
  type WorkspaceActionResult,
} from "../actions";
import { MARRIAGE_FORMS, BALI_REGIONS, formatRupiah } from "../validation";
import { useWorkspace } from "@/features/workspaces/context/workspace-context";
import { UpgradePromptModal } from "@/features/payments/components/upgrade-prompt-modal";
import type { MarriageForm, WeddingWorkspace, WorkspaceRole } from "../types";

interface WorkspaceSettingsFormProps {
  workspace: WeddingWorkspace;
  userRole: WorkspaceRole;
  isPreview?: boolean;
}

export function WorkspaceSettingsForm({
  workspace,
  userRole,
  isPreview: propIsPreview,
}: WorkspaceSettingsFormProps) {
  const workspaceCtx = useWorkspace();
  const isPreview =
    propIsPreview ?? workspaceCtx?.isPreview ?? workspace.id === "demo";
  const [isLocalUpgradeOpen, setIsLocalUpgradeOpen] = useState(false);

  const triggerUpgrade = () => {
    if (workspaceCtx?.openUpgradeModal) {
      workspaceCtx.openUpgradeModal();
    } else {
      setIsLocalUpgradeOpen(true);
    }
  };

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
    if (isPreview) {
      triggerUpgrade();
      return;
    }
    if (!isOwner) return;
    setIsDeleting(true);
    await deleteWeddingWorkspaceAction(workspace.id);
  };

  return (
    <div className="space-y-10">
      <form
        action={formAction}
        onSubmit={(e) => {
          if (isPreview) {
            e.preventDefault();
            triggerUpgrade();
          }
        }}
        className="space-y-6"
      >
        <FieldGroup className="gap-4">
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
          <Field>
            <FieldLabel htmlFor="coupleNames">
              Nama Pasangan / Judul Pawiwahan{" "}
              <span className="text-destructive">*</span>
            </FieldLabel>
            <Input
              id="coupleNames"
              name="coupleNames"
              defaultValue={workspace.coupleNames}
              required
              disabled={!canEdit || isPending}
            />
            {state?.errors?.coupleNames && (
              <FieldError className="text-destructive">
                {state.errors.coupleNames}
              </FieldError>
            )}
          </Field>

          {/* Individual Names */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="groomName">
                Nama Mempelai Pria (Purusa)
              </FieldLabel>
              <Input
                id="groomName"
                name="groomName"
                defaultValue={workspace.groomName || ""}
                disabled={!canEdit || isPending}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="brideName">
                Nama Mempelai Wanita (Pradana)
              </FieldLabel>
              <Input
                id="brideName"
                name="brideName"
                defaultValue={workspace.brideName || ""}
                disabled={!canEdit || isPending}
              />
            </Field>
          </div>

          {/* Marriage Form */}
          <Field>
            <FieldLabel htmlFor="marriageForm">
              Bentuk Perkawinan Adat Bali
            </FieldLabel>
            <NativeSelect
              id="marriageForm"
              name="marriageForm"
              value={marriageForm}
              onChange={(e) => setMarriageForm(e.target.value as MarriageForm)}
              disabled={!canEdit || isPending}
              className="border-input focus-visible:border-ring focus-visible:ring-ring/50 flex w-full rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] md:text-sm"
            >
              {MARRIAGE_FORMS.map((form) => (
                <option key={form.value} value={form.value}>
                  {form.label}
                </option>
              ))}
            </NativeSelect>
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
                defaultValue={workspace.locationRegion || ""}
                disabled={!canEdit || isPending}
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
                defaultValue={workspace.prospectiveDate || ""}
                disabled={!canEdit || isPending}
              />
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
              defaultValue={workspace.targetBudget}
              onChange={(e) =>
                setBudgetPreview(parseInt(e.target.value, 10) || 0)
              }
              disabled={!canEdit || isPending}
            />
          </Field>

          {/* Notes */}
          <Field>
            <FieldLabel htmlFor="notes">
              Catatan Khusus / Pesan Keluarga
            </FieldLabel>
            <Textarea
              id="notes"
              name="notes"
              defaultValue={workspace.notes || ""}
              rows={3}
              disabled={!canEdit || isPending}
            />
          </Field>

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
        </FieldGroup>
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
              onClick={() => {
                if (isPreview) {
                  triggerUpgrade();
                  return;
                }
                setShowDeleteConfirm(true);
              }}
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

      {/* Fallback Upgrade Modal */}
      <UpgradePromptModal
        isOpen={isLocalUpgradeOpen}
        onClose={() => setIsLocalUpgradeOpen(false)}
        weddingId={workspace.id}
      />
    </div>
  );
}
