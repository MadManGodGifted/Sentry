export type WorkspaceStatus = "READY" | "ACTIVE" | "ARCHIVED";

export type AutosaveStatus = "IDLE" | "SAVING" | "SAVED" | "ERROR";

export type WorkspaceSettings = {
  layout: {
    rightPanelWidth: number;
    moduleOrder: string[];
    hiddenModuleIds: string[];
    collapsedModuleIds: string[];
  };
  shell: {
    activeSection: string;
    compactConsole: boolean;
    echoCommands: boolean;
    preserveLayout: boolean;
  };
};

export type Workspace = {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  icon: string;
  color: string;
  status: WorkspaceStatus;
  settings: WorkspaceSettings;
};

export type WorkspaceActivityType =
  | "WORKSPACE_CREATED"
  | "WORKSPACE_RENAMED"
  | "WORKSPACE_DELETED"
  | "WORKSPACE_OPENED"
  | "WORKSPACE_DUPLICATED"
  | "AUTOSAVE_COMPLETED"
  | "COMMAND_EXECUTED";

export type WorkspaceActivity = {
  id?: number;
  workspaceId: string | null;
  type: WorkspaceActivityType;
  message: string;
  createdAt: string;
};

export type WorkspaceCreateInput = {
  name?: string;
  description?: string;
  icon?: string;
  color?: string;
};

export type WorkspaceUpdateInput = Partial<
  Pick<Workspace, "name" | "description" | "icon" | "color" | "status" | "settings">
>;
