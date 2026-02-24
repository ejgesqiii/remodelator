import { useState } from "react";

import { DEFAULT_CATALOG_IMPORT_JSON, DEFAULT_CATALOG_QUERY, DEFAULT_TEMPLATE_NAME } from "./defaults";
import { CatalogItem, CatalogTreeNode, TemplateSummary } from "../types";

export function useCatalogState() {
  const [catalogQuery, setCatalogQuery] = useState(DEFAULT_CATALOG_QUERY);
  const [catalogResults, setCatalogResults] = useState<CatalogItem[]>([]);
  const [catalogTree, setCatalogTree] = useState<CatalogTreeNode[]>([]);
  const [catalogUpsertName, setCatalogUpsertName] = useState("");
  const [catalogUpsertPrice, setCatalogUpsertPrice] = useState("0");
  const [catalogUpsertLabor, setCatalogUpsertLabor] = useState("0");
  const [catalogUpsertDescription, setCatalogUpsertDescription] = useState("");
  const [catalogImportJson, setCatalogImportJson] = useState(DEFAULT_CATALOG_IMPORT_JSON);
  const [catalogOpsOutput, setCatalogOpsOutput] = useState("");

  const [templateName, setTemplateName] = useState(DEFAULT_TEMPLATE_NAME);
  const [templates, setTemplates] = useState<TemplateSummary[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState("");

  return {
    catalogQuery,
    setCatalogQuery,
    catalogResults,
    setCatalogResults,
    catalogTree,
    setCatalogTree,
    catalogUpsertName,
    setCatalogUpsertName,
    catalogUpsertPrice,
    setCatalogUpsertPrice,
    catalogUpsertLabor,
    setCatalogUpsertLabor,
    catalogUpsertDescription,
    setCatalogUpsertDescription,
    catalogImportJson,
    setCatalogImportJson,
    catalogOpsOutput,
    setCatalogOpsOutput,
    templateName,
    setTemplateName,
    templates,
    setTemplates,
    selectedTemplateId,
    setSelectedTemplateId,
  };
}
