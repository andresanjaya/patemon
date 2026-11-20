"use client";

import React, {
  createContext,
  useContext,
  useState,
  useMemo,
  useCallback,
} from "react";
import type { WeddingWorkspace, WorkspaceRole } from "../types";
import type { WorkspaceEntitlement } from "@/features/payments/types";
import { UpgradePromptModal } from "@/features/payments/components/upgrade-prompt-modal";

export interface WorkspaceContextValue {
  workspace: WeddingWorkspace;
  userRole: WorkspaceRole;
  entitlement: WorkspaceEntitlement;
  isPreview: boolean;
  isPaid: boolean;
  isPendingPayment: boolean;
  isViewerOnly: boolean;
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
  const isViewerOnly = isPaid && userRole === "viewer";

  const openUpgradeModal = useCallback(
    (options?: { title?: string; description?: string }) => {
      setModalOptions(options || {});
      setIsModalOpen(true);
    },
    []
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
      openUpgradeModal,
      closeUpgradeModal,
    ]
  );

  return (
    <WorkspaceContext.Provider value={value}>
      {children}
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
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace(): WorkspaceContextValue | null {
  return useContext(WorkspaceContext);
}
