"use client";

import { useEffect, useRef, useState } from "react";
import { TriangleAlert } from "lucide-react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogMedia,
  AlertDialogAction,
  AlertDialogCancel,
} from "./alert-dialog";

interface ConfirmationOptions {
  title: string;
  description: string;
  confirmLabel?: string;
  destructive?: boolean;
}
type ConfirmationRequest = ConfirmationOptions & {
  resolve: (confirmed: boolean) => void;
};
const CONFIRM_EVENT = "patemon:confirm-action";

export function getConfirmationReturnTarget(): HTMLElement | null {
  if (
    typeof document === "undefined" ||
    !(document.activeElement instanceof HTMLElement)
  )
    return null;
  const active = document.activeElement;
  const menuId = active.closest('[role="menu"]')?.id;
  return (
    (menuId &&
      Array.from(
        document.querySelectorAll<HTMLElement>("[aria-controls]")
      ).find((element) => element.getAttribute("aria-controls") === menuId)) ||
    active
  );
}

export function confirmAction(options: ConfirmationOptions): Promise<boolean> {
  if (typeof window === "undefined") return Promise.resolve(false);
  return new Promise((resolve) => {
    const event = new CustomEvent<ConfirmationRequest>(CONFIRM_EVENT, {
      cancelable: true,
      detail: { ...options, resolve },
    });
    if (window.dispatchEvent(event)) resolve(false);
  });
}

export function ActionConfirmation() {
  const [request, setRequest] = useState<ConfirmationRequest | null>(null);
  const active = useRef<ConfirmationRequest | null>(null);
  const returnFocus = useRef<HTMLElement | null>(null);
  const settle = (confirmed: boolean) => {
    const current = active.current;
    active.current = null;
    setRequest(null);
    current?.resolve(confirmed);
  };
  useEffect(() => {
    const handleRequest = (event: Event) => {
      event.preventDefault();
      const next = (event as CustomEvent<ConfirmationRequest>).detail;
      if (active.current) {
        next.resolve(false);
        return;
      }
      returnFocus.current = getConfirmationReturnTarget();
      active.current = next;
      setRequest(next);
    };
    window.addEventListener(CONFIRM_EVENT, handleRequest);
    return () => {
      window.removeEventListener(CONFIRM_EVENT, handleRequest);
      active.current?.resolve(false);
      active.current = null;
    };
  }, []);
  return (
    <AlertDialog
      open={Boolean(request)}
      onOpenChange={(open) => {
        if (!open) settle(false);
      }}
    >
      <AlertDialogContent
        size="sm"
        onCloseAutoFocus={(event) => {
          if (returnFocus.current?.isConnected) {
            event.preventDefault();
            returnFocus.current.focus();
          }
        }}
      >
        <AlertDialogHeader>
          <AlertDialogMedia
            className={
              request?.destructive
                ? "bg-destructive/10 text-destructive"
                : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200"
            }
          >
            <TriangleAlert aria-hidden="true" />
          </AlertDialogMedia>
          <AlertDialogTitle>{request?.title}</AlertDialogTitle>
          <AlertDialogDescription>
            {request?.description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => settle(false)}>
            Batal
          </AlertDialogCancel>
          <AlertDialogAction
            variant={request?.destructive ? "destructive" : "default"}
            onClick={() => settle(true)}
          >
            {request?.confirmLabel || "Lanjutkan"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
