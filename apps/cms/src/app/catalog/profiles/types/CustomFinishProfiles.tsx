"use client";

import React, { useMemo } from "react";
import {
  DataListColumn,
  FormField,
  TextInput,
  Badge,
  RepeatableRows,
  RepeatableColumn,
} from "@/components/ui";
import { ProfileCrud } from "@/components/profiles/ProfileCrud";
import type { ProfileCustomFinish, CustomFinishConfigItem } from "@/types/profiles";

interface FinishForm {
  profileName: string;
  displayName: string;
  finishProfileItemList: CustomFinishConfigItem[];
}

const EMPTY: FinishForm = { profileName: "", displayName: "", finishProfileItemList: [] };

const newFinish = (): CustomFinishConfigItem => ({
  id: 0,
  label: "",
  price: 0,
  description: "",
  image: "",
});

const FINISH_COLS: RepeatableColumn<CustomFinishConfigItem>[] = [
  { key: "label", label: "Label", placeholder: "e.g. Tassels" },
  { key: "price", label: "Price", type: "number", width: "w-24" },
  { key: "description", label: "Description", placeholder: "Short description" },
  { key: "image", label: "Image URL", placeholder: "https://cdn…" },
];

export function CustomFinishProfiles({ items }: { items: ProfileCustomFinish[] }) {
  const columns = useMemo<DataListColumn<ProfileCustomFinish>[]>(
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
        key: "finishes",
        label: "Finishes",
        headerClassName: "w-28",
        render: (r) => (
          <Badge variant={r.finishProfileItemList?.length ? "green" : "stone"}>
            {r.finishProfileItemList?.length ?? 0} options
          </Badge>
        ),
      },
    ],
    [],
  );

  return (
    <ProfileCrud<ProfileCustomFinish, FinishForm>
      title="Custom Finish Profiles"
      description="Add-on finishing options (label + price + image) offered on a product."
      entitySingular="Custom Finish Profile"
      items={items}
      hideHeader
      drawerWidth="max-w-3xl"
      searchText={(i) => `${i.profileName} ${i.displayName ?? ""}`}
      columns={columns}
      deleteEndpoint={(id) => `/delete/finish-profile/${id}`}
      emptyForm={EMPTY}
      toForm={(i) => ({
        profileName: i.profileName ?? "",
        displayName: i.displayName ?? "",
        finishProfileItemList: (i.finishProfileItemList ?? []).map((f) => ({ ...f })),
      })}
      isValid={(f) => f.profileName.trim().length > 0 && f.finishProfileItemList.length > 0}
      buildPayload={(mode, id, f) => ({
        endpoint: mode === "create" ? "/add/finish-profile" : `/update/finish-profile/${id}`,
        method: mode === "create" ? "POST" : "PATCH",
        body: {
          ...(mode === "edit" ? { id } : {}),
          profileName: f.profileName,
          displayName: f.displayName,
          finishProfileItemList: f.finishProfileItemList,
        },
      })}
      renderForm={(form, update) => (
        <>
          <FormField label="Profile Name" required>
            <TextInput
              value={form.profileName}
              onChange={(e) => update({ profileName: e.target.value })}
              placeholder="e.g. Saree Finishes"
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
          <FormField label="Finish Options" hint="Each add-on finish with its price.">
            <RepeatableRows<CustomFinishConfigItem>
              rows={form.finishProfileItemList}
              columns={FINISH_COLS}
              onChange={(rows) => update({ finishProfileItemList: rows })}
              newRow={newFinish}
              addLabel="Add finish"
            />
          </FormField>
        </>
      )}
    />
  );
}
