/**
 * Request shapes for the custom-size-profile CRUD surface.
 *
 * Ports `profile/custom_size/validator/CustomSizeProfileValidator.java` and the
 * trimming done by `CustomSizeProfileSanitizer` / `CustomSizeProfileItemSanitizer`.
 * Loom validates before the DAO runs, so an invalid body is a 400 and nothing
 * is written.
 */
import { BadRequestException } from "@nestjs/common";

export interface CustomSizeProfileItemInput {
  label: string;
  fieldType: number;
  placeholder: string;
  mandatory: boolean;
}

export interface CustomSizeProfileInput {
  /** null on create; required on update. */
  id: number | null;
  profileName: string;
  disclaimer: string;
  price: number;
  customSizeProfileItemList: CustomSizeProfileItemInput[];
}

function reject(message: string): never {
  throw new BadRequestException(message);
}

function boundedString(value: unknown, field: string, min: number, max: number): string {
  if (typeof value !== "string") reject(`${field} is required.`);
  const trimmed = value.trim();
  if (trimmed.length < min || trimmed.length > max) {
    reject(`${field} must be between ${min} and ${max} characters.`);
  }
  return trimmed;
}

function parseItem(raw: unknown, index: number): CustomSizeProfileItemInput {
  const field = `customSizeProfileItemList[${index}]`;
  if (raw === null || typeof raw !== "object" || Array.isArray(raw)) reject(`${field} must be an object.`);
  const source = raw as Record<string, unknown>;

  const fieldType = Number(source.fieldType);
  if (!Number.isInteger(fieldType)) reject(`${field}.fieldType must be an integer.`);

  return {
    label: boundedString(source.label, `${field}.label`, 1, 255),
    fieldType,
    // NOT NULL in the schema with no default: an omitted placeholder is "".
    placeholder:
      source.placeholder === null || source.placeholder === undefined
        ? ""
        : boundedString(source.placeholder, `${field}.placeholder`, 0, 255),
    mandatory: source.mandatory === true,
  };
}

/** Loom: CustomSizeProfileValidator.validate. */
export function parseCustomSizeProfile(body: unknown, requireId: boolean): CustomSizeProfileInput {
  if (body === null || typeof body !== "object" || Array.isArray(body)) reject("body must be an object.");
  const source = body as Record<string, unknown>;

  const price = Number(source.price);
  if (!Number.isInteger(price) || price <= 0) reject("price must be a positive integer.");

  const rawItems = source.customSizeProfileItemList;
  if (!Array.isArray(rawItems) || rawItems.length === 0) {
    reject("customSizeProfileItemList must contain at least one item.");
  }

  let id: number | null = null;
  if (requireId) {
    id = Number(source.id);
    if (!Number.isInteger(id) || id <= 0) reject("id must be a positive integer.");
  }

  return {
    id,
    profileName: boundedString(source.profileName, "profileName", 1, 255),
    disclaimer: boundedString(source.disclaimer, "disclaimer", 1, 1000),
    price,
    customSizeProfileItemList: rawItems.map(parseItem),
  };
}
