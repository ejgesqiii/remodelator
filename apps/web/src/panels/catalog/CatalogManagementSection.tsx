import { FormEvent } from "react";

import { CatalogItem, CatalogTreeNode } from "../../types";

type CatalogManagementSectionProps = {
  busy: boolean;
  isSessionReady: boolean;
  hasSelectedEstimate: boolean;
  catalogQuery: string;
  setCatalogQuery: (value: string) => void;
  onCatalogSearch: (event: FormEvent<HTMLFormElement>) => void | Promise<void>;
  onReloadCatalogTree: () => void;
  catalogUpsertName: string;
  setCatalogUpsertName: (value: string) => void;
  catalogUpsertPrice: string;
  setCatalogUpsertPrice: (value: string) => void;
  catalogUpsertLabor: string;
  setCatalogUpsertLabor: (value: string) => void;
  catalogUpsertDescription: string;
  setCatalogUpsertDescription: (value: string) => void;
  onCatalogUpsert: () => void;
  catalogImportJson: string;
  setCatalogImportJson: (value: string) => void;
  onCatalogImport: () => void;
  catalogOpsOutput: string;
  catalogResults: CatalogItem[];
  onAddCatalogItem: (item: CatalogItem) => void;
  catalogTree: CatalogTreeNode[];
};

export function CatalogManagementSection(props: CatalogManagementSectionProps) {
  return (
    <div className="stack">
      <h3>Catalog Search</h3>
      <form onSubmit={props.onCatalogSearch} className="inline-grid">
        <input value={props.catalogQuery} onChange={(e) => props.setCatalogQuery(e.target.value)} placeholder="Search catalog items" />
        <button disabled={props.busy}>Search</button>
      </form>
      <div className="toolbar">
        <button disabled={props.busy} onClick={props.onReloadCatalogTree}>
          Reload Catalog Tree
        </button>
      </div>

      <h3>Catalog Upsert</h3>
      <div className="stack">
        <input value={props.catalogUpsertName} onChange={(e) => props.setCatalogUpsertName(e.target.value)} placeholder="Catalog item name" />
        <div className="inline-grid">
          <input value={props.catalogUpsertPrice} onChange={(e) => props.setCatalogUpsertPrice(e.target.value)} placeholder="Unit price" />
          <input value={props.catalogUpsertLabor} onChange={(e) => props.setCatalogUpsertLabor(e.target.value)} placeholder="Labor hours" />
        </div>
        <input
          value={props.catalogUpsertDescription}
          onChange={(e) => props.setCatalogUpsertDescription(e.target.value)}
          placeholder="Description"
        />
        <div className="toolbar">
          <button disabled={props.busy || !props.isSessionReady || !props.catalogUpsertName.trim()} onClick={props.onCatalogUpsert}>
            Upsert Catalog Item
          </button>
        </div>
      </div>

      <h3>Bulk Catalog Import</h3>
      <textarea
        value={props.catalogImportJson}
        onChange={(e) => props.setCatalogImportJson(e.target.value)}
        rows={5}
        placeholder='[{"name":"Item","unit_price":"10","labor_hours":"1"}]'
      />
      <div className="toolbar">
        <button disabled={props.busy || !props.isSessionReady} onClick={props.onCatalogImport}>
          Import Catalog JSON
        </button>
      </div>
      <div className="info-strip">{props.catalogOpsOutput || "No catalog management operation run."}</div>

      <h3>Search Results</h3>
      <ul className="list">
        {props.catalogResults.map((item) => (
          <li key={item.id}>
            <button disabled={props.busy || !props.hasSelectedEstimate} onClick={() => props.onAddCatalogItem(item)}>
              <span>{`${item.name} ($${item.unit_price})`}</span>
              <small>Add to estimate</small>
            </button>
          </li>
        ))}
      </ul>

      <h3>Catalog Tree</h3>
      <div className="tree-grid">
        {props.catalogTree.map((node) => (
          <div key={node.node_id ?? node.name} className="tree-node">
            <strong>{node.name}</strong>
            <span>{`${node.items.length} items`}</span>
            <small>{node.items.slice(0, 3).map((item) => item.name).join(", ") || "No items"}</small>
          </div>
        ))}
        {!props.catalogTree.length && <div className="empty-state">No catalog nodes loaded.</div>}
      </div>
    </div>
  );
}
