"use client";

import { PointerEvent, useRef } from "react";
import { useAppStore } from "@/store/app.store";
import type { AutosaveStatus, Workspace } from "@/types/workspace";

type ModuleState = "READY" | "ONLINE" | "BUSY" | "IDLE" | "OFFLINE" | "ERROR" | "WAITING" | "INITIALIZING";

type ModulePanel = {
  id: string;
  label: string;
  coordinate: string;
  state: ModuleState;
  tone: "green" | "red" | "amber" | "cyan";
  hidden: boolean;
  collapsed: boolean;
  lines: string[];
};

type ReservedModulesProps = {
  autosaveStatus: AutosaveStatus;
  currentModule: string;
  modules: ModulePanel[];
  onMove: (moduleId: string, direction: -1 | 1) => void;
  onResize: (width: number) => void;
  onRestore: () => void;
  onUpdate: (moduleId: string, patch: Partial<ModulePanel>) => void;
  width: number;
  workspace: Workspace | null;
};

const stateSequence: ModuleState[] = ["READY", "ONLINE", "BUSY", "IDLE", "OFFLINE", "ERROR", "WAITING", "INITIALIZING"];

export function ReservedModules({
  autosaveStatus,
  currentModule,
  modules,
  onMove,
  onResize,
  onRestore,
  onUpdate,
  width,
  workspace
}: ReservedModulesProps) {
  const startX = useRef(0);
  const startWidth = useRef(width);
  const openContextMenu = useAppStore((state) => state.openContextMenu);
  const visibleModules = modules.filter((module) => !module.hidden);
  const hiddenCount = modules.length - visibleModules.length;

  const startResize = (event: PointerEvent<HTMLButtonElement>) => {
    startX.current = event.clientX;
    startWidth.current = width;
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const resize = (event: PointerEvent<HTMLButtonElement>) => {
    if (!event.currentTarget.hasPointerCapture(event.pointerId)) {
      return;
    }

    onResize(startWidth.current - (event.clientX - startX.current));
  };

  return (
    <aside className="reserved-modules" aria-label="Reserved modules">
      <button
        aria-label="Resize reserved modules"
        className="module-resize-handle"
        onPointerDown={startResize}
        onPointerMove={resize}
        type="button"
      />
      <div className="module-column-label">
        <span>{workspace ? workspace.status : "RESERVED BUS"}</span>
        <button onClick={onRestore} type="button">RESTORE {hiddenCount ? hiddenCount : ""}</button>
      </div>
      <section className="workspace-meta-frame" aria-label="Workspace metadata">
        <span>{workspace?.name ?? "NO WORKSPACE"}</span>
        <strong>{workspace?.id.slice(0, 13) ?? "ID --"}</strong>
        <small>AUTOSAVE {autosaveStatus} / MODULE {currentModule}</small>
      </section>
      {visibleModules.map((module, index) => (
        <section
          className={`empty-module-frame ${module.tone}`}
          data-collapsed={module.collapsed ? "true" : undefined}
          key={module.id}
          aria-label={`${module.label} module`}
          onContextMenu={(event) => {
            event.preventDefault();
            openContextMenu({ x: event.clientX, y: event.clientY, targetId: module.id, targetType: "panel" });
          }}
        >
          <div className="module-frame-header">
            <span>{module.label}</span>
            <span>{module.id}</span>
          </div>
          <div className="module-frame-controls" aria-label={`${module.label} controls`}>
            <button disabled={index === 0} onClick={() => onMove(module.id, -1)} type="button">UP</button>
            <button disabled={index === visibleModules.length - 1} onClick={() => onMove(module.id, 1)} type="button">DN</button>
            <button onClick={() => onUpdate(module.id, { collapsed: !module.collapsed })} type="button">
              {module.collapsed ? "EXP" : "COL"}
            </button>
            <button onClick={() => onUpdate(module.id, { hidden: true })} type="button">HID</button>
          </div>
          {!module.collapsed ? (
            <div className="module-frame-body">
              <span>{module.coordinate}</span>
              <ul>
                {module.lines.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </div>
          ) : null}
          <div className="module-frame-footer">
            <button
              onClick={() => {
                const currentIndex = stateSequence.indexOf(module.state);
                onUpdate(module.id, { state: stateSequence[(currentIndex + 1) % stateSequence.length] });
              }}
              type="button"
            >
              STATE
            </button>
            <span>{module.state}</span>
          </div>
        </section>
      ))}
    </aside>
  );
}
