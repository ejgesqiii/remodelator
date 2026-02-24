import { ComponentProps } from "react";

import { AdminPanel } from "../panels/AdminPanel";
import { CatalogPanel } from "../panels/CatalogPanel";
import { OutputPanel } from "../panels/OutputPanel";
import { SessionPanel } from "../panels/SessionPanel";
import { WorkspacePanel } from "../panels/WorkspacePanel";
import { ActivePanel } from "../types";

type MainPanelsProps = {
  activePanel: ActivePanel;
  sessionPanelProps: ComponentProps<typeof SessionPanel>;
  workspacePanelProps: ComponentProps<typeof WorkspacePanel>;
  catalogPanelProps: ComponentProps<typeof CatalogPanel>;
  outputPanelProps: ComponentProps<typeof OutputPanel>;
  adminPanelProps: ComponentProps<typeof AdminPanel>;
};

export function MainPanels(props: MainPanelsProps) {
  return (
    <main className="content">
      {props.activePanel === "session" && <SessionPanel {...props.sessionPanelProps} />}
      {props.activePanel === "workspace" && <WorkspacePanel {...props.workspacePanelProps} />}
      {props.activePanel === "catalog" && <CatalogPanel {...props.catalogPanelProps} />}
      {props.activePanel === "output" && <OutputPanel {...props.outputPanelProps} />}
      {props.activePanel === "admin" && <AdminPanel {...props.adminPanelProps} />}
    </main>
  );
}
