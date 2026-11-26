"use client";

import dynamic from "next/dynamic";
import { getConfirmationReturnTarget } from "@/components/ui/action-confirmation";
import { Eye } from "lucide-react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogMedia,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";

import React, {
  createContext,
  useContext,
  useState,
  useMemo,
  useCallback,
  useRef,
} from "react";
import type { WeddingWorkspace, WorkspaceRole } from "../types";
import type { WorkspaceEntitlement } from "@/features/payments/types";

const UpgradePromptModal = dynamic(() =>
  import("@/features/payments/components/upgrade-prompt-modal").then(
    (module) => module.UpgradePromptModal
  )
);

export interface WorkspaceContextValue {
  workspace: WeddingWorkspace;
  userRole: WorkspaceRole;
  entitlement: WorkspaceEntitlement;
  isPreview: boolean;
  isPaid: boolean;
  isPendingPayment: boolean;
  isViewerOnly: boolean;
  requestEdit: () => boolean;
  openUpgradeModal: (options?: {
    title?: string;
    description?: string;
  }) => void;
  closeUpgradeModal: () => void;
}

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

export interface WorkspaceProviderProps {
  workspace: WeddingWorkspace;
  userRole: WorkspaceRole;
  entitlement: WorkspaceEntitlement;
  children: React.ReactNode;
}

export function WorkspaceProvider({
  workspace,
  userRole,
  entitlement,
  children,
}: WorkspaceProviderProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isReadOnlyOpen, setIsReadOnlyOpen] = useState(false);
  const readOnlyFocus = useRef<HTMLElement | null>(null);
  const [modalOptions, setModalOptions] = useState<{
    title?: string;
    description?: string;
  }>({});

  const isPaid = entitlement.isPaid;
  const isPreview = !isPaid || workspace.id === "demo";
  const isPendingPayment =
    !isPaid &&
    (Boolean(
      (entitlement as unknown as { orderStatus?: string }).orderStatus ===
      "pending"
    ) ||
      Boolean(
        (entitlement as unknown as { order?: { status?: string } }).order
          ?.status === "pending"
      ));
  const isViewerOnly = workspace.id !== "demo" && userRole === "viewer";
  const requestEdit = useCallback(() => {
    if (!isViewerOnly) return true;
    readOnlyFocus.current = getConfirmationReturnTarget();
    setIsReadOnlyOpen(true);
    return false;
  }, [isViewerOnly]);

  const openUpgradeModal = useCallback(
    (options?: { title?: string; description?: string }) => {
      if (!requestEdit()) return;
      setModalOptions(options || {});
      setIsModalOpen(true);
    },
    [requestEdit]
  );

  const closeUpgradeModal = useCallback(() => {
    setIsModalOpen(false);
    setModalOptions({});
  }, []);

  const value = useMemo<WorkspaceContextValue>(
    () => ({
      workspace,
      userRole,
      entitlement,
      isPreview,
      isPaid,
      isPendingPayment,
      isViewerOnly,
      requestEdit,
      openUpgradeModal,
      closeUpgradeModal,
    }),
    [
      workspace,
      userRole,
      entitlement,
      isPreview,
      isPaid,
      isPendingPayment,
      isViewerOnly,
      requestEdit,
      openUpgradeModal,
      closeUpgradeModal,
    ]
  );

  return (
    <WorkspaceContext.Provider value={value}>
      {children}
      <AlertDialog open={isReadOnlyOpen} onOpenChange={setIsReadOnlyOpen}>
        <AlertDialogContent
          size="sm"
          onCloseAutoFocus={(event) => {
            if (readOnlyFocus.current?.isConnected) {
              event.preventDefault();
              readOnlyFocus.current.focus();
            }
          }}
        >
          <AlertDialogHeader>
            <AlertDialogMedia className="bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200">
              <Eye aria-hidden="true" />
            </AlertDialogMedia>
            <AlertDialogTitle>Akses Anda hanya untuk melihat</AlertDialogTitle>
            <AlertDialogDescription>
              Anda dapat melihat rencana dan memantau persiapan. Menambah,
              mengubah, dan menghapus data memerlukan peran Editor atau Pemilik.
              Hubungi pemilik ruang kerja untuk meminta perubahan peran.
              Pembayaran workspace tidak mengubah peran anggota.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Mengerti</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      {isModalOpen && (
        <UpgradePromptModal
          isOpen={isModalOpen}
          onClose={closeUpgradeModal}
          weddingId={workspace.id}
          coupleNames={workspace.coupleNames}
          title={modalOptions.title}
          description={modalOptions.description}
          isPendingPayment={isPendingPayment}
          isViewerOnly={isViewerOnly}
        />
      )}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace(): WorkspaceContextValue | null {
  return useContext(WorkspaceContext);
}
