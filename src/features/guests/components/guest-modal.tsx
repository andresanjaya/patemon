"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, X, Users, CheckCircle2 } from "lucide-react";
import { createGuestAction, updateGuestAction } from "../actions";
import {
  GUEST_SIDES,
  CANONICAL_GUEST_GROUPS,
  INVITATION_STATUS_CONFIG,
} from "../seeds";
import type { Guest, GuestSide, InvitationStatus } from "../types";

interface GuestModalProps {
  weddingId: string;
  isOpen: boolean;
  onClose: () => void;
  guestToEdit?: Guest | null;
  onSuccess: (guest: Guest, isEdit: boolean) => void;
}

export function GuestModal({
  weddingId,
  isOpen,
  onClose,
  guestToEdit,
  onSuccess,
}: GuestModalProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState(guestToEdit?.name || "");
  const [side, setSide] = useState<GuestSide>(guestToEdit?.side || "both");
  const [groupHousehold, setGroupHousehold] = useState(
    guestToEdit?.groupHousehold || CANONICAL_GUEST_GROUPS[0]
  );
  const [headcount, setHeadcount] = useState<number>(
    guestToEdit?.headcount || 2
  );
  const [invitationStatus, setInvitationStatus] = useState<InvitationStatus>(
    guestToEdit?.invitationStatus || "draft"
  );
  const [phone, setPhone] = useState(guestToEdit?.phone || "");
  const [notes, setNotes] = useState(guestToEdit?.notes || "");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Nama tamu atau kepala keluarga wajib diisi.");
      return;
    }

    const count = Math.max(1, Math.round(Number(headcount) || 1));
    setError(null);

    startTransition(async () => {
      if (guestToEdit) {
        const res = await updateGuestAction(weddingId, guestToEdit.id, {
          name: name.trim(),
          side,
          groupHousehold: groupHousehold.trim() || null,
          headcount: count,
          invitationStatus,
          phone: phone.trim() || null,
          notes: notes.trim() || null,
        });

        if (!res.success) {
          setError(res.error || "Gagal memperbarui data tamu.");
          return;
        }

        const updated: Guest = {
          ...guestToEdit,
          name: name.trim(),
          side,
          groupHousehold: groupHousehold.trim() || null,
          headcount: count,
          invitationStatus,
          phone: phone.trim() || null,
          notes: notes.trim() || null,
          updatedAt: new Date().toISOString(),
        };

        onSuccess(updated, true);
        onClose();
      } else {
        const res = await createGuestAction(weddingId, {
          name: name.trim(),
          side,
          groupHousehold: groupHousehold.trim() || undefined,
          headcount: count,
          invitationStatus,
          phone: phone.trim() || undefined,
          notes: notes.trim() || undefined,
        });

        if (!res.success || !res.guest) {
          setError(res.error || "Gagal menyimpan tamu baru.");
          return;
        }

        onSuccess(res.guest, false);
        onClose();
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 sm:p-6 backdrop-blur-xs">
      <div
        className="bg-card border-border/80 flex flex-col w-full max-w-4xl max-h-[90vh] rounded-2xl border shadow-2xl overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-labelledby="guest-modal-title"
      >
        {/* Metronic Header */}
        <div className="px-6 py-4 border-b border-[#f0f0f4] dark:border-border/60 flex items-center justify-between shrink-0 bg-white dark:bg-card">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <h3
                id="guest-modal-title"
                className="text-[#18181b] dark:text-foreground text-lg font-bold"
              >
                {guestToEdit ? "Edit Data Undangan" : "Tambah Tamu / Undangan Baru"}
              </h3>
              <p className="text-muted-foreground text-xs mt-0.5">
                Kelola rombongan tamu pawiwahan, pihak keluarga mempelai, dan estimasi pax konsumsi
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup"
            className="text-muted-foreground hover:text-foreground rounded-lg p-1.5 hover:bg-muted/50 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Body: 2-Panel Metronic Layout */}
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {error && (
              <div className="bg-destructive/10 border-destructive/30 text-destructive rounded-lg border p-3 text-xs">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Panel (~2/3): Guest Name, Phone, Notes */}
              <div className="lg:col-span-7 xl:col-span-8 space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="guest-name" className="text-xs font-semibold">
                    Nama Tamu / Kepala Keluarga <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="guest-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Contoh: Jero Mangku Wayan Sudarma & Keluarga"
                    className="h-9 text-xs"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="guest-phone" className="text-xs font-semibold">
                    Nomor WhatsApp / HP
                  </Label>
                  <Input
                    id="guest-phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Contoh: 081234567890"
                    className="h-9 text-xs"
                  />
                  <p className="text-muted-foreground text-[11px]">
                    Digunakan untuk pengiriman undangan digital cepat melalui WhatsApp.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="guest-notes" className="text-xs font-semibold">
                    Catatan Khusus Tamu
                  </Label>
                  <Textarea
                    id="guest-notes"
                    rows={4}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Contoh: Sesepuh dadia mohon tempatkan dekat pelaminan, membawa 2 anak kecil, perlu penjemputan bandara, dll..."
                    className="text-xs leading-relaxed"
                  />
                </div>
              </div>

              {/* Right Panel (~1/3): Side, Group, Headcount, Status */}
              <div className="lg:col-span-5 xl:col-span-4 space-y-4 lg:border-l lg:border-[#f0f0f4] dark:lg:border-border/60 lg:pl-6">
                <div className="space-y-1.5">
                  <Label htmlFor="guest-side" className="text-xs font-semibold">
                    Pihak Mempelai
                  </Label>
                  <select
                    id="guest-side"
                    value={side}
                    onChange={(e) => setSide(e.target.value as GuestSide)}
                    className="border-input bg-background text-foreground h-9 w-full rounded-md border px-2.5 text-xs"
                  >
                    {GUEST_SIDES.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="guest-group" className="text-xs font-semibold">
                    Kelompok / Dadia / Banjar
                  </Label>
                  <input
                    list="group-options"
                    id="guest-group"
                    value={groupHousehold}
                    onChange={(e) => setGroupHousehold(e.target.value)}
                    placeholder="Pilih atau ketik kelompok..."
                    className="border-input bg-background text-foreground h-9 w-full rounded-md border px-2.5 text-xs"
                  >
                  </input>
                  <datalist id="group-options">
                    {CANONICAL_GUEST_GROUPS.map((grp) => (
                      <option key={grp} value={grp} />
                    ))}
                  </datalist>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="guest-headcount" className="text-xs font-semibold">
                    Perkiraan Pax / Rombongan
                  </Label>
                  <Input
                    id="guest-headcount"
                    type="number"
                    min="1"
                    max="500"
                    value={headcount}
                    onChange={(e) => setHeadcount(Number(e.target.value) || 1)}
                    placeholder="2"
                    className="h-9 text-xs"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="guest-status" className="text-xs font-semibold">
                    Status Undangan
                  </Label>
                  <select
                    id="guest-status"
                    value={invitationStatus}
                    onChange={(e) =>
                      setInvitationStatus(e.target.value as InvitationStatus)
                    }
                    className="border-input bg-background text-foreground h-9 w-full rounded-md border px-2.5 text-xs"
                  >
                    {Object.entries(INVITATION_STATUS_CONFIG).map(([k, cfg]) => (
                      <option key={k} value={k}>
                        {cfg.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Catering Pax Helper Card */}
                <div className="rounded-xl border border-[#f0f0f4] dark:border-border/60 bg-[#f9f9fb] dark:bg-muted/20 p-3.5 space-y-2">
                  <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
                    Alokasi Konsumsi Pawiwahan
                  </span>
                  <p className="text-muted-foreground text-[11px] leading-relaxed">
                    Total pax rombongan langsung diakumulasikan ke ringkasan konsumsi untuk koordinasi porsi prasmanan adat & kotak besek ngayah.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Sticky Metronic Footer */}
          <div className="px-6 py-3.5 border-t border-[#f0f0f4] dark:border-border/60 flex items-center justify-between shrink-0 bg-[#fbfbfd] dark:bg-card">
            <span className="text-xs text-muted-foreground">
              {guestToEdit ? `ID: ${guestToEdit.id}` : "Tamu baru akan ditambahkan ke daftar undangan"}
            </span>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onClose}
                disabled={isPending}
                className="text-xs"
              >
                Batal
              </Button>
              <Button type="submit" size="sm" disabled={isPending} className="text-xs">
                {isPending ? (
                  <>
                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                    {guestToEdit ? "Simpan Perubahan" : "Tambah Tamu"}
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
