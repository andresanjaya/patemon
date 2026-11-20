"use client";

import { FieldTitle } from "@/components/ui/field";
import { useState, useTransition } from "react";
import {
  MessageSquare,
  Copy,
  Check,
  ExternalLink,
  AlertCircle,
  X,
  Send,
  UserCheck,
  Link2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Guest, InvitationStatus } from "../types";
import {
  generateWhatsAppInviteMessage,
  generateWhatsAppUrl,
  type WeddingInviteContext,
} from "../whatsapp";
import { updateInvitationStatusAction } from "../actions";

interface GuestWhatsAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  guest: Guest | null;
  weddingId: string;
  context: WeddingInviteContext;
  onStatusUpdated?: (guestId: string, newStatus: InvitationStatus) => void;
}

export function GuestWhatsAppModal({
  isOpen,
  onClose,
  guest,
  weddingId,
  context,
  onStatusUpdated,
}: GuestWhatsAppModalProps) {
  const [copied, setCopied] = useState(false);
  const [copiedRsvp, setCopiedRsvp] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (!isOpen || !guest) return null;

  const rsvpUrl = guest.rsvpToken
    ? `${typeof window !== "undefined" ? window.location.origin : "https://patemon.vercel.app"}/rsvp/${guest.rsvpToken}`
    : context.invitationUrl || null;

  const resolvedContext: WeddingInviteContext = {
    ...context,
    invitationUrl: rsvpUrl,
  };

  const message = generateWhatsAppInviteMessage(guest, resolvedContext);
  const whatsappUrl = generateWhatsAppUrl(guest.phone, message);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  const handleCopyRsvp = async () => {
    if (!rsvpUrl) return;
    try {
      await navigator.clipboard.writeText(rsvpUrl);
      setCopiedRsvp(true);
      setTimeout(() => setCopiedRsvp(false), 2000);
    } catch {
      // Fallback
    }
  };

  const handleOpenWhatsApp = () => {
    if (whatsappUrl) {
      window.open(whatsappUrl, "_blank", "noopener,noreferrer");
    }
  };

  const handleUpdateStatus = (newStatus: InvitationStatus) => {
    setStatusMessage(null);
    startTransition(async () => {
      const res = await updateInvitationStatusAction(
        weddingId,
        guest.id,
        newStatus
      );
      if (res.success) {
        setStatusMessage(
          newStatus === "sent"
            ? "Status undangan berhasil ditandai Terkirim."
            : `Status undangan diperbarui menjadi: ${newStatus}.`
        );
        if (onStatusUpdated) {
          onStatusUpdated(guest.id, newStatus);
        }
      } else {
        setStatusMessage(res.error || "Gagal memperbarui status.");
      }
    });
  };

  return (
    <div className="animate-in fade-in fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="bg-background border-border relative flex max-h-[90vh] w-full max-w-xl flex-col rounded-2xl border shadow-2xl">
        {/* Header */}
        <div className="border-border flex items-center justify-between border-b px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600">
              <MessageSquare className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-foreground text-lg font-bold">
                Undangan WhatsApp
              </h2>
              <p className="text-muted-foreground text-xs">
                Pesan personal bernuansa adat Bali untuk {guest.name}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8 rounded-full"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Body Content */}
        <div className="flex-1 space-y-4 overflow-y-auto p-6">
          {/* Guest Meta Pill */}
          <div className="bg-muted/30 border-border flex flex-wrap items-center justify-between gap-2 rounded-xl border p-3 text-xs">
            <div className="space-y-0.5">
              <span className="text-foreground font-semibold">
                {guest.name}
              </span>
              <div className="text-muted-foreground flex items-center gap-2 text-[11px]">
                <span>{guest.headcount} Orang</span>
                <span>•</span>
                <span>{guest.phone || "Nomor HP belum diisi"}</span>
              </div>
            </div>
            <Badge
              variant={
                guest.invitationStatus === "sent"
                  ? "default"
                  : guest.invitationStatus === "confirmed"
                    ? "secondary"
                    : "outline"
              }
              className="text-[11px]"
            >
              Status:{" "}
              {guest.invitationStatus === "sent"
                ? "Terkirim"
                : guest.invitationStatus}
            </Badge>
          </div>

          {!guest.phone && (
            <div className="flex items-start gap-2.5 rounded-lg border border-amber-500/30 bg-amber-50/70 p-3 text-xs text-amber-900 dark:bg-amber-950/20 dark:text-amber-200">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <div>
                <span className="font-semibold">
                  Nomor telepon belum tersedia:
                </span>{" "}
                Anda tetap dapat menyalin teks pesan di bawah ini untuk
                dikirimkan melalui grup keluarga atau aplikasi lain.
              </div>
            </div>
          )}

          {statusMessage && (
            <div className="flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-50 p-3 text-xs text-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-300">
              <Check className="h-4 w-4 shrink-0" />
              <span>{statusMessage}</span>
            </div>
          )}

          {/* Tautan Konfirmasi RSVP Pribadi */}
          {rsvpUrl && (
            <div className="bg-primary/5 border-primary/20 flex items-center justify-between gap-3 rounded-xl border p-3 text-xs">
              <div className="min-w-0 flex-1">
                <div className="text-foreground flex items-center gap-1.5 font-semibold">
                  <Link2 className="text-primary h-3.5 w-3.5" />
                  <span>Tautan RSVP Pribadi</span>
                </div>
                <div className="text-muted-foreground truncate font-mono text-[11px]">
                  {rsvpUrl}
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleCopyRsvp}
                className="h-7 shrink-0 gap-1.5 text-xs"
              >
                {copiedRsvp ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-600" />
                    Tersalin!
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    Salin Link
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Message Preview Box */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <FieldTitle className="text-foreground font-semibold tracking-wider uppercase">
                Pratinjau Pesan Personal
              </FieldTitle>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleCopy}
                className="h-7 gap-1.5 text-xs"
              >
                {copied ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-600" />
                    Tersalin!
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    Salin Teks
                  </>
                )}
              </Button>
            </div>

            <div className="bg-muted/40 border-border text-foreground/90 max-h-60 overflow-y-auto rounded-xl border p-4 font-sans text-xs leading-relaxed whitespace-pre-wrap">
              {message}
            </div>
          </div>

          {/* Confirmation Controls Notice */}
          <p className="text-muted-foreground text-[11px] leading-relaxed">
            💡 <strong>Kontrol Manual:</strong> Membuka WhatsApp tidak otomatis
            mengubah status undangan menjadi terkirim. Anda dapat mengonfirmasi
            status pengiriman secara mandiri di bawah ini.
          </p>
        </div>

        {/* Footer Actions */}
        <div className="border-border flex flex-wrap items-center justify-between gap-3 border-t px-6 py-4">
          {/* Quick status change toggles */}
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isPending || guest.invitationStatus === "sent"}
              onClick={() => handleUpdateStatus("sent")}
              className="gap-1.5 text-xs"
            >
              <Send className="text-primary h-3.5 w-3.5" />
              Tandai Terkirim
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={isPending || guest.invitationStatus === "confirmed"}
              onClick={() => handleUpdateStatus("confirmed")}
              className="gap-1.5 text-xs"
            >
              <UserCheck className="h-3.5 w-3.5 text-emerald-600" />
              Hadir
            </Button>
          </div>

          {/* Main Action: Send to WhatsApp */}
          <Button
            type="button"
            size="sm"
            onClick={handleOpenWhatsApp}
            disabled={!whatsappUrl}
            className="gap-2 text-xs font-semibold"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Kirim via WhatsApp
          </Button>
        </div>
      </div>
    </div>
  );
}
