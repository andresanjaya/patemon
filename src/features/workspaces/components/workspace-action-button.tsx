"use client";

import type { ComponentProps } from "react";
import { Button } from "@/components/ui/button";
import { useWorkspace } from "../context/workspace-context";

export function WorkspaceActionButton({
  onClick,
  disabled,
  ...props
}: ComponentProps<typeof Button>) {
  const workspace = useWorkspace();
  return (
    <Button
      {...props}
      disabled={workspace?.isViewerOnly ? false : disabled}
      onClick={(event) => {
        if (workspace && !workspace.requestEdit()) {
          event.preventDefault();
          return;
        }
        onClick?.(event);
      }}
    />
  );
}
