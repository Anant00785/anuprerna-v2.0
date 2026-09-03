import { describe, it, expect, vi } from "vitest";
import { toInsertValues, toUpdateValues } from "./sku-group.mapper.js";
import { CreateSkuGroupInput } from "../types/sku-group.types.js";

describe("sku-group.mapper toInsertValues", () => {
  it("maps name and always server-stamps timeOfCreation", () => {
    vi.useFakeTimers().setSystemTime(3000);
    const values = toInsertValues({ name: "Group A" } as CreateSkuGroupInput);
    expect(values).toEqual({ name: "Group A", timeOfCreation: 3000 });
    vi.useRealTimers();
  });
});

describe("sku-group.mapper toUpdateValues", () => {
  it("writes only name, leaving timeOfCreation untouched", () => {
    const values = toUpdateValues("Group B");
    expect(values).toEqual({ name: "Group B" });
  });
});
