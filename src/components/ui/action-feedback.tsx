"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { usePathname, unstable_rethrow } from "next/navigation";
import { CircleCheck, Info, TriangleAlert, CircleX } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "./alert";

export type FeedbackVariant = "success" | "info" | "warning" | "destructive";
const feedbackStyles = {
  success: { title: "Berhasil", icon: CircleCheck },
  info: { title: "Informasi", icon: Info },
  warning: { title: "Perlu perhatian", icon: TriangleAlert },
  destructive: { title: "Tindakan gagal", icon: CircleX },
};
const FEEDBACK_EVENT = "patemon:action-feedback";
type Feedback = { variant: FeedbackVariant; message: string };

export function notify(variant: FeedbackVariant, message: string) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent<Feedback>(FEEDBACK_EVENT, {
      detail: { variant, message },
    })
  );
}

interface ActionResult {
  success: boolean;
  error?: string;
  message?: string;
  conflict?: boolean;
  count?: number;
  importedCount?: number;
  failedCount?: number;
}

export async function runAction<T extends ActionResult>(
  action: () => Promise<T>,
  successMessage: string | Feedback | false,
  onError?: ((message: string) => void) | "inline"
): Promise<
  | T
  | {
      success: false;
      error: string;
      message: string;
      conflict?: false;
      correlationId?: undefined;
    }
> {
  const reportError = (message: string, conflict = false) => {
    if (onError === "inline") return;
    if (onError) onError(message);
    else notify(conflict ? "warning" : "destructive", message);
  };
  try {
    const result = await action();
    if (!result.success) {
      reportError(
        result.error ||
          result.message ||
          "Perubahan belum tersimpan. Silakan coba lagi.",
        result.conflict
      );
    } else if (successMessage) {
      const feedback =
        typeof successMessage === "string"
          ? { variant: "success" as const, message: successMessage }
          : successMessage;
      if (result.failedCount && result.failedCount > 0) {
        notify(
          "warning",
          result.message ||
            "Sebagian data belum tersimpan. Periksa hasil sebelum mencoba lagi."
        );
      } else if (result.count === 0 || result.importedCount === 0) {
        notify(
          "info",
          result.message || "Tidak ada data baru yang ditambahkan."
        );
      } else {
        notify(feedback.variant, feedback.message);
      }
    }
    return result;
  } catch (error) {
    unstable_rethrow(error);
    const message =
      "Hasil tindakan belum dapat dipastikan. Periksa koneksi dan muat ulang data sebelum mencoba lagi.";
    reportError(message);
    return { success: false, error: message, message };
  }
}

export async function copyText(
  text: string,
  message = "Teks berhasil disalin."
) {
  try {
    await navigator.clipboard.writeText(text);
    notify("info", message);
    return true;
  } catch {
    notify(
      "destructive",
      "Data belum berhasil disalin. Izinkan akses clipboard atau salin secara manual."
    );
    return false;
  }
}

export function ActionAlert({
  variant = "info",
  message,
  title,
  onClose,
}: {
  variant?: FeedbackVariant;
  message: ReactNode;
  title?: string;
  onClose?: () => void;
}) {
  const { icon: Icon, title: defaultTitle } = feedbackStyles[variant];
  return (
    <Alert
      variant={variant}
      role={
        variant === "destructive" || variant === "warning" ? "alert" : "status"
      }
      aria-atomic="true"
      close={Boolean(onClose)}
      onClose={onClose}
    >
      <Icon className="size-4" aria-hidden="true" />
      <AlertTitle>{title || defaultTitle}</AlertTitle>
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  );
}

function FeedbackItem({
  feedback,
  onClose,
}: {
  feedback: Feedback;
  onClose: () => void;
}) {
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    if (
      paused ||
      feedback.variant === "warning" ||
      feedback.variant === "destructive"
    )
      return;
    const timer = setTimeout(onClose, 6000);
    return () => clearTimeout(timer);
  }, [feedback.variant, onClose, paused]);
  return (
    <div
      className="pointer-events-auto"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <ActionAlert {...feedback} onClose={onClose} />
    </div>
  );
}

export function ActionFeedback() {
  const [items, setItems] = useState<(Feedback & { id: number })[]>([]);
  const nextId = useRef(0);
  const pathname = usePathname();
  useEffect(() => {
    const handleFeedback = (event: Event) => {
      const feedback = (event as CustomEvent<Feedback>).detail;
      const id = ++nextId.current;
      setItems((current) => [...current.slice(-2), { ...feedback, id }]);
    };
    window.addEventListener(FEEDBACK_EVENT, handleFeedback);
    return () => window.removeEventListener(FEEDBACK_EVENT, handleFeedback);
  }, []);
  useEffect(() => {
    const url = new URL(window.location.href);
    const notice = url.searchParams.get("notice");
    const message =
      notice === "workspace-created"
        ? "Ruang kerja baru berhasil dibuat. Mulai susun rencana pawiwahan Anda."
        : notice === "workspace-deleted"
          ? "Ruang kerja berhasil dihapus."
          : null;
    if (!message) return;
    notify("success", message);
    url.searchParams.delete("notice");
    window.history.replaceState(window.history.state, "", url);
  }, [pathname]);
  return (
    <section
      aria-label="Notifikasi tindakan"
      className="pointer-events-none fixed right-4 bottom-4 left-4 z-[100] flex flex-col gap-3 sm:left-auto sm:w-96"
    >
      {items.map((item) => (
        <FeedbackItem
          key={item.id}
          feedback={item}
          onClose={() =>
            setItems((current) =>
              current.filter((entry) => entry.id !== item.id)
            )
          }
        />
      ))}
    </section>
  );
}
