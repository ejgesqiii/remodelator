import { renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { useCatalogState } from "./useCatalogState";

describe("useCatalogState", () => {
  it("starts with documented defaults", () => {
    const { result } = renderHook(() => useCatalogState());

    expect(result.current.catalogQuery).toBe("counter");
    expect(result.current.catalogImportJson).toContain("Demo Bulk Item");
    expect(result.current.templateName).toBe("Kitchen Base Template");
    expect(result.current.catalogResults).toEqual([]);
    expect(result.current.templates).toEqual([]);
  });
});
