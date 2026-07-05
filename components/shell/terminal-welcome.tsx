"use client";

import { FormEvent } from "react";
import { motion } from "framer-motion";
import { useAppStore } from "@/store/app.store";
import { WorkspaceView } from "@/components/workspaces/workspace-views";
import type { AppSection } from "@/types/app";
import type { Workspace } from "@/types/workspace";

type SettingsState = {
  echoCommands: boolean;
  compactConsole: boolean;
  preserveLayout: boolean;
};

type TerminalWelcomeProps = {
  activeSection: string;
  activeWorkspace: Workspace | null;
  compactConsole: boolean;
  onCreateWorkspace: (name?: string) => void;
  onDeleteWorkspace: (workspaceId: string) => void;
  onDuplicateWorkspace: (workspaceId: string) => void;
  onFocusTerminal: () => void;
  onOpenWorkspace: (workspaceId: string) => void;
  onRenameWorkspace: (workspaceId: string, name: string) => void;
  onRunCommand: (command: string) => void;
  onSwitchModule: () => void;
  onUpdateSetting: <K extends keyof SettingsState>(key: K, value: SettingsState[K]) => void;
  recentWorkspaces: Workspace[];
  settings: SettingsState;
  terminalHistory: string[];
  workspaces: Workspace[];
};

export function TerminalWelcome({
  activeSection,
  activeWorkspace,
  compactConsole,
  onCreateWorkspace,
  onRunCommand,
  onUpdateSetting,
  settings,
  terminalHistory
}: TerminalWelcomeProps) {
  const command = useAppStore((state) => state.terminalInput);
  const setCommand = useAppStore((state) => state.setTerminalInput);

  const submitCommand = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onRunCommand(command);
    setCommand("");
  };

  return (
    <motion.div
      animate={{ opacity: 1, y: 0 }}
      className="terminal-stage"
      initial={{ opacity: 0.92, y: 3 }}
      transition={{ duration: 0.16, ease: "easeOut" }}
    >
      <WorkspaceView
        activeSection={activeSection as AppSection}
        activeWorkspace={activeWorkspace}
        onCreateWorkspace={onCreateWorkspace}
        onRunCommand={onRunCommand}
        onUpdateSetting={onUpdateSetting}
        settings={settings}
        terminalHistory={terminalHistory}
      />
      <section className={`system-console ${compactConsole ? "compact" : ""}`} aria-label="System console">
        <header>
          <span>SYSTEM CONSOLE</span>
          <span>LOG-01</span>
        </header>
        <div className="console-lines">
          {terminalHistory.map((line, index) => (
            <p key={`${line}-${index}`}>
              <time>{new Date().toLocaleTimeString("en-US", { hour12: false })}</time>
              <span>{line.startsWith(">") ? "[IN]" : line.slice(0, 5)}</span>
              {line.startsWith("[") ? line.slice(5).trim() : line}
            </p>
          ))}
        </div>
        <form className="terminal-command-row" onSubmit={submitCommand}>
          <span>&gt;</span>
          <input
            aria-label="Terminal command"
            autoComplete="off"
            onChange={(event) => setCommand(event.target.value)}
            placeholder="Enter command..."
            value={command}
          />
        </form>
      </section>
    </motion.div>
  );
}
