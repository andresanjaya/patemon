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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="bg-background border-border relative max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-xl border p-6 shadow-2xl">
        <div className="mb-6 flex items-center justify-between border-b pb-4">
          <div className="flex items-center gap-2">
            <Users className="text-primary h-5 w-5" />
            <h2 className="text-foreground text-lg font-bold">
              {guestToEdit
                ? "Edit Data Undangan"
                : "Tambah Tamu / Undangan Baru"}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground rounded-md p-1 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="bg-destructive/10 border-destructive/30 text-destructive mb-4 rounded-md border p-3 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="guest-name">
                Nama Tamu / Kepala Keluarga{" "}
                <span className="text-destructive">*</span>
              </Label>
              <Input
                id="guest-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Contoh: Jero Mangku Wayan Sudarma & Keluarga"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="guest-side">Pihak Mempelai</Label>
              <select
                id="guest-side"
                value={side}
                onChange={(e) => setSide(e.target.value as GuestSide)}
                className="border-input bg-background text-foreground focus-visible:ring-ring flex h-9 w-full rounded-md border px-3 py-1 text-sm shadow-xs focus-visible:ring-1 focus-visible:outline-hidden"
              >
                {GUEST_SIDES.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="guest-status">Status Undangan</Label>
              <select
                id="guest-status"
                value={invitationStatus}
                onChange={(e) =>
                  setInvitationStatus(e.target.value as InvitationStatus)
                }
                className="border-input bg-background text-foreground focus-visible:ring-ring flex h-9 w-full rounded-md border px-3 py-1 text-sm shadow-xs focus-visible:ring-1 focus-visible:outline-hidden"
              >
                {Object.entries(INVITATION_STATUS_CONFIG).map(([k, cfg]) => (
                  <option key={k} value={k}>
                    {cfg.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="guest-group">Kelompok / Dadia / Banjar</Label>
              <div className="relative">
                <input
                  list="group-options"
                  id="guest-group"
                  value={groupHousehold}
                  onChange={(e) => setGroupHousehold(e.target.value)}
                  placeholder="Pilih atau ketik kelompok..."
                  className="border-input bg-background text-foreground focus-visible:ring-ring flex h-9 w-full rounded-md border px-3 py-1 text-sm shadow-xs focus-visible:ring-1 focus-visible:outline-hidden"
                />
                <datalist id="group-options">
                  {CANONICAL_GUEST_GROUPS.map((grp) => (
                    <option key={grp} value={grp} />
                  ))}
                </datalist>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="guest-headcount">Perkiraan Pax / Rombongan</Label>
              <Input
                id="guest-headcount"
                type="number"
                min="1"
                max="500"
                value={headcount}
                onChange={(e) => setHeadcount(Number(e.target.value) || 1)}
                placeholder="2"
                required
              />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="guest-phone">Nomor WhatsApp / HP</Label>
              <Input
                id="guest-phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Contoh: 081234567890"
              />
              <p className="text-muted-foreground text-xs">
                Digunakan untuk mengirim undangan digital cepat via WhatsApp.
              </p>
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="guest-notes">Catatan Tambahan</Label>
              <Textarea
                id="guest-notes"
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Contoh: Sesepuh dadia mohon tempatkan dekat pelaminan, membawa 2 anak kecil, perlu penjemputan bandara, dll..."
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 border-t pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isPending}
            >
              Batal
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  {guestToEdit ? "Simpan Perubahan" : "Tambah Tamu"}
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
