"use client";

import { type CSSProperties, useCallback, useEffect, useMemo, useRef } from "react";
import { useWorkspace } from "@/hooks/useWorkspace";
import { useLiveDataEngine } from "@/hooks/useLiveDataEngine";
import { SentryMotion } from "@/components/motion/SentryMotion";
import { useAppStore } from "@/store/app.store";
import { BottomStatusBar } from "@/components/shell/bottom-status-bar";
import { CommandBar } from "@/components/shell/command-bar";
import { NavigationRail } from "@/components/shell/navigation-rail";
import { ReservedModules } from "@/components/shell/reserved-modules";
import { TerminalWelcome } from "@/components/shell/terminal-welcome";
import type { AppSection, AppWorkspaceId, ModulePanel, SettingsState } from "@/types/app";
import type { WorkspaceSettings } from "@/types/workspace";

const moduleStateSequence: ModulePanel["state"][] = ["READY", "ONLINE", "BUSY", "IDLE", "OFFLINE", "ERROR", "WAITING", "INITIALIZING"];

function sectionForWorkspace(workspaceId: AppWorkspaceId, fallback: AppSection = "Home") {
  const workspace = useAppStore.getState().mock.workspaces.find((candidate) => candidate.id === workspaceId);
  return workspace?.section ?? fallback;
}

function settingsFromShell(modules: ModulePanel[], rightPanelWidth: number, settings: SettingsState, activeSection: AppSection): WorkspaceSettings {
  return {
    layout: {
      rightPanelWidth,
      moduleOrder: modules.map((module) => module.id),
      hiddenModuleIds: modules.filter((module) => module.hidden).map((module) => module.id),
      collapsedModuleIds: modules.filter((module) => module.collapsed).map((module) => module.id)
    },
    shell: {
      activeSection,
      compactConsole: settings.compactConsole,
      echoCommands: settings.echoCommands,
      preserveLayout: settings.preserveLayout
    }
  };
}

