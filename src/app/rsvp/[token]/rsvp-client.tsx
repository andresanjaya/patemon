"use client";

import { runAction, ActionAlert } from "@/components/ui/action-feedback";

import {
  FieldTitle,
  FieldLabel,
  FieldGroup,
  Field,
} from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";
import { useState, useTransition } from "react";
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  CheckCircle2,
  XCircle,
  Heart,
  Send,
  AlertTriangle,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type {
  PublicRsvpData,
  RsvpLookupResult,
} from "@/features/guests/rsvp-actions";
import { submitGuestRsvpAction } from "@/features/guests/rsvp-actions";

interface RsvpClientProps {
  initialResult: RsvpLookupResult;
  token: string;
}

function formatCeremonyDate(dateStr?: string | null): string {
  if (!dateStr) return "Hari & Tanggal akan diumumkan";
  try {
    const [y, m, d] = dateStr.split("-").map(Number);
    const date = new Date(Date.UTC(y, m - 1, d, 4, 0, 0));
    return new Intl.DateTimeFormat("id-ID", {
      timeZone: "Asia/Makassar",
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(date);
  } catch {
    return dateStr;
  }
}

export function RsvpClient({ initialResult, token }: RsvpClientProps) {
  if (!initialResult.success) {
    return <RsvpErrorView result={initialResult} />;
  }

  return <RsvpFormView initialData={initialResult.data} token={token} />;
}

function RsvpErrorView({
  result,
}: {
  result: Extract<RsvpLookupResult, { success: false }>;
}) {
  const isRevoked = result.state === "revoked";
  const isArchived = result.state === "archived";
  const isRateLimited = result.state === "rate_limited";

  return (
    <div className="flex min-h-screen items-center justify-center bg-stone-50 px-4 py-12 dark:bg-stone-950">
      <div className="border-border relative w-full max-w-md overflow-hidden rounded-3xl border bg-white p-8 text-center shadow-xl dark:bg-stone-900">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400">
          <AlertTriangle className="h-8 w-8" />
        </div>

        <h1 className="text-foreground text-xl font-bold tracking-tight">
          {isRevoked
            ? "Tautan Undangan Telah Dicabut"
            : isArchived
              ? "Konfirmasi Kehadiran Telah Ditutup"
              : isRateLimited
                ? "Batas Permintaan Tercapai"
                : "Tautan Tidak Ditemukan"}
        </h1>

        <p className="text-muted-foreground mt-3 text-sm leading-relaxed">
          {result.error}
        </p>

        <div className="mt-6 border-t border-stone-200/60 pt-6 dark:border-stone-800">
          <p className="text-muted-foreground text-xs">
            Silakan hubungi keluarga mempelai untuk memperoleh informasi atau
            tautan undangan terbaru.
          </p>
        </div>
      </div>
    </div>
  );
}

function RsvpFormView({
  initialData,
  token,
}: {
  initialData: PublicRsvpData;
  token: string;
}) {
  const [data, setData] = useState<PublicRsvpData>(initialData);
  const [attending, setAttending] = useState<boolean>(
    initialData.invitationStatus === "declined" ? false : true
  );
  const [attendingCount, setAttendingCount] = useState<number>(
    initialData.rsvpAttendingCount ?? initialData.maxHeadcount
  );
  const [notes, setNotes] = useState<string>(initialData.rsvpNotes || "");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const formattedDate = formatCeremonyDate(data.wedding.prospectiveDate);
  const isPreviouslyConfirmed =
    data.invitationStatus === "confirmed" && data.rsvpSubmittedAt;
  const isPreviouslyDeclined =
    data.invitationStatus === "declined" && data.rsvpSubmittedAt;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessBanner(null);

    const targetStatus = attending ? "confirmed" : "declined";
    const targetCount = attending ? attendingCount : 0;

    if (attending) {
      if (targetCount < 1) {
        setErrorMessage("Jumlah kehadiran minimal 1 orang.");
        return;
      }
      if (targetCount > data.maxHeadcount) {
        setErrorMessage(
          `Jumlah kehadiran tidak boleh melebihi kuota undangan (${data.maxHeadcount} orang).`
        );
        return;
      }
    }

    startTransition(async () => {
      const res = await runAction(
        () =>
          submitGuestRsvpAction({
            token,
            status: targetStatus,
            attendingCount: targetCount,
            notes: notes.trim(),
          }),
        false,
        setErrorMessage
      );

      if (res.success) {
        setSuccessBanner(res.message);
        setData((prev) => ({
          ...prev,
          invitationStatus: res.data.invitationStatus,
          rsvpAttendingCount: res.data.attendingCount,
          rsvpNotes: res.data.rsvpNotes,
          rsvpSubmittedAt: res.data.rsvpSubmittedAt,
        }));
      } else {
        setErrorMessage(res.error || "Gagal menyimpan konfirmasi kehadiran.");
      }
    });
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-stone-50 px-4 py-8 sm:py-12 dark:bg-stone-950">
      <div className="border-border relative w-full max-w-lg overflow-hidden rounded-3xl border bg-white shadow-2xl dark:bg-stone-900">
        {/* Decorative Top Accent Banner */}
        <div className="relative h-28 bg-gradient-to-r from-emerald-900 via-stone-900 to-amber-900 p-6 text-center text-white sm:h-32">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-500/20 via-transparent to-black/50" />
          <div className="relative z-10 flex flex-col items-center justify-center">
            <span className="font-serif text-xs font-semibold tracking-widest text-amber-300 uppercase">
              Pawiwahan Hindu Bali
            </span>
            <div className="mt-1 flex items-center gap-1.5 text-xs text-stone-200">
              <Sparkles className="h-3 w-3 text-amber-400" />
              <span>Om Swastyastu</span>
              <Sparkles className="h-3 w-3 text-amber-400" />
            </div>
          </div>
        </div>

        <div className="p-6 sm:p-8">
          {/* Couple Header */}
          <div className="text-center">
            <h1 className="text-foreground font-serif text-2xl font-bold tracking-tight sm:text-3xl">
              {data.wedding.coupleNames}
            </h1>

            <p className="text-muted-foreground mt-2 text-xs leading-relaxed">
              Atas Asung Kertha Wara Nugraha Ida Sang Hyang Widhi Wasa, kami
              bermaksud mengundang Bapak/Ibu/Saudara/i untuk menghadiri dan
              memberikan doa restu.
            </p>
          </div>

          {/* Ceremony Meta Cards */}
          <div className="border-border mt-6 grid grid-cols-1 gap-2.5 rounded-2xl border bg-stone-100/70 p-4 text-xs sm:grid-cols-2 dark:bg-stone-800/40">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <Calendar className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-muted-foreground text-[10px] font-semibold uppercase">
                  Hari & Tanggal
                </p>
                <p className="text-foreground truncate font-medium">
                  {formattedDate}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <Clock className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-muted-foreground text-[10px] font-semibold uppercase">
                  Waktu Upacara
                </p>
                <p className="text-foreground font-medium">10:00 WITA</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 sm:col-span-2">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400">
                <MapPin className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-muted-foreground text-[10px] font-semibold uppercase">
                  Lokasi Acara
                </p>
                <p className="text-foreground truncate font-medium">
                  {data.wedding.ceremonyLocation || "Bali"}
                </p>
              </div>
            </div>
          </div>

          {/* Guest Greeting & Quota Banner */}
          <div className="border-border mt-6 rounded-2xl border bg-stone-50 p-4 dark:bg-stone-800/20">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-muted-foreground text-xs">
                  Kepada Yth. Bapak/Ibu/Saudara/i:
                </p>
                <h2 className="text-foreground mt-0.5 text-base font-bold">
                  {data.guestName}
                </h2>
              </div>
              <Badge
                variant="outline"
                className="gap-1 border-stone-300 text-xs"
              >
                <Users className="h-3 w-3" />
                <span>Kuota: {data.maxHeadcount} Orang</span>
              </Badge>
            </div>

            {/* Current RSVP state notification */}
            {isPreviouslyConfirmed && (
              <div className="mt-3 flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-50/80 p-2.5 text-xs text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>
                  Telah konfirmasi:{" "}
                  <strong>Hadir ({data.rsvpAttendingCount} Pax)</strong>
                </span>
              </div>
            )}

            {isPreviouslyDeclined && (
              <div className="mt-3 flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-50/80 p-2.5 text-xs text-rose-800 dark:bg-rose-950/30 dark:text-rose-300">
                <XCircle className="h-4 w-4 shrink-0" />
                <span>
                  Telah konfirmasi: <strong>Berhalangan Hadir</strong>
                </span>
              </div>
            )}
          </div>

          {/* Success Banner */}
          {successBanner && (
            <ActionAlert variant="success" message={successBanner} />
          )}

          {/* Error Banner */}
          {errorMessage && (
            <ActionAlert variant="destructive" message={errorMessage} />
          )}

          {/* RSVP Form */}
          {data.isExpired ? (
            <div className="mt-6 rounded-2xl border border-amber-500/30 bg-amber-50/60 p-4 text-center text-xs text-amber-900 dark:bg-amber-950/20 dark:text-amber-200">
              <p className="font-semibold">
                Batas waktu konfirmasi telah berakhir.
              </p>
              <p className="mt-1 text-stone-600 dark:text-stone-400">
                Konfirmasi yang telah tercatat sebelumnya tetap tersimpan di
                daftar panitia.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-6 space-y-5">
              <FieldGroup className="gap-4">
                <Field>
                  <FieldTitle className="text-foreground font-semibold tracking-wider uppercase">
                    Konfirmasi Kehadiran
                  </FieldTitle>

                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      variant="outline"
                      size={null}
                      type="button"
                      onClick={() => setAttending(true)}
                      className={`flex items-center justify-center gap-2 rounded-xl border p-3.5 text-xs font-semibold transition-all ${
                        attending
                          ? "border-emerald-600 bg-emerald-50 text-emerald-800 shadow-xs dark:bg-emerald-950/40 dark:text-emerald-200"
                          : "border-border hover:bg-muted text-muted-foreground"
                      }`}
                    >
                      <CheckCircle2
                        className={`h-4 w-4 ${attending ? "text-emerald-600" : ""}`}
                      />
                      <span>Hadir</span>
                    </Button>

                    <Button
                      variant="outline"
                      size={null}
                      type="button"
                      onClick={() => setAttending(false)}
                      className={`flex items-center justify-center gap-2 rounded-xl border p-3.5 text-xs font-semibold transition-all ${
                        !attending
                          ? "border-rose-600 bg-rose-50 text-rose-800 shadow-xs dark:bg-rose-950/40 dark:text-rose-200"
                          : "border-border hover:bg-muted text-muted-foreground"
                      }`}
                    >
                      <XCircle
                        className={`h-4 w-4 ${!attending ? "text-rose-600" : ""}`}
                      />
                      <span>Berhalangan</span>
                    </Button>
                  </div>
                </Field>

                {/* Headcount Attending Counter (if Attending) */}
                {attending && (
                  <div className="border-border space-y-2 rounded-2xl border bg-stone-50 p-4 dark:bg-stone-800/30">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-foreground text-xs font-semibold">
                          Jumlah Rombongan yang Hadir
                        </span>
                        <p className="text-muted-foreground text-[11px]">
                          Maksimal {data.maxHeadcount} orang sesuai kuota
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="h-8 w-8 rounded-lg"
                          disabled={attendingCount <= 1}
                          onClick={() =>
                            setAttendingCount((c) => Math.max(1, c - 1))
                          }
                        >
                          -
                        </Button>
                        <span className="w-8 text-center text-sm font-bold">
                          {attendingCount}
                        </span>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="h-8 w-8 rounded-lg"
                          disabled={attendingCount >= data.maxHeadcount}
                          onClick={() =>
                            setAttendingCount((c) =>
                              Math.min(data.maxHeadcount, c + 1)
                            )
                          }
                        >
                          +
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Optional Wishes / Prayers */}
                <Field>
                  <div className="flex items-center justify-between">
                    <FieldLabel
                      htmlFor="rsvp-message"
                      className="text-foreground font-semibold tracking-wider uppercase"
                    >
                      Ucapan & Doa Restu (Opsional)
                    </FieldLabel>
                    <span className="text-muted-foreground text-[10px]">
                      {notes.length}/500
                    </span>
                  </div>
                  <Textarea
                    id="rsvp-message"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value.slice(0, 500))}
                    placeholder="Tuliskan ucapan selamat atau doa restu untuk kedua mempelai..."
                    rows={3}
                    className="bg-background border-border text-foreground placeholder:text-muted-foreground w-full rounded-xl border p-3 leading-relaxed focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </Field>

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={isPending}
                  className="w-full gap-2 rounded-xl py-3 text-xs font-bold shadow-md"
                >
                  {isPending ? (
                    <>
                      <RotateCcw className="h-4 w-4 animate-spin" />
                      <span>Menyimpan Konfirmasi...</span>
                    </>
                  ) : (
                    <>
                      {data.rsvpSubmittedAt ? (
                        <>
                          <Send className="h-4 w-4" />
                          <span>Perbarui Konfirmasi Kehadiran</span>
                        </>
                      ) : (
                        <>
                          <Heart className="h-4 w-4" />
                          <span>Kirim Konfirmasi Kehadiran</span>
                        </>
                      )}
                    </>
                  )}
                </Button>
              </FieldGroup>
            </form>
          )}

          {/* Footer Note */}
          <div className="mt-8 border-t border-stone-200/60 pt-6 text-center dark:border-stone-800">
            <p className="text-muted-foreground text-xs italic">
              Suksma atas doa restu Bapak/Ibu/Saudara/i.
            </p>
            <p className="text-muted-foreground mt-1 text-[11px] font-medium">
              Om Shanti, Shanti, Shanti, Om
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
