"use client";

import React, { useMemo } from "react";
import {
  DataListColumn,
  FormField,
  TextInput,
  Textarea,
  Badge,
  RepeatableRows,
  RepeatableColumn,
} from "@/components/ui";
import { ProfileCrud } from "@/components/profiles/ProfileCrud";
import type { ProfileCustomSizeItem, ProfileCustomSizeConfigItem } from "@/types/profiles";

interface CustomSizeForm {
  profileName: string;
  price: number | "";
  disclaimer: string;
  customSizeProfileItemList: ProfileCustomSizeConfigItem[];
}

const EMPTY: CustomSizeForm = {
  profileName: "",
  price: 0,
  disclaimer: "",
  customSizeProfileItemList: [],
};

const newField = (): ProfileCustomSizeConfigItem => ({
  id: 0,
  label: "",
  placeholder: "",
  fieldType: 0,
  mandatory: false,
});

// fieldType: 0 = STRING, 1 = NUMBER (from old Angular)
const FIELD_COLS: RepeatableColumn<ProfileCustomSizeConfigItem>[] = [
  { key: "label", label: "Label", placeholder: "e.g. Waist" },
  { key: "placeholder", label: "Placeholder", placeholder: "e.g. in inches" },
  {
    key: "fieldType",
    label: "Type",
    type: "select",
    width: "w-28",
    options: [
      { value: 0, label: "STRING" },
      { value: 1, label: "NUMBER" },
    ],
  },
  { key: "mandatory", label: "Required", type: "toggle", width: "w-20" },
];

export function CustomSizeProfiles({ items }: { items: ProfileCustomSizeItem[] }) {
  const columns = useMemo<DataListColumn<ProfileCustomSizeItem>[]>(
    () => [
      {
        key: "id",
        label: "ID",
        headerClassName: "w-16",
        render: (r) => <span className="font-mono text-xs" style={{ color: "#AAA39E" }}>#{r.id}</span>,
      },
      {
        key: "profileName",
        label: "Profile Name",
        render: (r) => <span className="font-medium text-sm" style={{ color: "#1A1714" }}>{r.profileName}</span>,
      },
      {
        key: "price",
        label: "Price",
        headerClassName: "w-24",
        render: (r) => <span className="text-sm tabular-nums" style={{ color: "#635D58" }}>₹{r.price ?? 0}</span>,
      },
      {
        key: "fields",
        label: "Fields",
        headerClassName: "w-24",
        render: (r) => (
          <Badge variant={r.customSizeProfileItemList?.length ? "green" : "stone"}>
            {r.customSizeProfileItemList?.length ?? 0} fields
          </Badge>
        ),
      },
    ],
    [],
  );

  return (
    <ProfileCrud<ProfileCustomSizeItem, CustomSizeForm>
      title="Custom Size Profiles"
      description="Made-to-measure input forms — labelled fields the customer fills in."
      entitySingular="Custom Size Profile"
      items={items}
      hideHeader
      drawerWidth="max-w-2xl"
      searchText={(i) => i.profileName}
      columns={columns}
      deleteEndpoint={(id) => `/delete/custom-size-profile/${id}`}
      emptyForm={EMPTY}
      toForm={(i) => ({
        profileName: i.profileName ?? "",
        price: i.price ?? 0,
        disclaimer: i.disclaimer ?? "",
        customSizeProfileItemList: (i.customSizeProfileItemList ?? []).map((c) => ({ ...c })),
      })}
      isValid={(f) => f.profileName.trim().length > 0 && f.customSizeProfileItemList.length > 0}
      buildPayload={(mode, id, f) => ({
        endpoint: mode === "create" ? "/add/custom-size-profile" : "/update/custom-size-profile",
        method: mode === "create" ? "POST" : "PATCH",
        body: {
          ...(mode === "edit" ? { id } : {}),
          profileName: f.profileName,
          price: Number(f.price) || 0,
          disclaimer: f.disclaimer,
          customSizeProfileItemList: f.customSizeProfileItemList,
        },
      })}
      renderForm={(form, update) => (
        <>
          <FormField label="Profile Name" required>
            <TextInput
              value={form.profileName}
              onChange={(e) => update({ profileName: e.target.value })}
              placeholder="e.g. Blouse Stitching"
              autoFocus
            />
          </FormField>
          <FormField label="Price" hint="Additional charge for custom sizing.">
            <TextInput
              type="number"
              value={form.price === "" ? "" : String(form.price)}
              onChange={(e) => update({ price: e.target.value === "" ? "" : Number(e.target.value) })}
              placeholder="0"
            />
          </FormField>
          <FormField label="Disclaimer">
            <Textarea
              value={form.disclaimer}
              onChange={(e) => update({ disclaimer: e.target.value })}
              rows={2}
            />
          </FormField>
          <FormField label="Measurement Fields" hint="Each field the customer must provide.">
            <RepeatableRows<ProfileCustomSizeConfigItem>
              rows={form.customSizeProfileItemList}
              columns={FIELD_COLS}
              onChange={(rows) => update({ customSizeProfileItemList: rows })}
              newRow={newField}
              addLabel="Add field"
            />
          </FormField>
        </>
      )}
    />
  );
}
