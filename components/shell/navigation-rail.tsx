import {
  Activity,
  Archive,
  BookOpen,
  Camera,
  Clock3,
  Folder,
  Home,
  Microscope,
  Settings
} from "lucide-react";

const navItems = [
  { label: "Home", icon: Home },
  { label: "Research", icon: Microscope },
  { label: "Capture", icon: Camera },
  { label: "Analysis", icon: Activity },
  { label: "Knowledge", icon: BookOpen },
  { label: "Timeline", icon: Clock3 },
  { label: "Projects", icon: Folder },
  { label: "Settings", icon: Settings }
] as const;

type Section = (typeof navItems)[number]["label"];

type NavigationRailProps = {
  activeSection: Section;
  onSelect: (section: Section) => void;
};

export function NavigationRail({ activeSection, onSelect }: NavigationRailProps) {
  return (
    <nav className="navigation-rail" aria-label="Primary">
      <div className="rail-serial">RAIL / 0x01</div>
      <div className="rail-items">
        {navItems.map((item, index) => {
          const Icon = item.icon;
          const isSelected = item.label === activeSection;

          return (
            <button
              aria-label={item.label}
              aria-current={isSelected ? "page" : undefined}
              className="rail-link"
              data-active={isSelected ? "true" : undefined}
              key={item.label}
              onClick={() => onSelect(item.label)}
              title={item.label}
              type="button"
            >
              <Icon aria-hidden size={18} strokeWidth={1.6} />
              <span className="rail-number">{String(index + 1).padStart(2, "0")}</span>
              <strong>{item.label}</strong>
            </button>
          );
        })}
      </div>
      <button className="rail-footer rail-footer-button" onClick={() => onSelect("Projects")} type="button">
        <Archive aria-hidden size={17} strokeWidth={1.5} />
      </button>
    </nav>
  );
}
