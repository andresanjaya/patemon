"use client";

import { FieldLabel, FieldGroup, Field } from "@/components/ui/field";
import { NativeSelect } from "@/components/ui/native-select";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Flower2,
  Plus,
  X,
  CheckCircle2,
  AlertCircle,
  Clock,
  Hammer,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { formatRupiah } from "@/features/workspaces/validation";
import {
  addRitualItemToCeremonyAction,
  updateRitualItemStatusAction,
} from "../actions";
import { useWorkspace } from "@/features/workspaces/context/workspace-context";
import type { CeremonyRitualItem } from "../types";
import type { WorkspaceRole } from "@/features/workspaces/types";

interface CeremonyBantenManagerProps {
  weddingId: string;
  ceremonyId: string;
  initialItems: CeremonyRitualItem[];
  userRole: WorkspaceRole;
}

export function CeremonyBantenManager({
  weddingId,
  ceremonyId,
  initialItems,
  userRole,
}: CeremonyBantenManagerProps) {
  const router = useRouter();
  const workspaceCtx = useWorkspace();
  const isPreview = workspaceCtx?.isPreview ?? weddingId === "demo";
  const triggerUpgrade = () => workspaceCtx?.openUpgradeModal?.();
  const canEdit = isPreview || userRole === "owner" || userRole === "editor";

  const [items, setItems] = useState<CeremonyRitualItem[]>(initialItems);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // New item form state
  const [name, setName] = useState("");
  const [category, setCategory] = useState("utama");
  const [quantity, setQuantity] = useState(1);
  const [unit, setUnit] = useState("Paket");
  const [sourcingMethod, setSourcingMethod] =
    useState<CeremonyRitualItem["sourcingMethod"]>("purchased_package");
  const [assigneeName, setAssigneeName] = useState("");
  const [estimatedPrice, setEstimatedPrice] = useState(0);
  const [notes, setNotes] = useState("");

  const handleToggleStatus = async (item: CeremonyRitualItem) => {
    if (isPreview) {
      triggerUpgrade();
      return;
    }
    if (!canEdit) return;

    const statusCycle: CeremonyRitualItem["status"][] = [
      "needed",
      "ordered",
      "making",
      "ready",
      "not_needed",
    ];
    const currentIndex = statusCycle.indexOf(item.status);
    const nextStatus = statusCycle[(currentIndex + 1) % statusCycle.length];

    // Optimistic update
    setItems((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, status: nextStatus } : i))
    );

    await updateRitualItemStatusAction(
      weddingId,
      ceremonyId,
      item.id,
      nextStatus
    );
    router.refresh();
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) return;

    if (!name.trim()) {
      setErrorMsg("Nama banten atau sarana upacara wajib diisi.");
      return;
    }

    setLoading(true);
    setErrorMsg("");

    const res = await addRitualItemToCeremonyAction(weddingId, ceremonyId, {
      name,
      category,
      quantity: Number(quantity) || 1,
      unit,
      sourcingMethod,
      status: "needed",
      assigneeName: assigneeName || null,
      estimatedPrice: Number(estimatedPrice) || 0,
      notes: notes || null,
    });

    setLoading(false);

    if (res.success) {
      const newItem: CeremonyRitualItem = {
        id: res.itemId || "banten-" + Date.now(),
        weddingId,
        ceremonyId,
        name,
        category,
        quantity: Number(quantity) || 1,
        unit,
        sourcingMethod,
        status: "needed",
        assigneeName: assigneeName || null,
        estimatedPrice: Number(estimatedPrice) || 0,
        actualPrice: 0,
        notes: notes || null,
      };

      setItems((prev) => [...prev, newItem]);

      // Reset
      setName("");
      setQuantity(1);
      setAssigneeName("");
      setEstimatedPrice(0);
      setNotes("");
      setIsModalOpen(false);
      router.refresh();
    } else {
      setErrorMsg(res.message || "Gagal menambahkan banten.");
    }
  };

  const getStatusBadge = (status: CeremonyRitualItem["status"]) => {
    switch (status) {
      case "ready":
        return (
          <Badge className="bg-emerald-600 text-[10px] text-white hover:bg-emerald-700">
            <CheckCircle2 className="mr-1 h-3 w-3" /> Siap
          </Badge>
        );
      case "making":
        return (
          <Badge className="bg-amber-600 text-[10px] text-white hover:bg-amber-700">
            <Hammer className="mr-1 h-3 w-3" /> Sedang Dibuat
          </Badge>
        );
      case "ordered":
        return (
          <Badge className="bg-blue-600 text-[10px] text-white hover:bg-blue-700">
            <Clock className="mr-1 h-3 w-3" /> Dipesan
          </Badge>
        );
      case "not_needed":
        return (
          <Badge
            variant="outline"
            className="text-muted-foreground text-[10px]"
          >
            Tidak Diperlukan
          </Badge>
        );
      case "needed":
      default:
        return (
          <Badge
            variant="secondary"
            className="text-[10px] text-amber-800 dark:text-amber-300"
          >
            <AlertCircle className="mr-1 h-3 w-3" /> Dibutuhkan
          </Badge>
        );
    }
  };

  const getSourcingLabel = (method: CeremonyRitualItem["sourcingMethod"]) => {
    switch (method) {
      case "purchased_package":
        return "Beli Paket";
      case "self_made":
        return "Buat Sendiri";
      case "family_assigned":
        return "Tugas Keluarga";
      case "vendor_order":
        return "Pesan Vendor";
      default:
        return method;
    }
  };

  return (
    <Card className="border-border">
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <CardTitle className="text-foreground text-lg">
              Kebutuhan Banten & Sarana
            </CardTitle>
            <Badge variant="secondary" className="text-xs">
              {items.length} Item
            </Badge>
          </div>
          <CardDescription className="mt-1 text-xs">
            Daftar banten dan sarana upakara khusus yang diperlukan dalam
            prosesi ini.
          </CardDescription>
        </div>

        {canEdit && (
          <Button
            size="sm"
            onClick={() => {
              if (isPreview) {
                triggerUpgrade();
                return;
              }
              setIsModalOpen(true);
            }}
            className="gap-1.5 self-start sm:self-auto"
          >
            <Plus className="h-4 w-4" />
            <span>Tambah Banten</span>
          </Button>
        )}
      </CardHeader>

      <CardContent>
        {items.length === 0 ? (
          <div className="border-border/60 rounded-xl border border-dashed py-8 text-center">
            <Flower2 className="text-muted-foreground/60 mx-auto h-8 w-8" />
            <p className="text-foreground mt-2 text-sm font-semibold">
              Belum Ada Banten Terdaftar
            </p>
            <p className="text-muted-foreground mx-auto mt-1 max-w-sm text-xs">
              Catat banten utama, ayaban, atau sarana perlengkapan untuk prosesi
              ini agar serati banten atau keluarga dapat mempersiapkannya.
            </p>
            {canEdit && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (isPreview) {
                    triggerUpgrade();
                    return;
                  }
                  setIsModalOpen(true);
                }}
                className="mt-4 gap-1.5"
              >
                <Plus className="h-4 w-4" />
                <span>Tambah Banten Pertama</span>
              </Button>
            )}
          </div>
        ) : (
          <div className="dark:bg-card dark:border-border/80 overflow-hidden rounded-xl border border-[#e5e5e9] bg-white shadow-xs">
            <div className="table-responsive-wrapper table-metronic-wrapper dark:border-border/80 dark:bg-card rounded-none border-b border-[#e9e9ed] bg-white">
              <table
                role="table"
                className="table-responsive table-metronic w-full border-collapse text-left text-xs"
                aria-label="Daftar Kebutuhan Banten Upacara"
              >
                <colgroup>
                  {["43%", "16%", "12%", "17%", "12%"].map((width, index) => (
                    <col key={index} style={{ width }} />
                  ))}
                </colgroup>
                <thead>
                  <tr className="dark:bg-muted/40 dark:text-muted-foreground border-b border-[#e9e9ed] bg-[#f9f9fb] text-xs font-semibold text-[#65656f]">
                    <th
                      scope="col"
                      className="dark:border-border/80 border-r border-b border-[#e9e9ed] px-4 py-3 font-semibold"
                    >
                      Banten & Kategori
                    </th>
                    <th
                      scope="col"
                      className="dark:border-border/80 border-r border-b border-[#e9e9ed] px-4 py-3 font-semibold"
                    >
                      Pengadaan & Jumlah
                    </th>
                    <th
                      scope="col"
                      className="dark:border-border/80 border-r border-b border-[#e9e9ed] px-4 py-3 font-semibold"
                    >
                      Status Kesiapan
                    </th>
                    <th
                      scope="col"
                      className="dark:border-border/80 border-r border-b border-[#e9e9ed] px-4 py-3 font-semibold"
                    >
                      PIC
                    </th>
                    <th
                      scope="col"
                      className="dark:border-border/80 border-b border-[#e9e9ed] px-4 py-3 text-right font-semibold"
                    >
                      Estimasi Biaya
                    </th>
                  </tr>
                </thead>
                <tbody className="dark:divide-border/80 divide-y divide-[#e9e9ed]">
                  {items.map((b, idx) => (
                    <tr
                      key={b.id || idx}
                      className="dark:hover:bg-muted/20 transition-colors hover:bg-[#fbfbfd]"
                    >
                      <td
                        data-label="Banten &amp; Kategori"
                        className="dark:border-border/80 border-r border-b border-[#e9e9ed] px-4 py-3.5 align-middle"
                      >
                        <div className="dark:text-foreground text-sm font-semibold text-[#18181b]">
                          {b.name}
                        </div>
                        {b.notes && (
                          <p className="dark:text-muted-foreground mt-0.5 text-xs text-[#71717a]">
                            {b.notes}
                          </p>
                        )}
                        <div className="dark:text-muted-foreground mt-0.5 text-[11px] text-[#71717a] capitalize">
                          Kategori: {b.category || "Umum"}
                        </div>
                      </td>

                      <td
                        data-label="Pengadaan &amp; Jumlah"
                        className="dark:border-border/80 border-r border-b border-[#e9e9ed] px-4 py-3.5 align-middle"
                      >
                        <div className="flex flex-col items-start gap-1">
                          <span className="text-primary text-xs font-semibold">
                            {getSourcingLabel(b.sourcingMethod)}
                          </span>
                          <span className="dark:text-muted-foreground text-[11px] text-[#71717a]">
                            {b.quantity} {b.unit}
                          </span>
                        </div>
                      </td>

                      <td
                        data-label="Status Kesiapan"
                        className="dark:border-border/80 border-r border-b border-[#e9e9ed] px-4 py-3.5 align-middle"
                      >
                        <Button
                          variant="ghost"
                          size={null}
                          type="button"
                          onClick={() => handleToggleStatus(b)}
                          disabled={!canEdit}
                          title={
                            canEdit
                              ? "Klik untuk mengubah status banten"
                              : undefined
                          }
                        >
                          {getStatusBadge(b.status)}
                        </Button>
                      </td>

                      <td
                        data-label="PIC"
                        className="dark:border-border/80 border-r border-b border-[#e9e9ed] px-4 py-3.5 align-middle text-xs"
                      >
                        {b.assigneeName ? (
                          <span className="dark:text-foreground font-semibold text-[#18181b]">
                            {b.assigneeName}
                          </span>
                        ) : (
                          <span className="dark:text-muted-foreground text-[#71717a] italic">
                            Belum ditugaskan
                          </span>
                        )}
                      </td>

                      <td
                        data-label="Estimasi Biaya"
                        className="dark:border-border/80 dark:text-foreground border-b border-[#e9e9ed] px-4 py-3.5 text-right align-middle text-sm font-semibold text-[#18181b] tabular-nums"
                      >
                        {b.estimatedPrice > 0
                          ? formatRupiah(b.estimatedPrice)
                          : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Table Footer */}
            <div className="dark:border-border/60 dark:text-muted-foreground flex items-center justify-between border-t border-[#f0f0f4] px-4 py-3.5 text-xs text-[#71717a] sm:px-6">
              <span>
                Menampilkan{" "}
                <strong className="dark:text-foreground font-semibold text-[#18181b]">
                  {items.length}
                </strong>{" "}
                kebutuhan banten upacara
              </span>
            </div>
          </div>
        )}
      </CardContent>

      {/* Add Banten Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="border-border bg-card w-full max-w-lg rounded-2xl border p-6 shadow-xl">
            <div className="flex items-center justify-between pb-3">
              <h3 className="text-foreground text-lg font-bold">
                Tambah Kebutuhan Banten
              </h3>
              <Button
                variant="ghost"
                size={null}
                type="button"
                onClick={() => setIsModalOpen(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            {errorMsg && (
              <div className="bg-destructive/10 text-destructive mb-4 rounded-lg p-3 text-xs">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleAddItem} className="space-y-4">
              <FieldGroup className="gap-4">
                <Field>
                  <FieldLabel htmlFor="bantenName">
                    Nama Banten / Sarana *
                  </FieldLabel>
                  <Input
                    id="bantenName"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Contoh: Banten Byakala Utama"
                    required
                  />
                </Field>

                <div className="grid grid-cols-2 gap-3">
                  <Field>
                    <FieldLabel htmlFor="category">
                      Tingkatan / Kategori
                    </FieldLabel>
                    <NativeSelect
                      id="category"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="border-input bg-background h-10 w-full rounded-md border px-3 text-sm"
                    >
                      <option value="utama">Utama</option>
                      <option value="madya">Madya</option>
                      <option value="nista">Nista</option>
                      <option value="sarana_pelengkap">Sarana Pelengkap</option>
                    </NativeSelect>
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="sourcing">Metode Pengadaan</FieldLabel>
                    <NativeSelect
                      id="sourcing"
                      value={sourcingMethod}
                      onChange={(e) =>
                        setSourcingMethod(
                          e.target.value as CeremonyRitualItem["sourcingMethod"]
                        )
                      }
                      className="border-input bg-background h-10 w-full rounded-md border px-3 text-sm"
                    >
                      <option value="purchased_package">
                        Beli Paket Serati
                      </option>
                      <option value="self_made">Buat Sendiri (Ngayah)</option>
                      <option value="family_assigned">Tugas Keluarga</option>
                      <option value="vendor_order">Pesan Vendor</option>
                    </NativeSelect>
                  </Field>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Field>
                    <FieldLabel htmlFor="quantity">Jumlah</FieldLabel>
                    <Input
                      id="quantity"
                      type="number"
                      min="1"
                      value={quantity}
                      onChange={(e) => setQuantity(Number(e.target.value))}
                      required
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="unit">Satuan</FieldLabel>
                    <Input
                      id="unit"
                      value={unit}
                      onChange={(e) => setUnit(e.target.value)}
                      placeholder="Contoh: Paket, Tanding, Pasang"
                      required
                    />
                  </Field>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Field>
                    <FieldLabel htmlFor="assignee">
                      Penanggung Jawab / Serati
                    </FieldLabel>
                    <Input
                      id="assignee"
                      value={assigneeName}
                      onChange={(e) => setAssigneeName(e.target.value)}
                      placeholder="Contoh: Serati Sanur / Ibu Purusa"
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="price">Estimasi Biaya (Rp)</FieldLabel>
                    <Input
                      id="price"
                      type="number"
                      min="0"
                      step="10000"
                      value={estimatedPrice}
                      onChange={(e) =>
                        setEstimatedPrice(Number(e.target.value))
                      }
                      placeholder="0"
                    />
                  </Field>
                </div>

                <Field>
                  <FieldLabel htmlFor="notes">
                    Catatan Komponen Banten
                  </FieldLabel>
                  <Textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Kelengkapan ayam brumbun, danyah, banten pejati..."
                    rows={2}
                  />
                </Field>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsModalOpen(false)}
                    disabled={loading}
                  >
                    Batal
                  </Button>
                  <Button type="submit" disabled={loading}>
                    {loading ? "Menyimpan..." : "Tambahkan Banten"}
                  </Button>
                </div>
              </FieldGroup>
            </form>
          </div>
        </div>
      )}
    </Card>
  );
}
