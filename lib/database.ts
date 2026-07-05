import Dexie, { type Table } from "dexie";
import type { Workspace, WorkspaceActivity } from "@/types/workspace";

export type PreferenceRecord = {
  key: string;
  value: unknown;
  updatedAt: string;
};

class SentryDatabase extends Dexie {
  workspaces!: Table<Workspace, string>;
  activityLogs!: Table<WorkspaceActivity, number>;
  preferences!: Table<PreferenceRecord, string>;

  constructor() {
    super("sentry_workspace_engine");

    this.version(1).stores({
      workspaces: "id, name, status, createdAt, updatedAt",
      activityLogs: "++id, workspaceId, type, createdAt",
      preferences: "key, updatedAt"
    });
  }
}

export const sentryDb = new SentryDatabase();
