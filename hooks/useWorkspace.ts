"use client";

import { useEffect, useSyncExternalStore } from "react";
import { workspaceStore } from "@/store/workspace.store";

export function useWorkspace() {
  const state = useSyncExternalStore(workspaceStore.subscribe, workspaceStore.getSnapshot, workspaceStore.getSnapshot);

  useEffect(() => {
    void workspaceStore.initialize();
  }, []);

  return {
    ...state,
    autosaveWorkspace: workspaceStore.autosaveWorkspace,
    createWorkspace: workspaceStore.createWorkspace,
    deleteWorkspace: workspaceStore.deleteWorkspace,
    duplicateWorkspace: workspaceStore.duplicateWorkspace,
    openWorkspace: workspaceStore.openWorkspace,
    recordCommand: workspaceStore.recordCommand,
    renameWorkspace: workspaceStore.renameWorkspace,
    setCurrentModule: workspaceStore.setCurrentModule
  };
}
