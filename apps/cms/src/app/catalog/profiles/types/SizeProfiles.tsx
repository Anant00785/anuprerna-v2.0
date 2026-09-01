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
import type {
  ProfileSizeItem,
  ProfileSizeConfigItem,
  ProfileSizeGuideItem,
} from "@/types/profiles";

interface SizeForm {
  profileName: string;
  displayName: string;
  disclaimer: string;
  image: string;
  sizeProfileOptionList: ProfileSizeConfigItem[];
  sizeProfileGuideList: ProfileSizeGuideItem[];
}

const EMPTY: SizeForm = {
  profileName: "",
  displayName: "",
  disclaimer: "",
  image: "",
  sizeProfileOptionList: [],
  sizeProfileGuideList: [],
};

const newOption = (): ProfileSizeConfigItem => ({
  id: 0,
  label: "",
  keyFeature: "",
  consumedFabric: 0,
  sortOrder: 0,
});
const newGuide = (): ProfileSizeGuideItem => ({
  id: 0,
  guide: "",
  value: 0,
  sortOrder: 0,
});

const OPTION_COLS: RepeatableColumn<ProfileSizeConfigItem>[] = [
  { key: "label", label: "Label", placeholder: "e.g. Medium" },
  { key: "keyFeature", label: "Key Feature", placeholder: "e.g. 40in chest" },
  { key: "consumedFabric", label: "Fabric (m)", type: "number", width: "w-24", step: 0.01 },
  { key: "sortOrder", label: "Sort", type: "number", width: "w-16" },
];
const GUIDE_COLS: RepeatableColumn<ProfileSizeGuideItem>[] = [
  { key: "guide", label: "Guide", placeholder: "e.g. Chest" },
  { key: "value", label: "Value", type: "number", width: "w-24", step: 0.01 },
  { key: "sortOrder", label: "Sort", type: "number", width: "w-16" },
];

export function SizeProfiles({ items }: { items: ProfileSizeItem[] }) {
  const columns = useMemo<DataListColumn<ProfileSizeItem>[]>(
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
        render: (r) => (
          <div className="flex flex-col">
            <span className="font-medium text-sm" style={{ color: "#1A1714" }}>{r.profileName}</span>
            {r.displayName && (
              <span className="text-xs" style={{ color: "#847D77" }}>{r.displayName}</span>
            )}
          </div>
        ),
      },
      {
        key: "options",
        label: "Options",
        headerClassName: "w-28",
        render: (r) => (
          <Badge variant={r.sizeProfileOptionList?.length ? "green" : "stone"}>
            {r.sizeProfileOptionList?.length ?? 0} sizes
          </Badge>
        ),
      },
    ],
    [],
  );

  return (
    <ProfileCrud<ProfileSizeItem, SizeForm>
      title="Size Profiles"
      description="Size option sets with per-size fabric consumption and measurement guides."
      entitySingular="Size Profile"
      items={items}
      hideHeader
      drawerWidth="max-w-3xl"
      searchText={(i) => `${i.profileName} ${i.displayName ?? ""}`}
      columns={columns}
      deleteEndpoint={(id) => `/delete/size-profile/${id}`}
      emptyForm={EMPTY}
      toForm={(i) => ({
        profileName: i.profileName ?? "",
        displayName: i.displayName ?? "",
        disclaimer: i.disclaimer ?? "",
        image: i.image ?? "",
        sizeProfileOptionList: (i.sizeProfileOptionList ?? []).map((o) => ({ ...o })),
        sizeProfileGuideList: (i.sizeProfileGuideList ?? []).map((g) => ({ ...g })),
      })}
      isValid={(f) => f.profileName.trim().length > 0 && f.sizeProfileOptionList.length > 0}
      buildPayload={(mode, id, f) => ({
        endpoint: mode === "create" ? "/add/size-profile" : `/update/size-profile/${id}`,
        method: mode === "create" ? "POST" : "PATCH",
        body: {
          ...(mode === "edit" ? { id } : {}),
          profileName: f.profileName,
          displayName: f.displayName,
          disclaimer: f.disclaimer,
          image: f.image,
          sizeProfileOptionList: f.sizeProfileOptionList,
          sizeProfileGuideList: f.sizeProfileGuideList,
        },
      })}
      renderForm={(form, update) => (
        <>
          <FormField label="Profile Name" required>
            <TextInput
              value={form.profileName}
              onChange={(e) => update({ profileName: e.target.value })}
              placeholder="e.g. Menswear Sizes"
              autoFocus
            />
          </FormField>
          <FormField label="Display Name">
            <TextInput
              value={form.displayName}
              onChange={(e) => update({ displayName: e.target.value })}
              placeholder="Shown to customers"
            />
          </FormField>
          <FormField label="Image URL">
            <TextInput
              value={form.image}
              onChange={(e) => update({ image: e.target.value })}
              placeholder="https://cdn…"
            />
          </FormField>
          <FormField label="Disclaimer">
            <Textarea
              value={form.disclaimer}
              onChange={(e) => update({ disclaimer: e.target.value })}
              rows={2}
            />
          </FormField>
          <FormField label="Size Options" hint="Each size with its fabric consumption.">
            <RepeatableRows<ProfileSizeConfigItem>
              rows={form.sizeProfileOptionList}
              columns={OPTION_COLS}
              onChange={(rows) => update({ sizeProfileOptionList: rows })}
              newRow={newOption}
              addLabel="Add size"
            />
          </FormField>
          <FormField label="Size Guide" hint="Measurement rows shown in the size guide.">
            <RepeatableRows<ProfileSizeGuideItem>
              rows={form.sizeProfileGuideList}
              columns={GUIDE_COLS}
              onChange={(rows) => update({ sizeProfileGuideList: rows })}
              newRow={newGuide}
              addLabel="Add guide row"
            />
          </FormField>
        </>
      )}
    />
  );
}
