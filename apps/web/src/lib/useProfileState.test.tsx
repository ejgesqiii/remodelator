import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { useProfileState } from "./useProfileState";

describe("useProfileState", () => {
  it("resets profile defaults", () => {
    const { result } = renderHook(() => useProfileState());

    act(() => {
      result.current.setProfileFullName("Changed");
      result.current.setProfileLaborRate("99.00");
      result.current.setProfileStatus("updated");
    });
    act(() => {
      result.current.resetProfileForm();
    });

    expect(result.current.profileFullName).toBe("");
    expect(result.current.profileLaborRate).toBe("75.00");
    expect(result.current.profileStatus).toBe("");
  });
});
