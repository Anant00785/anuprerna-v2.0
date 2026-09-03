import { describe, it, expect } from "vitest";
import { BadRequestException } from "@nestjs/common";

import * as cart from "./cart/dto/cart.dto.js";
import * as category from "./product/category/dto/category.dto.js";
import * as customProduct from "./product/custom-product/dto/custom-product.dto.js";
import * as fabricProduct from "./product/fabric-product/dto/fabric-product.dto.js";
import * as productSizeProfile from "./product/product-size-profile/dto/product-size-profile.dto.js";
import * as productZohoRelation from "./product/product-zoho-relation/dto/product-zoho-relation.dto.js";
import * as product from "./product/product/dto/product.dto.js";
import * as segment from "./product/segment/dto/segment.dto.js";
import * as skuGroup from "./product/sku-group/dto/sku-group.dto.js";
import * as specialStatus from "./product/special-status/dto/special-status.dto.js";
import * as subCategory from "./product/sub-category/dto/subcategory.dto.js";
import * as tag from "./product/tag/dto/tag.dto.js";

/**
 * Every path-id parser across the commerce DTOs delegates to
 * common/params/id-param.ts. The old per-DTO `requireInt` did
 * `Number(value)` then (sometimes) `BigInt(n)`, which accepted "1e5",
 * "0x10" and " 5", and rounded ids above 2^53 into a *different* row.
 * These are the boundary cases that used to slip through.
 */

/** name -> parser returning a plain number id. */
const numberParsers: Array<[string, (v: unknown) => number]> = [
  ["cart.parseIdParam", cart.parseIdParam],
  ["cart.parseCartItemIdParam", cart.parseCartItemIdParam],
  ["category.parseCategoryIdParam", category.parseCategoryIdParam],
  ["customProduct.parseProductIdParam", customProduct.parseProductIdParam],
  ["fabricProduct.parseProductIdParam", fabricProduct.parseProductIdParam],
  ["productSizeProfile.parseIdParam", productSizeProfile.parseIdParam],
  ["productSizeProfile.parseProductIdParam", productSizeProfile.parseProductIdParam],
  ["productSizeProfile.parseSizeProfileOptionIdParam", productSizeProfile.parseSizeProfileOptionIdParam],
  ["productZohoRelation.parseIdParam", productZohoRelation.parseIdParam],
  ["product.parseIdParam", product.parseIdParam],
  ["product.parseSubCategoryIdParam", product.parseSubCategoryIdParam],
  ["segment.parseIdParam", segment.parseIdParam],
  ["segment.parseSegmentIdParam", segment.parseSegmentIdParam],
  ["skuGroup.parseIdParam", skuGroup.parseIdParam],
  ["skuGroup.parseGroupIdParam", skuGroup.parseGroupIdParam],
  ["specialStatus.parseIdParam", specialStatus.parseIdParam],
  ["specialStatus.parseStatusIdParam", specialStatus.parseStatusIdParam],
  ["subCategory.parseIdParam", subCategory.parseIdParam],
  ["subCategory.parseSubCategoryIdParam", subCategory.parseSubCategoryIdParam],
];

/** Rejected by every id parser, number- or bigint-valued. */
const rejected: Array<[string, unknown]> = [
  ["scientific notation", "1e5"],
  ["hex literal", "0x10"],
  ["leading whitespace", " 5"],
  ["trailing whitespace", "5 "],
  ["negative", "-1"],
  ["decimal", "1.5"],
  ["empty string", ""],
  ["non-numeric", "abc"],
  ["undefined", undefined],
  ["null", null],
  ["object", {}],
  ["array", []],
  // 20 digits: past the postgres bigint bound, which used to reach the driver
  // and surface as a 500 instead of a 400.
  ["20-digit overflow", "12345678901234567890"],
];

describe.each(numberParsers)("%s", (_name, parse) => {
  it("accepts a well-formed id unchanged", () => {
    expect(parse("2728")).toBe(2728);
    expect(parse("1")).toBe(1);
    expect(parse(162853313)).toBe(162853313);
  });

  it.each(rejected)("rejects %s with a 400", (_label, value) => {
    expect(() => parse(value)).toThrow(BadRequestException);
  });

  it("rejects an id above 2^53 rather than querying a rounded one", () => {
    // Number("9007199254740993") === 9007199254740992 — the old path silently
    // looked up a neighbouring row. A number-typed id cannot represent it, so
    // the honest answer is a 400.
    expect(() => parse("9007199254740993")).toThrow(BadRequestException);
  });
});

describe("tag.parseIdParam (bigint-valued)", () => {
  it("preserves ids exactly past 2^53", () => {
    expect(tag.parseIdParam("2728")).toBe(2728n);
    expect(tag.parseIdParam("9007199254740993")).toBe(9007199254740993n);
  });

  it.each(rejected)("rejects %s with a 400", (_label, value) => {
    expect(() => tag.parseIdParam(value)).toThrow(BadRequestException);
  });
});

describe("slug path params", () => {
  const slugParsers: Array<[string, (v: unknown) => string]> = [
    ["product.parseSlugParam", product.parseSlugParam],
    ["fabricProduct.parseProductSlugParam", fabricProduct.parseProductSlugParam],
  ];

  it.each(slugParsers)("%s accepts a slug and rejects blank/non-string", (_name, parse) => {
    expect(parse("silk-scarf")).toBe("silk-scarf");
    expect(() => parse("")).toThrow(BadRequestException);
    expect(() => parse("   ")).toThrow(BadRequestException);
    expect(() => parse(undefined)).toThrow(BadRequestException);
  });
});
