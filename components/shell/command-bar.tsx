import type { Workspace } from "@/types/workspace";

const statusLights = [
  { label: "SYS", tone: "green" },
  { label: "TRK", tone: "cyan" },
  { label: "ALR", tone: "orange" },
  { label: "NET", tone: "gray" }
];

type CommandBarProps = {
  activeSection: string;
  activeWorkspace: Workspace | null;
  onFocusTerminal: () => void;
  onOpenCommandPalette: () => void;
  onSetSection: (section: string) => void;
  onSwitchModule: () => void;
};

export function CommandBar({
  activeSection,
  activeWorkspace,
  onFocusTerminal,
  onOpenCommandPalette,
  onSetSection,
  onSwitchModule
}: CommandBarProps) {
  return (
    <header className="command-bar">
      <button className="brand-block command-hotspot" onClick={onOpenCommandPalette} type="button">
        <div className="brand-mark" aria-hidden>
          <span />
          <span />
        </div>
        <div>
          <p className="micro-label">AEROSPACE VISUALIZATION TERMINAL</p>
          <div className="brand-line">
            <h1>SENTRY</h1>
            <span>v0.2</span>
          </div>
        </div>
      </button>

      <button className="workspace-indicator command-hotspot" onClick={onFocusTerminal} type="button">
        <span className="micro-label">{activeSection.toUpperCase()} FRAME</span>
        <strong>{activeWorkspace?.name ?? "NO WORKSPACE"}</strong>
        <span className="hex-label">J2000 / 0x53-45-4E</span>
      </button>

      <div className="system-strip" aria-label="System identifiers">
        <button onClick={() => onSetSection("Home")} type="button">NODE A7</button>
        <button onClick={() => onSetSection("Analysis")} type="button">SECTOR 04-19</button>
        <button onClick={onSwitchModule} type="button">FRAME 000234</button>
      </div>

      <div className="status-lights" aria-label="System status lights">
        {statusLights.map((light, index) => (
          <button
            className="status-light-group"
            key={light.label}
            onClick={index % 2 === 0 ? onFocusTerminal : onSwitchModule}
            type="button"
          >
            <span className={`status-led ${light.tone}`} />
            <span>{light.label}</span>
          </button>
        ))}
      </div>
    </header>
  );
}
