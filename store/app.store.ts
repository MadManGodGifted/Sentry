"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { createMockData, refreshMockTelemetry } from "@/lib/mock-data";
import type {
  AppNotification,
  AppSection,
  AppWindow,
  AppWorkspaceId,
  ContextMenuState,
  DockItem,
  MockData,
  ModulePanel,
  SearchResult,
  SettingsState
} from "@/types/app";
import type { LiveDataSnapshot } from "@/types/live-data";

const initialMock = createMockData();

const sectionToWorkspace: Record<AppSection, AppWorkspaceId> = {
  Home: "mission-control",
  Research: "intelligence",
  Capture: "earth-observation",
  Analysis: "analytics",
  Knowledge: "deep-space",
  Timeline: "launch-monitor",
  Projects: "satellite-tracking",
  Settings: "settings"
};

const initialModules: ModulePanel[] = [
  { label: "MODULE", id: "M-01", coordinate: "X:21 Y:03", state: "ONLINE", tone: "green", hidden: false, collapsed: false, lines: [] },
  { label: "QUEUE", id: "Q-04", coordinate: "X:21 Y:09", state: "IDLE", tone: "red", hidden: false, collapsed: false, lines: [] },
  { label: "MEMORY", id: "R-12", coordinate: "X:21 Y:15", state: "READY", tone: "amber", hidden: false, collapsed: false, lines: [] },
  { label: "CONTEXT", id: "C-08", coordinate: "X:21 Y:21", state: "WAITING", tone: "cyan", hidden: false, collapsed: false, lines: [] }
];

const defaultSettings: SettingsState = {
  echoCommands: true,
  compactConsole: false,
  preserveLayout: true
};

const initialWindows: AppWindow[] = [
  { id: "workspace-manager", title: "WORKSPACE MANAGER", state: "open", focused: true, zIndex: 4 },
  { id: "orbital-plot", title: "ORBITAL PLOTTER", state: "open", focused: false, zIndex: 3 },
  { id: "system-console", title: "SYSTEM CONSOLE", state: "open", focused: false, zIndex: 2 },
  { id: "inspector", title: "RIGHT INSPECTOR", state: "open", focused: false, zIndex: 1 }
];

const initialDock: DockItem[] = [
  { id: "dock-mission", label: "MISSION", target: "mission-control", pinned: true, recent: false },
  { id: "dock-track", label: "TRACK", target: "satellite-tracking", pinned: true, recent: false },
  { id: "dock-graph", label: "GRAPH", target: "analytics", pinned: true, recent: false },
  { id: "dock-config", label: "CONFIG", target: "settings", pinned: true, recent: false }
];

function missionForWorkspace(mock: MockData, workspaceId: AppWorkspaceId) {
  return mock.missions.find((mission) => mission.workspaceId === workspaceId) ?? mock.missions[0];
}

function selectedSatelliteForMission(mock: MockData, missionId: string, requestedId?: string) {
  const satellites = mock.byMission[missionId]?.satellites ?? [];
  return satellites.find((satellite) => satellite.id === requestedId) ?? satellites[0] ?? null;
}

function buildBreadcrumbs(mock: MockData, workspaceId: AppWorkspaceId, missionId: string, satelliteId: string | null) {
  const workspace = mock.workspaces.find((candidate) => candidate.id === workspaceId);
  const mission = mock.missions.find((candidate) => candidate.id === missionId);
  const satellite = satelliteId ? selectedSatelliteForMission(mock, missionId, satelliteId) : null;
  return [workspace?.name ?? "Mission Control", mission?.name ?? "NO MISSION", satellite?.name ?? "NO SATELLITE"];
}