export function SentryShell() {
  const workspaceEngine = useWorkspace();
  const liveQuery = useLiveDataEngine();
  const {
    activeWorkspace,
    autosaveStatus,
    autosaveWorkspace,
    currentModule: persistedCurrentModule,
    lastSaveAt,
    recentWorkspaces,
    workspaces
  } = workspaceEngine;

  const activeWorkspaceId = useAppStore((state) => state.activeWorkspaceId);
  const activeMissionId = useAppStore((state) => state.activeMissionId);
  const selectedSatelliteId = useAppStore((state) => state.selectedSatelliteId);
  const activeSection = useAppStore((state) => sectionForWorkspace(state.activeWorkspaceId));
  const modules = useAppStore((state) => state.modules);
  const rightPanelWidth = useAppStore((state) => state.rightPanelWidth);
  const settings = useAppStore((state) => state.settings);
  const terminalHistory = useAppStore((state) => state.terminalHistory);
  const currentModule = useAppStore((state) => state.currentModule);
  const commandPaletteOpen = useAppStore((state) => state.commandPaletteOpen);
  const commandPaletteQuery = useAppStore((state) => state.commandPaletteQuery);
  const notifications = useAppStore((state) => state.notifications);
  const contextMenu = useAppStore((state) => state.contextMenu);
  const dock = useAppStore((state) => state.dock);
  const mock = useAppStore((state) => state.mock);
  const liveData = useAppStore((state) => state.liveData);
  const breadcrumbs = useAppStore((state) => state.breadcrumbs);
  const windows = useAppStore((state) => state.windows);
  const setActiveSection = useAppStore((state) => state.setActiveSection);
  const setActiveWorkspace = useAppStore((state) => state.setActiveWorkspace);
  const setCommandPaletteOpen = useAppStore((state) => state.setCommandPaletteOpen);
  const setCommandPaletteQuery = useAppStore((state) => state.setCommandPaletteQuery);
  const addLog = useAppStore((state) => state.addLog);
  const clearTerminal = useAppStore((state) => state.clearTerminal);
  const updateModule = useAppStore((state) => state.updateModule);
  const moveModule = useAppStore((state) => state.moveModule);
  const restoreModules = useAppStore((state) => state.restoreModules);
  const resizeRightPanel = useAppStore((state) => state.resizeRightPanel);
  const updateSetting = useAppStore((state) => state.updateSetting);
  const switchModule = useAppStore((state) => state.switchModule);
  const setCurrentModule = useAppStore((state) => state.setCurrentModule);
  const search = useAppStore((state) => state.search);
  const pushNotification = useAppStore((state) => state.pushNotification);
  const dismissNotification = useAppStore((state) => state.dismissNotification);
  const pinNotification = useAppStore((state) => state.pinNotification);
  const focusWindow = useAppStore((state) => state.focusWindow);
  const closeWindow = useAppStore((state) => state.closeWindow);
  const minimizeWindow = useAppStore((state) => state.minimizeWindow);
  const maximizeWindow = useAppStore((state) => state.maximizeWindow);
  const restoreWindow = useAppStore((state) => state.restoreWindow);
  const launchDockItem = useAppStore((state) => state.launchDockItem);
  const closeContextMenu = useAppStore((state) => state.closeContextMenu);
  const refreshTelemetry = useAppStore((state) => state.refreshTelemetry);
  const setLoading = useAppStore((state) => state.setLoading);
  const lastAutosaveKey = useRef("");

  const activeMission = mock.missions.find((mission) => mission.id === activeMissionId);
  const telemetryPacket = mock.byMission[activeMissionId];
  const liveSatellites = liveData?.satellites.length ? liveData.satellites : null;
  const selectedSatellite =
    liveSatellites?.find((satellite) => satellite.id === selectedSatelliteId) ??
    liveSatellites?.[0] ??
    telemetryPacket?.satellites.find((satellite) => satellite.id === selectedSatelliteId);
  const liveProviderSummary = liveData?.providers.map((provider) => `${provider.label}:${provider.status.toUpperCase()}`).join(" / ");

  const workspaceSettings = useMemo(
    () => settingsFromShell(modules, rightPanelWidth, settings, activeSection),
    [activeSection, modules, rightPanelWidth, settings]
  );

  useEffect(() => {
    const handle = window.setInterval(refreshTelemetry, 12000);
    return () => window.clearInterval(handle);
  }, [refreshTelemetry]);

  useEffect(() => {
    if (!activeWorkspace?.settings.shell.activeSection) {
      return;
    }

    setActiveSection(activeWorkspace.settings.shell.activeSection as AppSection);
  }, [activeWorkspace?.id, activeWorkspace?.settings.shell.activeSection, setActiveSection]);

  useEffect(() => {
    if (persistedCurrentModule !== currentModule) {
      workspaceEngine.setCurrentModule(currentModule);
    }
  }, [currentModule, persistedCurrentModule, workspaceEngine]);

  useEffect(() => {
    if (!activeWorkspace?.id || !settings.preserveLayout) {
      return;
    }

    const key = JSON.stringify({ id: activeWorkspace.id, workspaceSettings });
    if (key === lastAutosaveKey.current) {
      return;
    }

    lastAutosaveKey.current = key;
    const handle = window.setTimeout(() => {
      setLoading("autosave", true);
      void autosaveWorkspace(workspaceSettings).then((workspace) => {
        setLoading("autosave", false);
        if (workspace) {
          addLog(`[SAVE] Autosave completed ${workspace.name}.`);
          pushNotification("success", "AUTOSAVE", `${workspace.name} persisted.`);
        }
      });
    }, 800);

    return () => window.clearTimeout(handle);
  }, [activeWorkspace?.id, addLog, autosaveWorkspace, pushNotification, setLoading, settings.preserveLayout, workspaceSettings]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      if ((event.ctrlKey || event.metaKey) && key === "k") {
        event.preventDefault();
        setCommandPaletteOpen(!useAppStore.getState().commandPaletteOpen);
      }

      if ((event.ctrlKey || event.metaKey) && key === "b") {
        event.preventDefault();
        setActiveSection(activeSection === "Projects" ? "Home" : "Projects");
      }

      if ((event.ctrlKey || event.metaKey) && key === "/") {
        event.preventDefault();
        setCommandPaletteOpen(true);
        setCommandPaletteQuery("help");
      }

      if (event.key === "Escape") {
        setCommandPaletteOpen(false);
        closeContextMenu();
      }

      if (event.key === "Delete" && notifications[0] && !notifications[0].pinned) {
        dismissNotification(notifications[0].id);
      }

      if (event.key === "Tab" && !event.shiftKey) {
        focusWindow("orbital-plot");
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [
    activeSection,
    closeContextMenu,
    dismissNotification,
    focusWindow,
    notifications,
    setActiveSection,
    setCommandPaletteOpen,
    setCommandPaletteQuery
  ]);

  const focusTerminal = useCallback(() => {
    restoreWindow("system-console");
    const terminalInput = document.querySelector<HTMLInputElement>(".terminal-command-row input");
    terminalInput?.focus();
  }, [restoreWindow]);

  const createAndOpenWorkspace = useCallback(
    async (name?: string) => {
      const workspace = await workspaceEngine.createWorkspace({ name });
      addLog(`[WS] Workspace created ${workspace.name}.`);
      addLog(`[WS] Workspace opened ${workspace.id}.`);
      pushNotification("success", "WORKSPACE CREATED", workspace.name);
    },
    [addLog, pushNotification, workspaceEngine]
  );

  const openWorkspace = useCallback(
    async (workspaceId: string) => {
      const workspace = await workspaceEngine.openWorkspace(workspaceId);
      if (workspace) {
        addLog(`[WS] Workspace opened ${workspace.name}.`);
        pushNotification("mission", "WORKSPACE OPENED", workspace.name);
      }
    },
    [addLog, pushNotification, workspaceEngine]
  );

  const renameWorkspace = useCallback(
    async (workspaceId: string, name: string) => {
      const workspace = await workspaceEngine.renameWorkspace(workspaceId, name);
      if (workspace) {
        addLog(`[WS] Workspace renamed ${workspace.name}.`);
        pushNotification("success", "WORKSPACE RENAMED", workspace.name);
      }
    },
    [addLog, pushNotification, workspaceEngine]
  );

  const deleteWorkspace = useCallback(
    async (workspaceId: string) => {
      const workspace = await workspaceEngine.deleteWorkspace(workspaceId);
      if (workspace) {
        addLog(`[WS] Workspace deleted ${workspace.name}.`);
        pushNotification("warning", "WORKSPACE DELETED", workspace.name);
      }
    },
    [addLog, pushNotification, workspaceEngine]
  );

  const duplicateWorkspace = useCallback(
    async (workspaceId: string) => {
      const workspace = await workspaceEngine.duplicateWorkspace(workspaceId);
      if (workspace) {
        addLog(`[WS] Workspace duplicated ${workspace.name}.`);
        pushNotification("success", "WORKSPACE DUPLICATED", workspace.name);
      }
    },
    [addLog, pushNotification, workspaceEngine]
  );

  const switchActiveModule = useCallback(() => {
    switchModule();
    const nextModule = useAppStore.getState().currentModule;
    setCurrentModule(nextModule);
    pushNotification("system", "MODULE FOCUS", nextModule);
  }, [pushNotification, setCurrentModule, switchModule]);

  const runTerminalCommand = useCallback(
    async (rawCommand: string) => {
      const command = rawCommand.trim();
      if (!command) return;
      const normalized = command.toLowerCase();

      if (settings.echoCommands) {
        addLog(`> ${command}`);
      }

      await workspaceEngine.recordCommand(command);
      addLog(`[CMD] Command executed ${command}.`);

      if (normalized === "help") {
        addLog("[CMD] workspace create/list/open/rename/delete/duplicate, clear, status, settings, focus terminal, switch module, telemetry refresh, providers");
        return;
      }
      if (normalized === "clear") {
        clearTerminal();
        return;
      }
      if (normalized === "status") {
        addLog(`[SYS] WORKSPACE=${activeWorkspace?.name ?? "NONE"} MISSION=${activeMission?.name ?? "NONE"} SAT=${selectedSatellite?.name ?? "NONE"} MODULE=${currentModule}`);
        return;
      }
      if (normalized === "providers") {
        addLog(`[INFO] ${liveProviderSummary ?? "No live providers have reported yet."}`);
        return;
      }
      if (normalized === "telemetry refresh") {
        void liveQuery.refetch();
        refreshTelemetry();
        return;
      }
      if (normalized === "workspace create") {
        await createAndOpenWorkspace();
        return;
      }
      if (normalized.startsWith("workspace create ")) {
        await createAndOpenWorkspace(command.slice("workspace create ".length));
        return;
      }
      if (normalized === "workspace list") {
        addLog(workspaces.length ? `[WS] ${workspaces.map((workspace) => workspace.name).join(" / ")}` : "[WS] No workspaces available.");
        return;
      }
      if (normalized.startsWith("workspace open ")) {
        const query = normalized.slice("workspace open ".length);
        const workspace = workspaces.find((candidate) => candidate.name.toLowerCase().includes(query));
        if (workspace) await openWorkspace(workspace.id);
        else addLog("[ERR] Workspace not found.");
        return;
      }
      if (normalized.startsWith("workspace rename ")) {
        if (!activeWorkspace) {
          addLog("[ERR] No active workspace.");
          return;
        }
        await renameWorkspace(activeWorkspace.id, command.slice("workspace rename ".length));
        return;
      }
      if (normalized.startsWith("workspace delete ")) {
        const query = normalized.slice("workspace delete ".length);
        const workspace = workspaces.find((candidate) => candidate.name.toLowerCase().includes(query));
        if (workspace) await deleteWorkspace(workspace.id);
        else addLog("[ERR] Workspace not found.");
        return;
      }
      if (normalized === "workspace delete" && activeWorkspace) {
        await deleteWorkspace(activeWorkspace.id);
        return;
      }
      if (normalized === "workspace duplicate" && activeWorkspace) {
        await duplicateWorkspace(activeWorkspace.id);
        return;
      }
      if (normalized === "settings") {
        setActiveSection("Settings");
        return;
      }
      if (normalized === "focus terminal") {
        focusTerminal();
        return;
      }
      if (normalized === "switch module") {
        switchActiveModule();
        return;
      }

      const match = search(command)[0];
      if (match?.kind === "workspace") {
        setActiveWorkspace(match.id as AppWorkspaceId);
        return;
      }

      addLog("[ERR] Unknown command. Type help.");
    },
    [
      activeMission?.name,
      activeWorkspace,
      addLog,
      clearTerminal,
      createAndOpenWorkspace,
      currentModule,
      deleteWorkspace,
      duplicateWorkspace,
      focusTerminal,
      liveProviderSummary,
      liveQuery,
      openWorkspace,
      refreshTelemetry,
      renameWorkspace,
      search,
      selectedSatellite?.name,
      setActiveSection,
      setActiveWorkspace,
      settings.echoCommands,
      switchActiveModule,
      workspaceEngine,
      workspaces
    ]
  );

  const modulesWithMetadata = useMemo(
    () =>
      modules.map((module) => {
        if (module.id === "M-01") {
          return {
            ...module,
            lines: [
              `MISSION        ${activeMission?.name ?? "NONE"}`,
              `WORKSPACE      ${activeWorkspace?.name ?? mock.workspaces.find((workspace) => workspace.id === activeWorkspaceId)?.name}`,
              `SATELLITE      ${selectedSatellite?.name ?? "NONE"}`,
              `STATUS         ${selectedSatellite?.status.toUpperCase() ?? liveQuery.status.toUpperCase()}`
            ]
          };
        }
        if (module.id === "Q-04") {
          return {
            ...module,
            lines: [
              `EVENTS         ${liveData?.timeline.length ?? telemetryPacket?.events.length ?? 0}`,
              `ALERTS         ${liveData?.alerts.length ?? telemetryPacket?.alerts.length ?? 0}`,
              `WINDOWS        ${windows.filter((window) => window.state !== "closed").length}`,
              `PROVIDERS      ${liveData?.providers.filter((provider) => provider.status === "success").length ?? 0}/${liveData?.providers.length ?? 0}`
            ]
          };
        }
        if (module.id === "R-12") {
          return {
            ...module,
            lines: [
              `SIGNAL         ${selectedSatellite?.signal ?? "--"}%`,
              `ALTITUDE       ${selectedSatellite?.altitudeKm ? Math.round(selectedSatellite.altitudeKm) : "--"} KM`,
              `VELOCITY       ${selectedSatellite?.velocityKps ? selectedSatellite.velocityKps.toFixed(2) : "--"} KPS`,
              `CHARTS         ${liveData?.charts.length ?? 0}`
            ]
          };
        }
        return {
          ...module,
          lines: [
            `BREADCRUMB      ${breadcrumbs[0] ?? "--"}`,
            `MISSION PHASE   ${activeMission?.phase ?? "--"}`,
            `ORBIT           ${activeMission?.orbit ?? "--"}`,
            `LIVE UPDATE     ${liveData?.updatedAt ? new Date(liveData.updatedAt).toLocaleTimeString("en-US", { hour12: false }) : "--:--:--"}`
          ]
        };
      }),
    [activeMission, activeWorkspace, activeWorkspaceId, breadcrumbs, liveData, liveQuery.status, mock.workspaces, modules, selectedSatellite, telemetryPacket, windows]
  );

  const paletteActions = useMemo(() => {
    const workspaceCommands = mock.workspaces.map((workspace) => ({
      id: `workspace-${workspace.id}`,
      label: `Switch ${workspace.name}`,
      detail: `workspace / ${workspace.code}`,
      run: () => setActiveWorkspace(workspace.id)
    }));
    const searchResults = search(commandPaletteQuery).map((result) => ({
      id: `result-${result.kind}-${result.id}`,
      label: result.title,
      detail: `${result.kind} / ${result.detail}`,
      run: () => {
        if (result.kind === "workspace") setActiveWorkspace(result.id as AppWorkspaceId);
        if (result.kind === "satellite") useAppStore.getState().selectSatellite(result.id);
        if (result.kind === "panel") restoreWindow(result.id);
      }
    }));

    return [
      { id: "create", label: "Create Workspace", detail: "workspace create", run: () => void createAndOpenWorkspace() },
      {
        id: "rename",
        label: "Rename Workspace",
        detail: "workspace rename",
        run: () => (activeWorkspace ? void renameWorkspace(activeWorkspace.id, `${activeWorkspace.name} RENAMED`) : addLog("[ERR] No active workspace."))
      },
      {
        id: "delete",
        label: "Delete Workspace",
        detail: "workspace delete",
        run: () => (activeWorkspace ? void deleteWorkspace(activeWorkspace.id) : addLog("[ERR] No active workspace."))
      },
      { id: "settings", label: "Open Settings", detail: "settings", run: () => setActiveSection("Settings") },
      { id: "terminal", label: "Focus Terminal", detail: "focus terminal", run: focusTerminal },
      { id: "module", label: "Switch Module", detail: "switch module", run: switchActiveModule },
      { id: "telemetry", label: "Refresh Telemetry", detail: "live providers", run: () => void liveQuery.refetch() },
      ...workspaceCommands,
      ...searchResults,
      ...recentWorkspaces.map((workspace) => ({
        id: `recent-${workspace.id}`,
        label: `Open Recent ${workspace.name}`,
        detail: "recent workspace",
        run: () => void openWorkspace(workspace.id)
      }))
    ];
  }, [
    activeWorkspace,
    addLog,
    commandPaletteQuery,
    createAndOpenWorkspace,
    deleteWorkspace,
    focusTerminal,
    liveQuery,
    mock.workspaces,
    openWorkspace,
    recentWorkspaces,
    renameWorkspace,
    restoreWindow,
    search,
    setActiveSection,
    setActiveWorkspace,
    switchActiveModule
  ]);

  const filteredPaletteActions = paletteActions.filter((action) => {
    const query = commandPaletteQuery.toLowerCase();
    return `${action.label} ${action.detail}`.toLowerCase().includes(query);
  });

  const runPaletteAction = (run: () => void) => {
    run();
    setCommandPaletteOpen(false);
    setCommandPaletteQuery("");
  };

  const cycleModuleState = (moduleId: string) => {
    const targetModule = modules.find((candidate) => candidate.id === moduleId);
    if (!targetModule) return;
    const index = moduleStateSequence.indexOf(targetModule.state);
    updateModule(moduleId, { state: moduleStateSequence[(index + 1) % moduleStateSequence.length] });
  };

  return (
    <main className="sentry-screen" onClick={closeContextMenu}>
      <div className="screen-noise" aria-hidden />
      <SentryMotion
        activeSection={activeSection}
        commandPaletteOpen={commandPaletteOpen}
        notificationCount={notifications.length}
      />
      <div className="sentry-os">
        <div
          className="sentry-window"
          style={{ "--right-panel-width": `${rightPanelWidth}px` } as CSSProperties}
        >
          <CommandBar
            activeSection={activeSection}
            activeWorkspace={activeWorkspace}
            onFocusTerminal={focusTerminal}
            onOpenCommandPalette={() => setCommandPaletteOpen(true)}
            onSetSection={(section) => setActiveSection(section as AppSection)}
            onSwitchModule={switchActiveModule}
          />
          <div className="sentry-body">
            <NavigationRail activeSection={activeSection} onSelect={setActiveSection} />
            <section className="sentry-workspace" aria-label="Workspace" onClick={() => focusWindow("orbital-plot")}>
              <div className="grid-coordinates" aria-hidden>
                {breadcrumbs.join(" / ")} / GRID J2000
              </div>
              <TerminalWelcome
                activeSection={activeSection}
                activeWorkspace={activeWorkspace}
                compactConsole={settings.compactConsole}
                onCreateWorkspace={createAndOpenWorkspace}
                onDeleteWorkspace={deleteWorkspace}
                onDuplicateWorkspace={duplicateWorkspace}
                onFocusTerminal={focusTerminal}
                onOpenWorkspace={openWorkspace}
                onRenameWorkspace={renameWorkspace}
                onRunCommand={runTerminalCommand}
                onSwitchModule={switchActiveModule}
                onUpdateSetting={updateSetting}
                recentWorkspaces={recentWorkspaces}
                settings={settings}
                terminalHistory={terminalHistory}
                workspaces={workspaces}
              />
            </section>
            <ReservedModules
              autosaveStatus={autosaveStatus}
              currentModule={currentModule}
              modules={modulesWithMetadata}
              onMove={moveModule}
              onResize={resizeRightPanel}
              onRestore={restoreModules}
              onUpdate={(moduleId, patch) => {
                updateModule(moduleId, patch);
                if (patch.state) setCurrentModule(modules.find((module) => module.id === moduleId)?.label ?? currentModule);
              }}
              width={rightPanelWidth}
              workspace={activeWorkspace}
            />
          </div>
        </div>

        <div className="sentry-dock" aria-label="Application dock">
          {dock.map((item) => (
            <button key={item.id} onClick={() => launchDockItem(item.id)} type="button">
              <span>{item.label}</span>
              {item.recent ? <i /> : null}
            </button>
          ))}
        </div>

        <BottomStatusBar
          activeSection={activeSection}
          activeWorkspace={activeWorkspace}
          autosaveStatus={autosaveStatus}
          currentModule={currentModule}
          lastSaveAt={lastSaveAt}
          onFocusTerminal={focusTerminal}
          onOpenCommandPalette={() => setCommandPaletteOpen(true)}
          onSetSection={(section) => setActiveSection(section as AppSection)}
          onSwitchModule={switchActiveModule}
        />
      </div>

      <div className="notification-stack" aria-label="Application notifications">
        {notifications.slice(0, 4).map((item) => (
          <section
            className={`sentry-notification ${item.type}`}
            key={item.id}
            onContextMenu={(event) => {
              event.preventDefault();
              useAppStore.getState().openContextMenu({ x: event.clientX, y: event.clientY, targetId: item.id, targetType: "notification" });
            }}
          >
            <button onClick={() => pinNotification(item.id)} type="button">{item.pinned ? "PIN" : "HLD"}</button>
            <div>
              <span>{item.title}</span>
              <p>{item.message}</p>
            </div>
            {!item.pinned ? <button onClick={() => dismissNotification(item.id)} type="button">CLR</button> : null}
          </section>
        ))}
      </div>

      {commandPaletteOpen ? (
        <div className="command-palette-backdrop" role="presentation" onMouseDown={() => setCommandPaletteOpen(false)}>
          <section
            aria-label="Command palette"
            className="command-palette"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <header>
              <span>COMMAND PALETTE</span>
              <span>CTRL+K / SEARCH / PANELS</span>
            </header>
            <input
              autoFocus
              onChange={(event) => setCommandPaletteQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "ArrowDown") {
                  event.preventDefault();
                  document.querySelector<HTMLButtonElement>(".palette-results button")?.focus();
                }
                if (event.key === "Enter" && filteredPaletteActions[0]) {
                  runPaletteAction(filteredPaletteActions[0].run);
                }
              }}
              placeholder="Search workspaces, commands, panels, missions..."
              value={commandPaletteQuery}
            />
            <div className="palette-results">
              {filteredPaletteActions.slice(0, 12).map((action) => (
                <button key={action.id} onClick={() => runPaletteAction(action.run)} type="button">
                  <span>{action.label}</span>
                  <strong>{action.detail}</strong>
                </button>
              ))}
              {!filteredPaletteActions.length ? <p>NO COMMANDS MATCH QUERY</p> : null}
            </div>
          </section>
        </div>
      ) : null}

      {contextMenu ? (
        <section className="sentry-context-menu" onClick={(event) => event.stopPropagation()} style={{ left: contextMenu.x, top: contextMenu.y }}>
          <button onClick={() => restoreWindow(contextMenu.targetId)} type="button">OPEN</button>
          <button onClick={() => minimizeWindow(contextMenu.targetId)} type="button">MINIMIZE</button>
          <button onClick={() => maximizeWindow(contextMenu.targetId)} type="button">MAXIMIZE</button>
          <button onClick={() => closeWindow(contextMenu.targetId)} type="button">CLOSE</button>
          <button onClick={cycleModuleState.bind(null, contextMenu.targetId)} type="button">CYCLE STATE</button>
        </section>
      ) : null}
    </main>
  );
}
