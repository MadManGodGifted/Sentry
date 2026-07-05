import { sentryDb } from "@/lib/database";
import type {
  Workspace,
  WorkspaceActivity,
  WorkspaceActivityType,
  WorkspaceCreateInput,
  WorkspaceSettings,
  WorkspaceUpdateInput
} from "@/types/workspace";

const RECENT_WORKSPACES_KEY = "recentWorkspaceIds";

const workspaceColors = ["#53D6E8", "#C58B29", "#55D86A", "#4E83FF", "#E5483B"];

function timestamp() {
  return new Date().toISOString();
}

function createId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `ws-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function createDefaultWorkspaceSettings(): WorkspaceSettings {
  return {
    layout: {
      rightPanelWidth: 236,
      moduleOrder: ["M-01", "Q-04", "R-12", "C-08"],
      hiddenModuleIds: [],
      collapsedModuleIds: []
    },
    shell: {
      activeSection: "Home",
      compactConsole: false,
      echoCommands: true,
      preserveLayout: true
    }
  };
}

function createWorkspaceRecord(input: WorkspaceCreateInput = {}): Workspace {
  const now = timestamp();

  return {
    id: createId(),
    name: input.name?.trim() || `Workspace ${new Date().toLocaleTimeString("en-US", { hour12: false })}`,
    description: input.description?.trim() || "Operational workspace",
    createdAt: now,
    updatedAt: now,
    icon: input.icon || "S",
    color: input.color || workspaceColors[Math.floor(Math.random() * workspaceColors.length)],
    status: "READY",
    settings: createDefaultWorkspaceSettings()
  };
}

async function appendActivity(type: WorkspaceActivityType, message: string, workspaceId: string | null) {
  await sentryDb.activityLogs.add({
    workspaceId,
    type,
    message,
    createdAt: timestamp()
  });
}

export const workspaceService = {
  async listWorkspaces() {
    return sentryDb.workspaces.orderBy("updatedAt").reverse().toArray();
  },

  async getWorkspace(workspaceId: string) {
    return sentryDb.workspaces.get(workspaceId);
  },

  async createWorkspace(input: WorkspaceCreateInput = {}) {
    const workspace = createWorkspaceRecord(input);
    await sentryDb.workspaces.add(workspace);
    await this.pushRecentWorkspace(workspace.id);
    await appendActivity("WORKSPACE_CREATED", `Workspace created: ${workspace.name}`, workspace.id);
    return workspace;
  },

  async renameWorkspace(workspaceId: string, name: string) {
    const workspace = await sentryDb.workspaces.get(workspaceId);
    const nextName = name.trim();
    if (!workspace || !nextName) {
      return null;
    }

    const updatedAt = timestamp();
    await sentryDb.workspaces.update(workspaceId, { name: nextName, updatedAt });
    await appendActivity("WORKSPACE_RENAMED", `Workspace renamed: ${workspace.name} -> ${nextName}`, workspaceId);
    return sentryDb.workspaces.get(workspaceId);
  },

  async updateWorkspace(workspaceId: string, input: WorkspaceUpdateInput) {
    const workspace = await sentryDb.workspaces.get(workspaceId);
    if (!workspace) {
      return null;
    }

    const update: WorkspaceUpdateInput & { updatedAt: string } = {
      ...input,
      updatedAt: timestamp()
    };

    await sentryDb.workspaces.update(workspaceId, update);
    return sentryDb.workspaces.get(workspaceId);
  },

  async deleteWorkspace(workspaceId: string) {
    const workspace = await sentryDb.workspaces.get(workspaceId);
    if (!workspace) {
      return null;
    }

    await sentryDb.transaction("rw", sentryDb.workspaces, sentryDb.activityLogs, sentryDb.preferences, async () => {
      await sentryDb.workspaces.delete(workspaceId);
      await this.removeRecentWorkspace(workspaceId);
      await appendActivity("WORKSPACE_DELETED", `Workspace deleted: ${workspace.name}`, workspaceId);
    });

    return workspace;
  },

  async duplicateWorkspace(workspaceId: string) {
    const workspace = await sentryDb.workspaces.get(workspaceId);
    if (!workspace) {
      return null;
    }

    const now = timestamp();
    const duplicate: Workspace = {
      ...workspace,
      id: createId(),
      name: `${workspace.name} COPY`,
      createdAt: now,
      updatedAt: now,
      status: "READY"
    };

    await sentryDb.workspaces.add(duplicate);
    await this.pushRecentWorkspace(duplicate.id);
    await appendActivity("WORKSPACE_DUPLICATED", `Workspace duplicated: ${workspace.name}`, duplicate.id);
    return duplicate;
  },

  async autosaveWorkspace(workspaceId: string, settings: WorkspaceSettings) {
    const workspace = await sentryDb.workspaces.get(workspaceId);
    if (!workspace) {
      return null;
    }

    const updatedAt = timestamp();
    await sentryDb.workspaces.update(workspaceId, { settings, updatedAt });
    await appendActivity("AUTOSAVE_COMPLETED", `Autosave completed: ${workspace.name}`, workspaceId);
    return sentryDb.workspaces.get(workspaceId);
  },

  async listActivity(limit = 80) {
    return sentryDb.activityLogs.orderBy("createdAt").reverse().limit(limit).toArray();
  },

  async recordCommand(command: string, workspaceId: string | null) {
    await appendActivity("COMMAND_EXECUTED", `Command executed: ${command}`, workspaceId);
  },

  async getRecentWorkspaceIds() {
    const record = await sentryDb.preferences.get(RECENT_WORKSPACES_KEY);
    return Array.isArray(record?.value) ? (record.value as string[]) : [];
  },

  async setRecentWorkspaceIds(workspaceIds: string[]) {
    await sentryDb.preferences.put({
      key: RECENT_WORKSPACES_KEY,
      value: workspaceIds.slice(0, 8),
      updatedAt: timestamp()
    });
  },

  async pushRecentWorkspace(workspaceId: string) {
    const recentIds = await this.getRecentWorkspaceIds();
    await this.setRecentWorkspaceIds([workspaceId, ...recentIds.filter((id) => id !== workspaceId)]);
  },

  async removeRecentWorkspace(workspaceId: string) {
    const recentIds = await this.getRecentWorkspaceIds();
    await this.setRecentWorkspaceIds(recentIds.filter((id) => id !== workspaceId));
  },

  async getRecentWorkspaces() {
    const recentIds = await this.getRecentWorkspaceIds();
    const workspaces = await sentryDb.workspaces.bulkGet(recentIds);
    return workspaces.filter(Boolean) as Workspace[];
  }
};

export type { WorkspaceActivity };
