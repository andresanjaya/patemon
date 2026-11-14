"use client";

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
import { Label } from "@/components/ui/label";
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
  const canEdit = userRole === "owner" || userRole === "editor";

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
            onClick={() => setIsModalOpen(true)}
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
                onClick={() => setIsModalOpen(true)}
                className="mt-4 gap-1.5"
              >
                <Plus className="h-4 w-4" />
                <span>Tambah Banten Pertama</span>
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {items.map((b, idx) => (
              <div
                key={b.id || idx}
                className="border-border bg-card/60 hover:border-primary/40 flex flex-col justify-between rounded-xl border p-4 shadow-xs transition-colors"
              >
                <div className="space-y-1.5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="text-foreground text-sm font-semibold">
                        {b.name}
                      </h4>
                      <div className="text-muted-foreground mt-0.5 flex flex-wrap items-center gap-2 text-xs">
                        <span className="capitalize">
                          {b.category || "Umum"}
                        </span>
                        <span>·</span>
                        <span>
                          {b.quantity} {b.unit}
                        </span>
                        <span>·</span>
                        <span className="text-primary font-medium">
                          {getSourcingLabel(b.sourcingMethod)}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleToggleStatus(b)}
                      disabled={!canEdit}
                      className="cursor-pointer transition-opacity hover:opacity-80 disabled:cursor-default"
                      title={
                        canEdit
                          ? "Klik untuk mengubah status banten"
                          : undefined
                      }
                    >
                      {getStatusBadge(b.status)}
                    </button>
                  </div>

                  {b.notes && (
                    <p className="text-muted-foreground text-xs leading-relaxed">
                      {b.notes}
                    </p>
                  )}
                </div>

                <div className="border-border/50 text-muted-foreground mt-3 flex items-center justify-between border-t pt-2 text-[11px]">
                  <span>PIC: {b.assigneeName || "Belum ditugaskan"}</span>
                  {b.estimatedPrice > 0 && (
                    <span className="text-foreground font-semibold">
                      {formatRupiah(b.estimatedPrice)}
                    </span>
                  )}
                </div>
              </div>
            ))}
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
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="bg-destructive/10 text-destructive mb-4 rounded-lg p-3 text-xs">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleAddItem} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="bantenName">Nama Banten / Sarana *</Label>
                <Input
                  id="bantenName"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Contoh: Banten Byakala Utama"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="category">Tingkatan / Kategori</Label>
                  <select
                    id="category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="border-input bg-background h-10 w-full rounded-md border px-3 text-sm"
                  >
                    <option value="utama">Utama</option>
                    <option value="madya">Madya</option>
                    <option value="nista">Nista</option>
                    <option value="sarana_pelengkap">Sarana Pelengkap</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="sourcing">Metode Pengadaan</Label>
                  <select
                    id="sourcing"
                    value={sourcingMethod}
                    onChange={(e) =>
                      setSourcingMethod(
                        e.target.value as CeremonyRitualItem["sourcingMethod"]
                      )
                    }
                    className="border-input bg-background h-10 w-full rounded-md border px-3 text-sm"
                  >
                    <option value="purchased_package">Beli Paket Serati</option>
                    <option value="self_made">Buat Sendiri (Ngayah)</option>
                    <option value="family_assigned">Tugas Keluarga</option>
                    <option value="vendor_order">Pesan Vendor</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="quantity">Jumlah</Label>
                  <Input
                    id="quantity"
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="unit">Satuan</Label>
                  <Input
                    id="unit"
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    placeholder="Contoh: Paket, Tanding, Pasang"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="assignee">Penanggung Jawab / Serati</Label>
                  <Input
                    id="assignee"
                    value={assigneeName}
                    onChange={(e) => setAssigneeName(e.target.value)}
                    placeholder="Contoh: Serati Sanur / Ibu Purusa"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="price">Estimasi Biaya (Rp)</Label>
                  <Input
                    id="price"
                    type="number"
                    min="0"
                    step="10000"
                    value={estimatedPrice}
                    onChange={(e) => setEstimatedPrice(Number(e.target.value))}
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="notes">Catatan Komponen Banten</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Kelengkapan ayam brumbun, danyah, banten pejati..."
                  rows={2}
                />
              </div>

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
            </form>
          </div>
        </div>
      )}
    </Card>
  );
}
