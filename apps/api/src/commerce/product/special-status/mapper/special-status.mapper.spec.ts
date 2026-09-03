import { describe, it, expect, vi } from "vitest";
import { toInsertValues, toUpdateValues } from "./special-status.mapper.js";
import { CreateSpecialStatusInput } from "../types/special-status.types.js";

describe("special-status.mapper toInsertValues", () => {
  it("maps name and always server-stamps timeOfCreation", () => {
    vi.useFakeTimers().setSystemTime(4000);
    const values = toInsertValues({ name: "New" } as CreateSpecialStatusInput);
    expect(values).toEqual({ name: "New", timeOfCreation: 4000 });
    vi.useRealTimers();
  });
});

describe("special-status.mapper toUpdateValues", () => {
  it("writes only name", () => {
    const values = toUpdateValues("Sale");
    expect(values).toEqual({ name: "Sale" });
  });
});
