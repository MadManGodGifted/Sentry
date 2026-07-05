import type { AutosaveStatus } from "@/types/workspace";

export type AppSection =
  | "Home"
  | "Research"
  | "Capture"
  | "Analysis"
  | "Knowledge"
  | "Timeline"
  | "Projects"
  | "Settings";

export type AppWorkspaceId =
  | "mission-control"
  | "satellite-tracking"
  | "earth-observation"
  | "launch-monitor"
  | "deep-space"
  | "analytics"
  | "intelligence"
  | "settings";

export type ModuleState = "READY" | "ONLINE" | "BUSY" | "IDLE" | "OFFLINE" | "ERROR" | "WAITING" | "INITIALIZING";

export type ModulePanel = {
  id: string;
  label: string;
  coordinate: string;
  state: ModuleState;
  tone: "green" | "red" | "amber" | "cyan";
  hidden: boolean;
  collapsed: boolean;
  lines: string[];
};

export type SettingsState = {
  echoCommands: boolean;
  compactConsole: boolean;
  preserveLayout: boolean;
};

export type MissionWorkspace = {
  id: AppWorkspaceId;
  section: AppSection;
  name: string;
  code: string;
  inspector: string;
  module: string;
};

export type Mission = {
  id: string;
  workspaceId: AppWorkspaceId;
  name: string;
  phase: string;
  orbit: string;
  startedAt: string;
};

export type Satellite = {
  id: string;
  missionId: string;
  name: string;
  type: "relay" | "weather" | "earth-observation" | "deep-space" | "navigation";
  altitudeKm: number;
  velocityKps: number;
  signal: number;
  status: "nominal" | "tracking" | "warning" | "critical";
  coordinates: string;
};

export type TelemetryPoint = {
  id: string;
  label: string;
  value: number;
  unit: string;
  trend: number;
};

export type MissionEvent = {
  id: string;
  at: string;
  severity: "system" | "mission" | "warning" | "critical";
  message: string;
};

export type AppAlert = {
  id: string;
  satelliteId?: string;
  level: "warning" | "critical" | "system";
  message: string;
  createdAt: string;
};

export type AppNotification = {
  id: string;
  type: "success" | "warning" | "critical" | "system" | "mission";
  title: string;
  message: string;
  createdAt: string;
  pinned: boolean;
};

export type AppWindowState = "open" | "closed" | "minimized" | "maximized";

export type AppWindow = {
  id: string;
  title: string;
  state: AppWindowState;
  focused: boolean;
  zIndex: number;
};

export type DockItem = {
  id: string;
  label: string;
  target: AppWorkspaceId | string;
  pinned: boolean;
  recent: boolean;
};

export type SearchResult = {
  id: string;
  kind: "workspace" | "command" | "panel" | "settings" | "recent" | "mission" | "satellite" | "widget";
  title: string;
  detail: string;
};

export type ContextMenuState = {
  x: number;
  y: number;
  targetId: string;
  targetType: "workspace" | "panel" | "graph" | "notification" | "file" | "dock";
};

export type MockTelemetry = {
  satellites: Satellite[];
  telemetry: TelemetryPoint[];
  events: MissionEvent[];
  alerts: AppAlert[];
};

export type MockData = {
  workspaces: MissionWorkspace[];
  missions: Mission[];
  byMission: Record<string, MockTelemetry>;
};

export type AutosaveSnapshot = {
  status: AutosaveStatus;
  lastSaveAt: string | null;
};
