"use client";

import { workspaceService } from "@/services/workspace.service";
import type {
  AutosaveStatus,
  Workspace,
  WorkspaceActivity,
  WorkspaceCreateInput,
  WorkspaceSettings
} from "@/types/workspace";

type WorkspaceState = {
  activeWorkspace: Workspace | null;
  activeWorkspaceId: string | null;
  autosaveStatus: AutosaveStatus;
  currentModule: string;
  error: string | null;
  initialized: boolean;
  lastSaveAt: string | null;
  recentWorkspaces: Workspace[];
  logs: WorkspaceActivity[];
  workspaces: Workspace[];
};

type Listener = () => void;

const initialState: WorkspaceState = {
  activeWorkspace: null,
  activeWorkspaceId: null,
  autosaveStatus: "IDLE",
  currentModule: "MODULE",
  error: null,
  initialized: false,
  lastSaveAt: null,
  recentWorkspaces: [],
  logs: [],
  workspaces: []
};

class WorkspaceStore {
  private listeners = new Set<Listener>();
  private state = initialState;

  getSnapshot = () => this.state;

  subscribe = (listener: Listener) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  private emit() {
    this.listeners.forEach((listener) => listener());
  }

  private setState(patch: Partial<WorkspaceState>) {
    this.state = { ...this.state, ...patch };
    this.emit();
  }

  private async refresh(activeWorkspaceId = this.state.activeWorkspaceId) {
    const [workspaces, recentWorkspaces, logs] = await Promise.all([
      workspaceService.listWorkspaces(),
      workspaceService.getRecentWorkspaces(),
      workspaceService.listActivity()
    ]);
    const activeWorkspace =
      workspaces.find((workspace) => workspace.id === activeWorkspaceId) ?? workspaces[0] ?? null;

    this.setState({
      activeWorkspace,
      activeWorkspaceId: activeWorkspace?.id ?? null,
      logs,
      recentWorkspaces,
      workspaces
    });
  }

  initialize = async () => {
    if (this.state.initialized) {
      return;
    }

    try {
      const recentWorkspaces = await workspaceService.getRecentWorkspaces();
      await this.refresh(recentWorkspaces[0]?.id ?? null);
      this.setState({ error: null, initialized: true });
    } catch (error) {
      this.setState({
        error: error instanceof Error ? error.message : "Workspace engine failed to initialize.",
        initialized: true
      });
    }
  };

  createWorkspace = async (input: WorkspaceCreateInput = {}) => {
    const workspace = await workspaceService.createWorkspace(input);
    await this.refresh(workspace.id);
    this.setState({ autosaveStatus: "SAVED", lastSaveAt: workspace.updatedAt });
    return workspace;
  };

  openWorkspace = async (workspaceId: string) => {
    const workspace = await workspaceService.getWorkspace(workspaceId);
    if (!workspace) {
      return null;
    }

    await workspaceService.pushRecentWorkspace(workspace.id);
    await workspaceService.recordCommand(`workspace open ${workspace.name}`, workspace.id);
    await this.refresh(workspace.id);
    this.setState({ autosaveStatus: "SAVED", lastSaveAt: workspace.updatedAt });
    return workspace;
  };

  renameWorkspace = async (workspaceId: string, name: string) => {
    const workspace = await workspaceService.renameWorkspace(workspaceId, name);
    if (!workspace) {
      return null;
    }

    await this.refresh(workspace.id);
    this.setState({ autosaveStatus: "SAVED", lastSaveAt: workspace.updatedAt });
    return workspace;
  };

  deleteWorkspace = async (workspaceId: string) => {
    const deleted = await workspaceService.deleteWorkspace(workspaceId);
    await this.refresh(this.state.activeWorkspaceId === workspaceId ? null : this.state.activeWorkspaceId);
    this.setState({ autosaveStatus: "SAVED", lastSaveAt: new Date().toISOString() });
    return deleted;
  };

  duplicateWorkspace = async (workspaceId: string) => {
    const workspace = await workspaceService.duplicateWorkspace(workspaceId);
    if (!workspace) {
      return null;
    }

    await this.refresh(workspace.id);
    this.setState({ autosaveStatus: "SAVED", lastSaveAt: workspace.updatedAt });
    return workspace;
  };

  autosaveWorkspace = async (settings: WorkspaceSettings) => {
    const workspaceId = this.state.activeWorkspaceId;
    if (!workspaceId) {
      return null;
    }

    this.setState({ autosaveStatus: "SAVING" });

    try {
      const workspace = await workspaceService.autosaveWorkspace(workspaceId, settings);
      await this.refresh(workspaceId);
      this.setState({
        autosaveStatus: "SAVED",
        error: null,
        lastSaveAt: workspace?.updatedAt ?? new Date().toISOString()
      });
      return workspace;
    } catch (error) {
      this.setState({
        autosaveStatus: "ERROR",
        error: error instanceof Error ? error.message : "Autosave failed."
      });
      return null;
    }
  };

  recordCommand = async (command: string) => {
    await workspaceService.recordCommand(command, this.state.activeWorkspaceId);
    await this.refresh(this.state.activeWorkspaceId);
  };

  setCurrentModule = (moduleName: string) => {
    this.setState({ currentModule: moduleName });
  };
}

export const workspaceStore = new WorkspaceStore();
