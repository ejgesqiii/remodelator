import { TemplateSummary } from "../../types";

type TemplateSectionProps = {
  busy: boolean;
  hasSelectedEstimate: boolean;
  templateName: string;
  setTemplateName: (value: string) => void;
  onSaveTemplate: () => void;
  selectedTemplateId: string;
  setSelectedTemplateId: (value: string) => void;
  templates: TemplateSummary[];
  onApplyTemplate: () => void;
};

export function TemplateSection(props: TemplateSectionProps) {
  return (
    <>
      <h3>Template Save/Apply</h3>
      <div className="inline-grid">
        <input value={props.templateName} onChange={(e) => props.setTemplateName(e.target.value)} placeholder="Template name" />
        <button disabled={props.busy || !props.hasSelectedEstimate} onClick={props.onSaveTemplate}>
          Save from Selected Estimate
        </button>
      </div>

      <div className="inline-grid">
        <select value={props.selectedTemplateId} onChange={(e) => props.setSelectedTemplateId(e.target.value)}>
          <option value="">Select template</option>
          {props.templates.map((template) => (
            <option key={template.id} value={template.id}>
              {`${template.name} (${template.line_item_count} lines)`}
            </option>
          ))}
        </select>
        <button disabled={props.busy || !props.hasSelectedEstimate || !props.selectedTemplateId} onClick={props.onApplyTemplate}>
          Apply to Selected Estimate
        </button>
      </div>
      <ul className="list compact">
        {props.templates.map((template) => (
          <li key={template.id}>
            <button className={template.id === props.selectedTemplateId ? "selected" : ""} onClick={() => props.setSelectedTemplateId(template.id)}>
              <span>{template.name}</span>
              <small>{`${template.line_item_count} lines`}</small>
            </button>
          </li>
        ))}
        {!props.templates.length && <li className="empty-state">No templates yet.</li>}
      </ul>
    </>
  );
}
