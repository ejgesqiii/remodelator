import { AppHero } from "./components/AppHero";
import { MainPanels } from "./components/MainPanels";
import { SidebarNav } from "./components/SidebarNav";
import { useAppController } from "./lib/useAppController";

export function App() {
  const controller = useAppController();

  return (
    <div className="page">
      <AppHero {...controller.heroProps} />

      <div className="shell">
        <SidebarNav activePanel={controller.activePanel} onSelect={controller.setActivePanel} />
        <MainPanels
          activePanel={controller.activePanel}
          sessionPanelProps={controller.sessionPanelProps}
          workspacePanelProps={controller.workspacePanelProps}
          catalogPanelProps={controller.catalogPanelProps}
          outputPanelProps={controller.outputPanelProps}
          adminPanelProps={controller.adminPanelProps}
        />
      </div>
    </div>
  );
}