function notification(type: AppNotification["type"], title: string, message: string, pinned = false): AppNotification {
  return {
    id: `ntf-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    type,
    title,
    message,
    createdAt: new Date().toISOString(),
    pinned
  };
}

function searchMock(mock: MockData, query: string, windows: AppWindow[], dock: DockItem[], liveData?: LiveDataSnapshot | null): SearchResult[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) {
    return [
      ...mock.workspaces.slice(0, 5).map((workspace) => ({
        id: workspace.id,
        kind: "workspace" as const,
        title: workspace.name,
        detail: `${workspace.code} / ${workspace.inspector}`
      })),
      ...dock.slice(0, 3).map((item) => ({
        id: item.id,
        kind: "recent" as const,
        title: item.label,
        detail: String(item.target).toUpperCase()
      }))
    ];
  }

  const results: SearchResult[] = [];
  mock.workspaces.forEach((workspace) => {
    if (`${workspace.name} ${workspace.code} ${workspace.section}`.toLowerCase().includes(normalized)) {
      results.push({ id: workspace.id, kind: "workspace", title: workspace.name, detail: workspace.inspector });
    }
  });
  mock.missions.forEach((mission) => {
    if (`${mission.name} ${mission.phase} ${mission.orbit}`.toLowerCase().includes(normalized)) {
      results.push({ id: mission.id, kind: "mission", title: mission.name, detail: `${mission.phase} / ${mission.orbit}` });
    }
  });
  Object.values(mock.byMission).forEach((packet) => {
    packet.satellites.forEach((satellite) => {
      if (`${satellite.name} ${satellite.type} ${satellite.status}`.toLowerCase().includes(normalized)) {
        results.push({ id: satellite.id, kind: "satellite", title: satellite.name, detail: `${satellite.status} / ${satellite.signal}%` });
      }
    });
  });
  liveData?.satellites.forEach((satellite) => {
    if (`${satellite.name} ${satellite.provider} ${satellite.status}`.toLowerCase().includes(normalized)) {
      results.push({ id: satellite.id, kind: "satellite", title: satellite.name, detail: `${satellite.provider} / ${satellite.status}` });
    }
  });
  liveData?.timeline.forEach((event) => {
    if (`${event.title} ${event.detail} ${event.source}`.toLowerCase().includes(normalized)) {
      results.push({ id: event.id, kind: "mission", title: event.title, detail: `${event.kind} / ${event.source}` });
    }
  });
  windows.forEach((window) => {
    if (`${window.title} ${window.state}`.toLowerCase().includes(normalized)) {
      results.push({ id: window.id, kind: "panel", title: window.title, detail: window.state.toUpperCase() });
    }
  });

  return results.slice(0, 12);
}

type AppStore = {
  activeWorkspaceId: AppWorkspaceId;
  activeMissionId: string;
  selectedSatelliteId: string | null;
  selectedGraphId: string;
  activeAlerts: string[];
  notifications: AppNotification[];
  sidebarCollapsed: boolean;
  panelVisibility: Record<string, boolean>;
  windows: AppWindow[];
  activeTabs: Record<string, string>;
  searchQuery: string;
  commandPaletteOpen: boolean;
  commandPaletteQuery: string;
  loadingStates: Record<string, boolean>;
  mock: MockData;
  modules: ModulePanel[];
  rightPanelWidth: number;
  settings: SettingsState;
  terminalHistory: string[];
  terminalInput: string;
  workspaceDraftName: string;
  workspaceRenameDraft: string;
  currentModule: string;
  dock: DockItem[];
  contextMenu: ContextMenuState | null;
  breadcrumbs: string[];
  liveData: LiveDataSnapshot | null;
  setActiveSection: (section: AppSection) => void;
  setActiveWorkspace: (workspaceId: AppWorkspaceId) => void;
  selectSatellite: (satelliteId: string) => void;
  selectGraph: (graphId: string) => void;
  setSearchQuery: (query: string) => void;
  setCommandPaletteOpen: (open: boolean) => void;
  setCommandPaletteQuery: (query: string) => void;
  pushNotification: (type: AppNotification["type"], title: string, message: string, pinned?: boolean) => void;
  dismissNotification: (id: string) => void;
  pinNotification: (id: string) => void;
  openWindow: (id: string) => void;
  closeWindow: (id: string) => void;
  minimizeWindow: (id: string) => void;
  maximizeWindow: (id: string) => void;
  restoreWindow: (id: string) => void;
  focusWindow: (id: string) => void;
  launchDockItem: (id: string) => void;
  updateModule: (moduleId: string, patch: Partial<ModulePanel>) => void;
  moveModule: (moduleId: string, direction: -1 | 1) => void;
  restoreModules: () => void;
  resizeRightPanel: (width: number) => void;
  updateSetting: <K extends keyof SettingsState>(key: K, value: SettingsState[K]) => void;
  setTerminalInput: (value: string) => void;
  setWorkspaceDraftName: (value: string) => void;
  setWorkspaceRenameDraft: (value: string) => void;
  clearTerminal: () => void;
  addLog: (line: string) => void;
  setCurrentModule: (moduleName: string) => void;
  switchModule: () => void;
  openContextMenu: (contextMenu: ContextMenuState) => void;
  closeContextMenu: () => void;
  search: (query?: string) => SearchResult[];
  refreshTelemetry: () => void;
  setLoading: (key: string, loading: boolean) => void;
  setLiveData: (liveData: LiveDataSnapshot) => void;
};

const firstMission = missionForWorkspace(initialMock, "mission-control");
const firstSatellite = selectedSatelliteForMission(initialMock, firstMission.id);

export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      activeWorkspaceId: "mission-control",
      activeMissionId: firstMission.id,
      selectedSatelliteId: firstSatellite?.id ?? null,
      selectedGraphId: "orbital-plot",
      activeAlerts: initialMock.byMission[firstMission.id]?.alerts.map((alert) => alert.id) ?? [],
      notifications: [],
      sidebarCollapsed: false,
      panelVisibility: { inspector: true, dock: true, console: true, plot: true },
      windows: initialWindows,
      activeTabs: { inspector: "satellite", center: "plot", right: "metadata" },
      searchQuery: "",
      commandPaletteOpen: false,
      commandPaletteQuery: "",
      loadingStates: {},
      mock: initialMock,
      modules: initialModules,
      rightPanelWidth: 236,
      settings: defaultSettings,
      terminalHistory: [
        "[SYS] System boot sequence complete.",
        "[SYS] Zustand application core online.",
        "[SYS] Mock telemetry engine standing by.",
        "[SYS] Awaiting operator input."
      ],
      terminalInput: "",
      workspaceDraftName: "",
      workspaceRenameDraft: "",
      currentModule: "MODULE",
      dock: initialDock,
      contextMenu: null,
      breadcrumbs: buildBreadcrumbs(initialMock, "mission-control", firstMission.id, firstSatellite?.id ?? null),
      liveData: null,
      setActiveSection: (section) => get().setActiveWorkspace(sectionToWorkspace[section]),
      setActiveWorkspace: (workspaceId) =>
        set((state) => {
          const mission = missionForWorkspace(state.mock, workspaceId);
          const satellite = selectedSatelliteForMission(state.mock, mission.id);
          const workspace = state.mock.workspaces.find((candidate) => candidate.id === workspaceId);
          return {
            activeWorkspaceId: workspaceId,
            activeMissionId: mission.id,
            selectedSatelliteId: satellite?.id ?? null,
            selectedGraphId: `${mission.id}-graph`,
            activeTabs: { ...state.activeTabs, center: "plot", inspector: "satellite" },
            currentModule: workspace?.module ?? state.currentModule,
            dock: state.dock.map((item) => (String(item.target) === workspaceId ? { ...item, recent: true } : item)),
            breadcrumbs: buildBreadcrumbs(state.mock, workspaceId, mission.id, satellite?.id ?? null),
            terminalHistory: [...state.terminalHistory, `[SYS] Workspace context ${workspace?.name ?? workspaceId}.`].slice(-100),
            notifications: [notification("mission", "WORKSPACE SWITCHED", workspace?.name ?? workspaceId), ...state.notifications].slice(0, 20)
          };
        }),
      selectSatellite: (satelliteId) =>
        set((state) => ({
          selectedSatelliteId: satelliteId,
          selectedGraphId: `${satelliteId}-telemetry`,
          activeTabs: { ...state.activeTabs, inspector: "satellite", center: "graph" },
          breadcrumbs: buildBreadcrumbs(state.mock, state.activeWorkspaceId, state.activeMissionId, satelliteId),
          terminalHistory: [...state.terminalHistory, `[TRK] Satellite selected ${satelliteId}.`].slice(-100)
        })),
      selectGraph: (graphId) => set({ selectedGraphId: graphId }),
      setSearchQuery: (query) => set({ searchQuery: query }),
      setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),
      setCommandPaletteQuery: (query) => set({ commandPaletteQuery: query }),
      pushNotification: (type, title, message, pinned = false) => {
        const item = notification(type, title, message, pinned);
        set((state) => ({ notifications: [item, ...state.notifications].slice(0, 8) }));
        window.setTimeout(() => get().dismissNotification(item.id), 4600);
      },
      dismissNotification: (id) => set((state) => ({ notifications: state.notifications.filter((item) => item.id !== id) })),
      pinNotification: (id) =>
        set((state) => ({ notifications: state.notifications.map((item) => (item.id === id ? { ...item, pinned: !item.pinned } : item)) })),
      openWindow: (id) => get().restoreWindow(id),
      closeWindow: (id) =>
        set((state) => ({
          windows: state.windows.map((window) => (window.id === id ? { ...window, state: "closed", focused: false } : window))
        })),
      minimizeWindow: (id) =>
        set((state) => ({
          windows: state.windows.map((window) => (window.id === id ? { ...window, state: "minimized", focused: false } : window))
        })),
      maximizeWindow: (id) =>
        set((state) => ({
          windows: state.windows.map((window) =>
            window.id === id ? { ...window, state: "maximized", focused: true, zIndex: Math.max(...state.windows.map((item) => item.zIndex)) + 1 } : { ...window, focused: false }
          )
        })),
      restoreWindow: (id) =>
        set((state) => ({
          windows: state.windows.map((window) =>
            window.id === id ? { ...window, state: "open", focused: true, zIndex: Math.max(...state.windows.map((item) => item.zIndex)) + 1 } : { ...window, focused: false }
          )
        })),
      focusWindow: (id) =>
        set((state) => ({
          windows: state.windows.map((window) =>
            window.id === id ? { ...window, focused: true, zIndex: Math.max(...state.windows.map((item) => item.zIndex)) + 1 } : { ...window, focused: false }
          )
        })),
      launchDockItem: (id) => {
        const item = get().dock.find((candidate) => candidate.id === id);
        if (!item) return;
        if (get().mock.workspaces.some((workspace) => workspace.id === item.target)) {
          get().setActiveWorkspace(item.target as AppWorkspaceId);
        } else {
          get().restoreWindow(String(item.target));
        }
      },
      updateModule: (moduleId, patch) =>
        set((state) => ({
          modules: state.modules.map((module) => (module.id === moduleId ? { ...module, ...patch } : module)),
          currentModule: patch.hidden ? state.currentModule : state.modules.find((module) => module.id === moduleId)?.label ?? state.currentModule
        })),
      moveModule: (moduleId, direction) =>
        set((state) => {
          const index = state.modules.findIndex((module) => module.id === moduleId);
          const target = index + direction;
          if (index < 0 || target < 0 || target >= state.modules.length) return state;
          const modules = [...state.modules];
          const [moved] = modules.splice(index, 1);
          modules.splice(target, 0, moved);
          return { modules };
        }),
      restoreModules: () =>
        set((state) => ({
          modules: state.modules.map((module) => ({ ...module, hidden: false, collapsed: false })),
          terminalHistory: [...state.terminalHistory, "[SYS] Module frames restored."].slice(-100)
        })),
      resizeRightPanel: (width) => set({ rightPanelWidth: Math.min(Math.max(width, 190), 360) }),
      updateSetting: (key, value) =>
        set((state) => ({
          settings: { ...state.settings, [key]: value },
          terminalHistory: [...state.terminalHistory, `[CFG] ${String(key).toUpperCase()} ${value ? "ENABLED" : "DISABLED"}.`].slice(-100)
        })),
      setTerminalInput: (value) => set({ terminalInput: value }),
      setWorkspaceDraftName: (value) => set({ workspaceDraftName: value }),
      setWorkspaceRenameDraft: (value) => set({ workspaceRenameDraft: value }),
      clearTerminal: () => set({ terminalHistory: [] }),
      addLog: (line) => set((state) => ({ terminalHistory: [...state.terminalHistory, line].slice(-100) })),
      setCurrentModule: (moduleName) => set({ currentModule: moduleName }),
      switchModule: () =>
        set((state) => {
          const visibleModules = state.modules.filter((module) => !module.hidden);
          const currentIndex = visibleModules.findIndex((module) => module.label === state.currentModule);
          const nextModule = visibleModules[(currentIndex + 1) % visibleModules.length] ?? visibleModules[0];
          return {
            currentModule: nextModule?.label ?? state.currentModule,
            terminalHistory: [...state.terminalHistory, `[SYS] Current module ${nextModule?.label ?? state.currentModule}.`].slice(-100)
          };
        }),
      openContextMenu: (contextMenu) => set({ contextMenu }),
      closeContextMenu: () => set({ contextMenu: null }),
      search: (query) => searchMock(get().mock, query ?? get().commandPaletteQuery ?? get().searchQuery, get().windows, get().dock, get().liveData),
      refreshTelemetry: () =>
        set((state) => ({
          mock: refreshMockTelemetry(state.mock, state.activeMissionId),
          terminalHistory: [...state.terminalHistory, "[TLM] Telemetry frame refreshed."].slice(-100)
        })),
      setLoading: (key, loading) => set((state) => ({ loadingStates: { ...state.loadingStates, [key]: loading } })),
      setLiveData: (liveData) =>
        set((state) => ({
          liveData,
          terminalHistory: [...state.terminalHistory, `[INFO] Live data frame ${liveData.providers.filter((provider) => provider.status === "success").length}/${liveData.providers.length}.`].slice(-100)
        }))
    }),
    {
      name: "sentry.foundation-4.app",
      partialize: (state) => ({
        activeWorkspaceId: state.activeWorkspaceId,
        activeMissionId: state.activeMissionId,
        selectedSatelliteId: state.selectedSatelliteId,
        selectedGraphId: state.selectedGraphId,
        sidebarCollapsed: state.sidebarCollapsed,
        panelVisibility: state.panelVisibility,
        windows: state.windows,
        activeTabs: state.activeTabs,
        modules: state.modules,
        rightPanelWidth: state.rightPanelWidth,
        settings: state.settings,
        currentModule: state.currentModule,
        dock: state.dock,
        breadcrumbs: state.breadcrumbs
      })
    }
  )
);

export const appSectionToWorkspace = sectionToWorkspace;
