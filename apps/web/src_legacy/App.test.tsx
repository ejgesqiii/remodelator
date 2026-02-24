import { render, screen } from "@testing-library/react";
import { App } from "./App";
import { vi } from "vitest";

beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn(() => new Promise(() => {})));
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("App", () => {
  it("renders title", () => {
    render(<App />);
    expect(screen.getByText("Remodelator vNext Web Console")).toBeInTheDocument();
  });
});
