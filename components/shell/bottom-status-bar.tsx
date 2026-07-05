import type { AutosaveStatus, Workspace } from "@/types/workspace";

type BottomStatusBarProps = {
  activeSection: string;
  activeWorkspace: Workspace | null;
  autosaveStatus: AutosaveStatus;
  currentModule: string;
  lastSaveAt: string | null;
  onFocusTerminal: () => void;
  onOpenCommandPalette: () => void;
  onSetSection: (section: string) => void;
  onSwitchModule: () => void;
};

export function BottomStatusBar({
  activeSection,
  activeWorkspace,
  autosaveStatus,
  currentModule,
  lastSaveAt,
  onFocusTerminal,
  onOpenCommandPalette,
  onSetSection,
  onSwitchModule
}: BottomStatusBarProps) {
  const statusItems: Array<[string, string, () => void]> = [
    ["WORKSPACE", activeWorkspace?.name ?? "NONE", onOpenCommandPalette],
    ["WORKSPACE ID", activeWorkspace?.id.slice(0, 8) ?? "--", onFocusTerminal],
    ["AUTOSAVE", autosaveStatus, onFocusTerminal],
    ["MODULE", currentModule, onSwitchModule],
    ["LAST SAVE", lastSaveAt ? new Date(lastSaveAt).toLocaleTimeString("en-US", { hour12: false }) : "--:--:--", onFocusTerminal],
    ["SECTION", activeSection.toUpperCase(), () => onSetSection("Home")],
    ["FRAME", "000234", onSwitchModule],
    ["SIGNAL", "82%", onOpenCommandPalette]
  ];

  return (
    <footer className="bottom-status-bar" aria-label="System status">
      {statusItems.map(([label, value, onClick]) => (
        <button className="status-cell" key={label} onClick={onClick} type="button">
          <span>{label}</span>
          <strong>{value}</strong>
        </button>
      ))}
    </footer>
  );
}
