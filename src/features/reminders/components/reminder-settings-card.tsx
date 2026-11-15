"use client";

import { useActionState, useState, useTransition } from "react";
import {
  Bell,
  Clock,
  Mail,
  Send,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  RefreshCw,
} from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type {
  ReminderDispatchLog,
  ReminderPreferences,
  ReminderTier,
} from "../types";
import {
  updateReminderPreferencesAction,
  triggerManualReminderDispatchAction,
  type ReminderActionResult,
} from "../actions";

interface ReminderSettingsCardProps {
  weddingId: string;
  preferences: ReminderPreferences;
  initialLogs: ReminderDispatchLog[];
  canEdit: boolean;
}

export function ReminderSettingsCard({
  weddingId,
  preferences,
  initialLogs,
  canEdit,
}: ReminderSettingsCardProps) {
  const updateActionWithId = updateReminderPreferencesAction.bind(
    null,
    weddingId
  );
  const [formState, formAction, isSaving] = useActionState<
    ReminderActionResult | null,
    FormData
  >(updateActionWithId, null);

  const [isTriggering, startTriggerTransition] = useTransition();
  const [triggerMessage, setTriggerMessage] = useState<string | null>(null);
  const [triggerSuccess, setTriggerSuccess] = useState<boolean | null>(null);

  const [masterEnabled, setMasterEnabled] = useState(
    preferences.emailNotificationsEnabled
  );
  const [taskEnabled, setTaskEnabled] = useState(
    preferences.taskRemindersEnabled
  );
  const [paymentEnabled, setPaymentEnabled] = useState(
    preferences.paymentRemindersEnabled
  );
  const [selectedTiers, setSelectedTiers] = useState<ReminderTier[]>(
    preferences.reminderTiers
  );

  const toggleTier = (tier: ReminderTier) => {
    setSelectedTiers((prev) =>
      prev.includes(tier) ? prev.filter((t) => t !== tier) : [...prev, tier]
    );
  };

  const handleManualTrigger = () => {
    setTriggerMessage(null);
    startTriggerTransition(async () => {
      const res = await triggerManualReminderDispatchAction(weddingId);
      setTriggerSuccess(res.success);
      setTriggerMessage(res.message);
    });
  };

  return (
    <Card className="border-border/80 shadow-sm">
      <CardHeader>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2 text-xl font-bold">
              <Mail className="text-primary h-5 w-5" />
              Pengingat & Notifikasi Email (WITA)
            </CardTitle>
            <CardDescription className="text-xs">
              Kirimkan pengingat otomatis tenggat tugas PIC dan jatuh tempo
              pembayaran ke email dengan perhitungan kalender zona Asia/Makassar
              (WITA).
            </CardDescription>
          </div>
          <Badge
            variant={masterEnabled ? "default" : "secondary"}
            className="w-fit text-xs font-medium"
          >
            {masterEnabled ? "Notifikasi Aktif" : "Opt-out / Nonaktif"}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {formState?.message && (
          <div
            className={`flex items-center gap-2 rounded-lg border p-3 text-sm ${
              formState.success
                ? "border-emerald-500/20 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-300"
                : "border-destructive/20 bg-destructive/10 text-destructive"
            }`}
          >
            {formState.success ? (
              <CheckCircle2 className="h-4 w-4 shrink-0" />
            ) : (
              <AlertCircle className="h-4 w-4 shrink-0" />
            )}
            <span>{formState.message}</span>
          </div>
        )}

        {triggerMessage && (
          <div
            className={`flex items-center gap-2 rounded-lg border p-3 text-sm ${
              triggerSuccess
                ? "border-emerald-500/20 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-300"
                : "border-destructive/20 bg-destructive/10 text-destructive"
            }`}
          >
            {triggerSuccess ? (
              <CheckCircle2 className="h-4 w-4 shrink-0" />
            ) : (
              <AlertCircle className="h-4 w-4 shrink-0" />
            )}
            <span>{triggerMessage}</span>
          </div>
        )}

        {/* Preferences Form */}
        <form action={formAction} className="space-y-6">
          {/* Master Switch */}
          <div className="bg-muted/40 flex items-center justify-between rounded-xl border p-4">
            <div className="space-y-0.5">
              <label
                htmlFor="emailNotificationsEnabled"
                className="cursor-pointer text-sm font-semibold"
              >
                Aktifkan Semua Pengingat Email
              </label>
              <p className="text-muted-foreground text-xs">
                Master switch pengingat. Bila dinonaktifkan, tidak ada email
                pengingat yang akan dikirim.
              </p>
            </div>
            <input
              type="checkbox"
              id="emailNotificationsEnabled"
              name="emailNotificationsEnabled"
              checked={masterEnabled}
              onChange={(e) => setMasterEnabled(e.target.checked)}
              disabled={!canEdit || isSaving}
              className="accent-primary h-5 w-5 cursor-pointer rounded"
            />
          </div>

          {/* Granular Options */}
          <div
            className={`space-y-4 ${!masterEnabled ? "pointer-events-none opacity-50" : ""}`}
          >
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {/* Task Reminders */}
              <div className="bg-card flex items-start justify-between rounded-lg border p-4 shadow-xs">
                <div className="space-y-1 pr-3">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Bell className="text-primary h-4 w-4" />
                    Pengingat Tugas PIC
                  </div>
                  <p className="text-muted-foreground text-xs leading-relaxed">
                    Kirim pengingat ke anggota tim terdaftar yang bertindak
                    sebagai PIC tugas.
                  </p>
                </div>
                <input
                  type="checkbox"
                  id="taskRemindersEnabled"
                  name="taskRemindersEnabled"
                  checked={taskEnabled}
                  onChange={(e) => setTaskEnabled(e.target.checked)}
                  disabled={!canEdit || isSaving || !masterEnabled}
                  className="accent-primary mt-1 h-4 w-4 cursor-pointer rounded"
                />
              </div>

              {/* Payment Reminders */}
              <div className="bg-card flex items-start justify-between rounded-lg border p-4 shadow-xs">
                <div className="space-y-1 pr-3">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Clock className="text-primary h-4 w-4" />
                    Pengingat Jatuh Tempo Pembayaran
                  </div>
                  <p className="text-muted-foreground text-xs leading-relaxed">
                    Kirim pengingat tagihan & termin pembayaran vendor yang
                    belum lunas ke pemilik workspace.
                  </p>
                </div>
                <input
                  type="checkbox"
                  id="paymentRemindersEnabled"
                  name="paymentRemindersEnabled"
                  checked={paymentEnabled}
                  onChange={(e) => setPaymentEnabled(e.target.checked)}
                  disabled={!canEdit || isSaving || !masterEnabled}
                  className="accent-primary mt-1 h-4 w-4 cursor-pointer rounded"
                />
              </div>
            </div>

            {/* Threshold Tiers */}
            <div className="space-y-2">
              <label className="text-foreground text-xs font-semibold tracking-wider uppercase">
                Ambang Batas Jadwal Pengingat (Relatif terhadap Due Date)
              </label>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  {
                    id: "tier_H7",
                    tier: "H-7" as ReminderTier,
                    label: "H-7 (1 Minggu)",
                  },
                  {
                    id: "tier_H3",
                    tier: "H-3" as ReminderTier,
                    label: "H-3 (3 Hari)",
                  },
                  {
                    id: "tier_H1",
                    tier: "H-1" as ReminderTier,
                    label: "H-1 (Besok)",
                  },
                  {
                    id: "tier_H0",
                    tier: "H-0" as ReminderTier,
                    label: "H-0 (Hari-H)",
                  },
                ].map(({ id, tier, label }) => {
                  const isChecked = selectedTiers.includes(tier);
                  return (
                    <label
                      key={id}
                      htmlFor={id}
                      className={`flex cursor-pointer items-center justify-between rounded-lg border p-3 text-xs transition-colors ${
                        isChecked
                          ? "border-primary/50 bg-primary/5 text-primary font-semibold"
                          : "border-border text-muted-foreground hover:bg-muted/50"
                      }`}
                    >
                      <span>{label}</span>
                      <input
                        type="checkbox"
                        id={id}
                        name={id}
                        checked={isChecked}
                        onChange={() => toggleTier(tier)}
                        disabled={!canEdit || isSaving || !masterEnabled}
                        className="accent-primary h-4 w-4 rounded"
                      />
                    </label>
                  );
                })}
              </div>
              <p className="text-muted-foreground text-[11px]">
                Waktu dihitung menggunakan zona{" "}
                <strong>Asia/Makassar (WITA / UTC+8)</strong>.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          {canEdit && (
            <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-4">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleManualTrigger}
                disabled={isTriggering || !masterEnabled}
                className="gap-2 text-xs"
              >
                {isTriggering ? (
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Send className="h-3.5 w-3.5" />
                )}
                Jalankan Pengecekan Sekarang
              </Button>

              <Button
                type="submit"
                size="sm"
                disabled={isSaving}
                className="gap-2 text-xs font-semibold"
              >
                {isSaving ? "Menyimpan..." : "Simpan Preferensi"}
              </Button>
            </div>
          )}
        </form>

        {/* Security & Privacy Notice */}
        <div className="bg-muted/30 flex items-start gap-3 rounded-lg border border-dashed p-3 text-xs">
          <ShieldCheck className="text-primary mt-0.5 h-4 w-4 shrink-0" />
          <div className="text-muted-foreground space-y-0.5">
            <span className="text-foreground font-semibold">
              Jaminan Privasi & Idempotensi:
            </span>
            <p>
              Email pengingat tidak pernah memuat nomor rekening, rincian biaya
              rahasia, atau data tamu. Semua tautan mewajibkan login aktif.
              Sistem deduplikasi mencegah pengiriman ganda meskipun scheduler
              berjalan berulang kali.
            </p>
          </div>
        </div>

        {/* Recent Audit Logs */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <h4 className="text-foreground text-xs font-semibold tracking-wider uppercase">
              Riwayat Pengiriman Pengingat Terakhir
            </h4>
            <span className="text-muted-foreground text-[11px]">
              Audit Trail Otomatis
            </span>
          </div>

          {initialLogs.length === 0 ? (
            <div className="text-muted-foreground rounded-lg border border-dashed py-6 text-center text-xs">
              Belum ada riwayat pengiriman pengingat tercatat untuk pawiwahan
              ini.
            </div>
          ) : (
            <div className="divide-border/60 divide-y overflow-hidden rounded-lg border text-xs">
              {initialLogs.map((log) => (
                <div
                  key={log.id}
                  className="bg-card flex flex-col justify-between gap-2 p-3 sm:flex-row sm:items-center"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-foreground font-semibold">
                        {log.itemTitle}
                      </span>
                      <Badge variant="outline" className="text-[10px]">
                        {log.reminderTier}
                      </Badge>
                      <Badge
                        variant={
                          log.status === "sent"
                            ? "default"
                            : log.status === "skipped"
                              ? "secondary"
                              : "destructive"
                        }
                        className="text-[10px]"
                      >
                        {log.status === "sent"
                          ? "Terkirim"
                          : log.status === "skipped"
                            ? "Dilewati"
                            : "Gagal"}
                      </Badge>
                    </div>
                    <div className="text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px]">
                      <span>Penerima: {log.recipientEmail}</span>
                      <span>•</span>
                      <span>Tenggat: {log.targetDueDate}</span>
                    </div>
                  </div>
                  <div className="text-muted-foreground text-right font-mono text-[10px]">
                    {log.sentAt
                      ? new Date(log.sentAt).toLocaleString("id-ID", {
                          timeZone: "Asia/Makassar",
                          dateStyle: "short",
                          timeStyle: "short",
                        }) + " WITA"
                      : "Belum terkirim"}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
