import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import Home from "./page";

// EXAMPLE component test — the pattern every page/component follows.
describe("Home (weave)", () => {
  it("renders the app title", () => {
    render(<Home />);
    expect(screen.getByText("Anuprerna CMS")).toBeInTheDocument();
  });
});
