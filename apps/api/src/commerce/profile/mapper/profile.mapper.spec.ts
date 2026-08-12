import { describe, it, expect } from "vitest";
import {
  mapSizeProfile,
  mapSizeProfileOption,
  mapSizeProfileGuide,
  mapBadgeProfile,
  mapBadgeProfileItem,
  mapMadeToOrderProfile,
  mapTenantProfile,
} from "./profile.mapper.js";

const mappers = {
  mapSizeProfile,
  mapSizeProfileOption,
  mapSizeProfileGuide,
  mapBadgeProfile,
  mapBadgeProfileItem,
  mapMadeToOrderProfile,
  mapTenantProfile,
};

describe("profile mappers — null safety", () => {
  it("every mapper returns null for a null row (mechanically identical guard)", () => {
    for (const fn of Object.values(mappers)) {
      expect(fn(null)).toBeNull();
    }
  });
});

describe("mapSizeProfile", () => {
  it("projects the documented size-profile fields", () => {
    const row = { id: 1, profileName: "P", displayName: "D", disclaimer: "X", image: "i.png", timeOfCreation: 1000, extra: "drop me" };
    expect(mapSizeProfile(row)).toEqual({
      id: 1, profileName: "P", displayName: "D", disclaimer: "X", image: "i.png", timeOfCreation: 1000,
    });
  });
});

describe("mapBadgeProfileItem", () => {
  it("projects id/profileId/label/icon/sortOrder", () => {
    const row = { id: 1, profileId: 2, label: "L", icon: "i", sortOrder: 3, junk: true };
    expect(mapBadgeProfileItem(row)).toEqual({ id: 1, profileId: 2, label: "L", icon: "i", sortOrder: 3 });
  });
});

describe("mapMadeToOrderProfile", () => {
  it("projects the made-to-order fields", () => {
    const row = {
      id: 1, profileName: "MTO", minimumOrderQuantity: 5, deliveryFromDays: 10, deliveryToDays: 20,
      timeOfCreation: 1000, consumedFabric: 2.5,
    };
    expect(mapMadeToOrderProfile(row)).toEqual(row);
  });
});
