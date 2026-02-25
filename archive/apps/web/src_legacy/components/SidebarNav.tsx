import { ActivePanel } from "../types";

type SidebarNavProps = {
  activePanel: ActivePanel;
  onSelect: (panel: ActivePanel) => void;
};

const NAV_ITEMS: Array<{ panel: ActivePanel; label: string; detail: string }> = [
  { panel: "session", label: "Session", detail: "Access and account setup" },
  { panel: "workspace", label: "Workspace", detail: "Estimate editing and pricing" },
  { panel: "catalog", label: "Catalog + Templates", detail: "Reusable items and exports" },
  { panel: "output", label: "Billing + Output", detail: "Simulation and proposal review" },
  { panel: "admin", label: "Admin + Logs", detail: "Reset and operations controls" },
];

export function SidebarNav({ activePanel, onSelect }: SidebarNavProps) {
  return (
    <aside className="sidebar">
      {NAV_ITEMS.map((item) => (
        <button
          key={item.panel}
          className={`nav-btn ${activePanel === item.panel ? "active" : ""}`}
          onClick={() => onSelect(item.panel)}
        >
          <span className="nav-btn-title">{item.label}</span>
          <small>{item.detail}</small>
        </button>
      ))}
    </aside>
  );
}
