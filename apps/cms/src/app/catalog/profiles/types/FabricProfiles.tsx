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
import type { FabricProfileItem, FabricProfileConfigItem } from "@/types/profiles";

interface FabricForm {
  profileName: string;
  fabricProfileItemList: FabricProfileConfigItem[];
}

const EMPTY: FabricForm = { profileName: "", fabricProfileItemList: [] };

const newFabric = (): FabricProfileConfigItem => ({
  id: 0,
  fabricId: 0,
  mockupImage: "",
  mockupText: "",
  productName: "",
  sku: "",
});

const FABRIC_COLS: RepeatableColumn<FabricProfileConfigItem>[] = [
  { key: "fabricId", label: "Fabric ID", type: "number", width: "w-24" },
  { key: "sku", label: "SKU", placeholder: "e.g. FAB-001" },
  { key: "productName", label: "Product Name", placeholder: "Display name" },
  { key: "mockupText", label: "Mockup Text", placeholder: "Caption" },
  { key: "mockupImage", label: "Mockup Image", placeholder: "https://cdn…" },
];

export function FabricProfiles({ items }: { items: FabricProfileItem[] }) {
  const columns = useMemo<DataListColumn<FabricProfileItem>[]>(
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
        key: "fabrics",
        label: "Fabrics",
        headerClassName: "w-28",
        render: (r) => (
          <Badge variant={r.fabricProfileItemList?.length ? "green" : "stone"}>
            {r.fabricProfileItemList?.length ?? 0} fabrics
          </Badge>
        ),
      },
    ],
    [],
  );

  return (
    <ProfileCrud<FabricProfileItem, FabricForm>
      title="Fabric Profiles"
      description="Linked fabric mockups (fabric + SKU + mockup image) for a product family."
      entitySingular="Fabric Profile"
      items={items}
      hideHeader
      drawerWidth="max-w-3xl"
      searchText={(i) => i.profileName}
      columns={columns}
      deleteEndpoint={(id) => `/delete/fabric-profile/${id}`}
      emptyForm={EMPTY}
      toForm={(i) => ({
        profileName: i.profileName ?? "",
        fabricProfileItemList: (i.fabricProfileItemList ?? []).map((f) => ({ ...f })),
      })}
      isValid={(f) => f.profileName.trim().length > 0 && f.fabricProfileItemList.length > 0}
      buildPayload={(mode, id, f) => ({
        endpoint: mode === "create" ? "/add/fabric-profile" : `/update/fabric-profile/${id}`,
        method: mode === "create" ? "POST" : "PATCH",
        body: {
          ...(mode === "edit" ? { id } : {}),
          profileName: f.profileName,
          fabricProfileItemList: f.fabricProfileItemList,
        },
      })}
      renderForm={(form, update) => (
        <>
          <FormField label="Profile Name" required>
            <TextInput
              value={form.profileName}
              onChange={(e) => update({ profileName: e.target.value })}
              placeholder="e.g. Summer Cotton Range"
              autoFocus
            />
          </FormField>
          <FormField label="Fabric Items" hint="Each linked fabric SKU with its mockup.">
            <RepeatableRows<FabricProfileConfigItem>
              rows={form.fabricProfileItemList}
              columns={FABRIC_COLS}
              onChange={(rows) => update({ fabricProfileItemList: rows })}
              newRow={newFabric}
              addLabel="Add fabric"
            />
          </FormField>
        </>
      )}
    />
  );
}
