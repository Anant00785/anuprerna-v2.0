import { describe, it, expect, vi } from "vitest";
import { toInsertValues, toUpdateValues } from "./tag.mapper.js";
import { CreateTagInput } from "../types/tag.types.js";

describe("tag.mapper toInsertValues", () => {
  it("maps name and always server-stamps timeOfCreation", () => {
    vi.useFakeTimers().setSystemTime(7000);
    const values = toInsertValues({ name: "Bestseller" } as CreateTagInput);
    expect(values).toEqual({ name: "Bestseller", timeOfCreation: 7000 });
    vi.useRealTimers();
  });
});

describe("tag.mapper toUpdateValues", () => {
  it("writes only name", () => {
    const values = toUpdateValues("New Tag");
    expect(values).toEqual({ name: "New Tag" });
  });
});
