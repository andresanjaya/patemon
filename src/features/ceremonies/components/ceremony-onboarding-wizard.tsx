"use client";
import { withoutSourceReference } from "@/lib/notes";

import { FieldLabel, FieldGroup, Field } from "@/components/ui/field";
import { NativeSelect } from "@/components/ui/native-select";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  ArrowUp,
  ArrowDown,
  Plus,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  CalendarHeart,
  Loader2,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { ProvenanceBadge } from "./provenance-badge";
import { saveCeremonyPlanAction, type CeremonyPlanItemInput } from "../actions";
import type { CeremonyTemplate, WeddingCeremony } from "../types";
import type { WeddingWorkspace } from "@/features/workspaces/types";
import { formatMarriageForm } from "@/features/workspaces/validation";

interface CeremonyOnboardingWizardProps {
  workspace: WeddingWorkspace;
  templates: CeremonyTemplate[];
  existingCeremonies: WeddingCeremony[];
}

export function CeremonyOnboardingWizard({
  workspace,
  templates,
  existingCeremonies,
}: CeremonyOnboardingWizardProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Initialize ceremony items: either from existing plan or template suggestions
  const initialItems: CeremonyPlanItemInput[] =
    existingCeremonies.length > 0
      ? existingCeremonies.map((c) => ({
          templateId: c.templateId,
          title: c.title,
          phase: c.phase || "Puncak Acara",
          orderIndex: c.orderIndex,
          personInCharge: c.personInCharge,
          scheduledDate: c.scheduledDate,
          location: c.location,
          customNotes: c.customNotes,
          status: c.status,
        }))
      : templates
          .filter((template) => template.phase !== "Model adat")
          .map((t, idx) => ({
            templateId: t.id,
            title: t.name,
            phase: t.phase,
            orderIndex: idx + 1,
            personInCharge: t.defaultPic,
            scheduledDate: workspace.prospectiveDate,
            location: workspace.locationRegion,
            customNotes: `${t.description}. ${t.applicability}. ${t.validationStatus}.`,
            status: "draft",
          }));

  const [items, setItems] = useState<CeremonyPlanItemInput[]>(initialItems);

  // Custom ceremony modal/inline form state
  const [showAddCustom, setShowAddCustom] = useState(false);
  const [customTitle, setCustomTitle] = useState("");
  const [customPhase, setCustomPhase] = useState("Puncak Acara");
  const [customPic, setCustomPic] = useState("");

  const handleMoveUp = (index: number) => {
    if (index <= 0) return;
    const newItems = [...items];
    const temp = newItems[index - 1];
    newItems[index - 1] = newItems[index];
    newItems[index] = temp;
    setItems(newItems.map((item, idx) => ({ ...item, orderIndex: idx + 1 })));
  };

  const handleMoveDown = (index: number) => {
    if (index >= items.length - 1) return;
    const newItems = [...items];
    const temp = newItems[index + 1];
    newItems[index + 1] = newItems[index];
    newItems[index] = temp;
    setItems(newItems.map((item, idx) => ({ ...item, orderIndex: idx + 1 })));
  };

  const handleRemove = (index: number) => {
    const newItems = items.filter((_, idx) => idx !== index);
    setItems(newItems.map((item, idx) => ({ ...item, orderIndex: idx + 1 })));
  };

  const handleAddCustomCeremony = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customTitle.trim()) return;

    const newItem: CeremonyPlanItemInput = {
      templateId: null, // Custom ceremony has no predefined templateId
      title: customTitle.trim(),
      phase: customPhase,
      orderIndex: items.length + 1,
      personInCharge: customPic.trim() || null,
      scheduledDate: workspace.prospectiveDate,
      location: workspace.locationRegion,
      customNotes: "Upacara kustom keluarga.",
      status: "draft",
    };

    setItems([...items, newItem]);
    setCustomTitle("");
    setCustomPic("");
    setShowAddCustom(false);
  };

  const handleSavePlan = async () => {
    if (items.length === 0) {
      setErrorMessage("Rencana upacara minimal harus memiliki 1 prosesi.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    const result = await saveCeremonyPlanAction(workspace.id, items);

    if (!result.success) {
      setErrorMessage(result.message || "Gagal menyimpan rencana upacara.");
      setIsSubmitting(false);
      return;
    }

    router.push(`/workspace/${workspace.id}`);
  };

  return (
    <div className="space-y-8">
      {/* Step Indicators */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        <div
          className={`border-t-2 pt-2 text-xs font-medium transition-colors ${
            currentStep >= 1
              ? "border-primary text-primary"
              : "border-muted text-muted-foreground"
          }`}
        >
          1. Tinjau Adat & Dresta
        </div>
        <div
          className={`border-t-2 pt-2 text-xs font-medium transition-colors ${
            currentStep >= 2
              ? "border-primary text-primary"
              : "border-muted text-muted-foreground"
          }`}
        >
          2. Susun & Kustomisasi
        </div>
        <div
          className={`border-t-2 pt-2 text-xs font-medium transition-colors ${
            currentStep >= 3
              ? "border-primary text-primary"
              : "border-muted text-muted-foreground"
          }`}
        >
          3. Finalisasi Rencana
        </div>
      </div>

      {errorMessage && (
        <div className="bg-destructive/10 text-destructive border-destructive/20 flex items-center gap-2 rounded-md border p-3 text-sm">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* STEP 1: Customary Context Confirmation */}
      {currentStep === 1 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2.5">
              <div className="bg-primary/10 text-primary flex h-9 w-9 items-center justify-center rounded-lg">
                <CalendarHeart className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-xl">
                  Tinjau Bentuk Adat Pawiwahan
                </CardTitle>
                <CardDescription>
                  Sistem merekomendasikan tahapan prosesi berdasarkan bentuk
                  adat perkawinan yang Anda pilih
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="bg-muted/40 grid grid-cols-1 gap-4 rounded-xl p-4 sm:grid-cols-2">
              <div>
                <span className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
                  Nama Pasangan
                </span>
                <p className="text-foreground mt-0.5 text-base font-bold">
                  {workspace.coupleNames}
                </p>
              </div>

              <div>
                <span className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
                  Bentuk Adat Terpilih
                </span>
                <p className="text-primary mt-0.5 text-base font-bold">
                  {formatMarriageForm(workspace.marriageForm)}
                </p>
              </div>

              <div>
                <span className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
                  Wilayah / Dresta
                </span>
                <p className="text-foreground mt-0.5 text-sm">
                  {workspace.locationRegion || "Bali (Umum)"}
                </p>
              </div>

              <div>
                <span className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
                  Rencana Tanggal (Dewasa Ayu)
                </span>
                <p className="text-foreground mt-0.5 text-sm">
                  {workspace.prospectiveDate
                    ? new Date(workspace.prospectiveDate).toLocaleDateString(
                        "id-ID",
                        {
                          weekday: "long",
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        }
                      )
                    : "Belum ditetapkan (fleksibel)"}
                </p>
              </div>
            </div>

            {/* Cultural Guardrail Notice */}
            <div className="flex items-start gap-3 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 text-xs leading-relaxed text-amber-900 dark:text-amber-300">
              <Info className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
              <div className="space-y-1">
                <p className="text-sm font-semibold">
                  Prinsip Keluwesan Dresta Adat:
                </p>
                <p className="text-muted-foreground">
                  Patemon tidak menetapkan keharusan mutlak tatacara keagamaan.
                  Setiap saran prosesi dapat disesuaikan, ditambah, atau
                  dikurangi sesuai rembug keluarga dan petunjuk sulinggih atau
                  pemangku yang muput karya.
                </p>
              </div>
            </div>
          </CardContent>

          <CardFooter className="border-border/40 flex justify-between border-t pt-4">
            <Button variant="outline" asChild>
              <Link href={`/workspace/${workspace.id}`}>Batal</Link>
            </Button>
            <Button onClick={() => setCurrentStep(2)} className="gap-2">
              <span>Lanjutkan ke Penyusunan Upacara</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* STEP 2: Editable Ceremony List with Provenance & Warnings */}
      {currentStep === 2 && (
        <div className="space-y-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-bold tracking-tight">
                Susun & Kustomisasi Rangkaian Upacara
              </h2>
              <p className="text-muted-foreground text-xs">
                Ubah urutan, hapus tahapan yang tidak diperlukan, atau tambahkan
                upacara kustom keluarga Anda
              </p>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAddCustom(!showAddCustom)}
              className="gap-1.5 self-start sm:self-auto"
            >
              <Plus className="h-4 w-4" />
              <span>Tambah Prosesi Kustom</span>
            </Button>
          </div>

          <Field>
            <FieldLabel htmlFor="recommendedCeremony">
              Tambah dari {templates.length} rekomendasi prosesi
            </FieldLabel>
            <NativeSelect
              id="recommendedCeremony"
              value=""
              onChange={(event) => {
                const template = templates.find(
                  (item) => item.id === event.target.value
                );
                if (!template) return;
                setItems((previous) => [
                  ...previous,
                  {
                    templateId: template.id,
                    title: template.name,
                    phase: template.phase,
                    orderIndex: previous.length + 1,
                    personInCharge: template.defaultPic,
                    scheduledDate: null,
                    location: null,
                    status: "draft",
                    customNotes: `${template.description}. ${template.applicability}. ${template.validationStatus}.`,
                  },
                ]);
              }}
            >
              <option value="">Pilih template sesuai kebutuhan keluarga</option>
              {templates.map((template) => (
                <option
                  key={template.id}
                  value={template.id}
                  disabled={items.some(
                    (item) => item.templateId === template.id
                  )}
                >
                  {template.name} · {template.applicability}
                </option>
              ))}
            </NativeSelect>
          </Field>

          {/* Add Custom Ceremony Form */}
          {showAddCustom && (
            <Card className="border-primary/30 bg-primary/5">
              <form onSubmit={handleAddCustomCeremony}>
                <FieldGroup className="gap-4">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold">
                      Tambah Prosesi Adat Baru
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <Field>
                      <FieldLabel htmlFor="customTitle">
                        Nama Upacara <span className="text-destructive">*</span>
                      </FieldLabel>
                      <Input
                        id="customTitle"
                        value={customTitle}
                        onChange={(e) => setCustomTitle(e.target.value)}
                        placeholder="Contoh: Upacara Penegtegan"
                        required
                      />
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="customPhase">
                        Tahapan (Fase)
                      </FieldLabel>
                      <NativeSelect
                        id="customPhase"
                        value={customPhase}
                        onChange={(e) => setCustomPhase(e.target.value)}
                        className="border-input flex w-full rounded-md border bg-transparent px-3 py-1"
                      >
                        <option value="Persiapan">Persiapan</option>
                        <option value="Puncak Acara">Puncak Acara</option>
                        <option value="Pasca Pawiwahan">Pasca Pawiwahan</option>
                      </NativeSelect>
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="customPic">
                        Penanggung Jawab (PIC)
                      </FieldLabel>
                      <Input
                        id="customPic"
                        value={customPic}
                        onChange={(e) => setCustomPic(e.target.value)}
                        placeholder="Contoh: Pemangku / Prajuru"
                      />
                    </Field>
                  </CardContent>
                  <CardFooter className="flex justify-end gap-2 pt-0">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowAddCustom(false)}
                    >
                      Batal
                    </Button>
                    <Button type="submit" size="sm">
                      Tambahkan ke Rencana
                    </Button>
                  </CardFooter>
                </FieldGroup>
              </form>
            </Card>
          )}

          {/* Draggable/Reorderable Ceremony Cards */}
          <div className="space-y-3">
            {items.map((item, index) => {
              const matchingTemplate = templates.find(
                (t) => t.id === item.templateId
              );
              const isConditional =
                matchingTemplate?.validationStatus
                  ?.toLowerCase()
                  .includes("validasi") ||
                matchingTemplate?.validationStatus
                  ?.toLowerCase()
                  .includes("perlu");

              return (
                <div
                  key={`${item.templateId || "custom"}-${index}`}
                  className="border-border bg-card hover:border-primary/30 flex flex-col gap-3 rounded-xl border p-4 shadow-xs transition-colors sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex items-start gap-3">
                    <div className="bg-primary/10 text-primary flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold">
                      {index + 1}
                    </div>

                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline" className="text-[10px]">
                          {item.phase}
                        </Badge>
                        <h4 className="text-foreground text-sm font-semibold">
                          {item.title}
                        </h4>
                        {matchingTemplate && (
                          <ProvenanceBadge
                            status={matchingTemplate.validationStatus}
                            sourceUrl={matchingTemplate.sourceUrl}
                          />
                        )}
                        {!item.templateId && (
                          <Badge variant="secondary" className="text-[10px]">
                            Kustom Keluarga
                          </Badge>
                        )}
                      </div>

                      {item.customNotes && (
                        <p className="text-muted-foreground line-clamp-2 text-xs">
                          {withoutSourceReference(item.customNotes)}
                        </p>
                      )}

                      {/* Confirmation-needed warning for conditional adat practices */}
                      {isConditional && (
                        <div className="flex items-center gap-1.5 pt-1 text-[11px] font-medium text-amber-600 dark:text-amber-400">
                          <AlertTriangle className="h-3 w-3 shrink-0" />
                          <span>
                            Kondisional: Pastikan disepakati kedua keluarga /
                            pamangku.
                          </span>
                        </div>
                      )}

                      <div className="text-muted-foreground flex flex-wrap items-center gap-3 pt-0.5 text-[11px]">
                        {item.personInCharge && (
                          <span>
                            PIC: <strong>{item.personInCharge}</strong>
                          </span>
                        )}
                        {item.scheduledDate && (
                          <span>Tanggal: {item.scheduledDate}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons: Move Up, Move Down, Delete */}
                  <div className="flex shrink-0 items-center gap-1.5 self-end sm:self-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleMoveUp(index)}
                      disabled={index === 0}
                      title="Pindah ke Atas"
                      className="h-8 w-8 p-0"
                    >
                      <ArrowUp className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleMoveDown(index)}
                      disabled={index === items.length - 1}
                      title="Pindah ke Bawah"
                      className="h-8 w-8 p-0"
                    >
                      <ArrowDown className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemove(index)}
                      title="Hapus dari Rencana"
                      className="h-8 w-8 p-0"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="border-border/40 flex items-center justify-between border-t pt-4">
            <Button variant="outline" onClick={() => setCurrentStep(1)}>
              <ArrowLeft className="mr-1.5 h-4 w-4" />
              <span>Kembali</span>
            </Button>
            <Button onClick={() => setCurrentStep(3)} className="gap-1.5">
              <span>Lanjut ke Finalisasi</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* STEP 3: Review & Apply Plan */}
      {currentStep === 3 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-xl">
                  Konfirmasi & Terapkan Rencana Upacara
                </CardTitle>
                <CardDescription>
                  Rencana akan disimpan ke dalam workspace dan menjadi panduan
                  checklist persiapan upakara
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="border-border/60 divide-border/40 divide-y rounded-xl border">
              {items.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3.5 text-xs"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-muted-foreground w-5 text-center font-bold">
                      {index + 1}.
                    </span>
                    <div>
                      <p className="text-foreground text-sm font-semibold">
                        {item.title}
                      </p>
                      <p className="text-muted-foreground text-[11px]">
                        Fase: {item.phase}{" "}
                        {item.personInCharge
                          ? `· PIC: ${item.personInCharge}`
                          : ""}
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-[10px]">
                    Draft
                  </Badge>
                </div>
              ))}
            </div>

            <p className="text-muted-foreground text-center text-xs">
              Anda tetap dapat mengubah, menambah, atau merevisi urutan prosesi
              kapan saja melalui pengaturan workspace.
            </p>
          </CardContent>

          <CardFooter className="border-border/40 flex justify-between border-t pt-4">
            <Button
              variant="outline"
              onClick={() => setCurrentStep(2)}
              disabled={isSubmitting}
            >
              <ArrowLeft className="mr-1.5 h-4 w-4" />
              <span>Kembali Edit</span>
            </Button>
            <Button
              onClick={handleSavePlan}
              disabled={isSubmitting}
              className="gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Menerapkan Rencana...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  <span>Terapkan Rencana Upacara</span>
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}
