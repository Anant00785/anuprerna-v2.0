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
import type { ProfileVolumeItem, ProfileVolumeConfigItem } from "@/types/profiles";

interface VolumeForm {
  profileName: string;
  disclaimer: string;
  volumeDiscountProfileItemList: ProfileVolumeConfigItem[];
}

const EMPTY: VolumeForm = { profileName: "", disclaimer: "", volumeDiscountProfileItemList: [] };

const newTier = (): ProfileVolumeConfigItem => ({
  id: 0,
  minimumOrderQuantity: 0,
  discount: 0,
  preOrder: false,
  advancePayment: 0,
  deliveryFromDays: 0,
  deliveryToDays: 0,
});

const TIER_COLS: RepeatableColumn<ProfileVolumeConfigItem>[] = [
  { key: "minimumOrderQuantity", label: "Min Qty", type: "number", width: "w-20" },
  { key: "discount", label: "Discount %", type: "number", width: "w-24", step: 0.1 },
  { key: "advancePayment", label: "Advance %", type: "number", width: "w-24", step: 0.1 },
  { key: "deliveryFromDays", label: "From Days", type: "number", width: "w-20" },
  { key: "deliveryToDays", label: "To Days", type: "number", width: "w-20" },
  { key: "preOrder", label: "Pre-order", type: "toggle", width: "w-20" },
];

export function VolumeDiscountProfiles({ items }: { items: ProfileVolumeItem[] }) {
  const columns = useMemo<DataListColumn<ProfileVolumeItem>[]>(
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
        key: "tiers",
        label: "Tiers",
        headerClassName: "w-24",
        render: (r) => (
          <Badge variant={r.volumeDiscountProfileItemList?.length ? "green" : "stone"}>
            {r.volumeDiscountProfileItemList?.length ?? 0} tiers
          </Badge>
        ),
      },
    ],
    [],
  );

  return (
    <ProfileCrud<ProfileVolumeItem, VolumeForm>
      title="Volume Discount Profiles"
      description="Quantity-tiered discount + pre-order / advance-payment terms."
      entitySingular="Volume Discount Profile"
      items={items}
      hideHeader
      drawerWidth="max-w-3xl"
      searchText={(i) => i.profileName}
      columns={columns}
      deleteEndpoint={(id) => `/delete/volume-discount-profile/${id}`}
      emptyForm={EMPTY}
      toForm={(i) => ({
        profileName: i.profileName ?? "",
        disclaimer: i.disclaimer ?? "",
        volumeDiscountProfileItemList: (i.volumeDiscountProfileItemList ?? []).map((t) => ({ ...t })),
      })}
      isValid={(f) => f.profileName.trim().length > 0 && f.volumeDiscountProfileItemList.length > 0}
      buildPayload={(mode, id, f) => ({
        endpoint: mode === "create" ? "/add/volume-discount-profile" : "/update/volume-discount-profile",
        method: mode === "create" ? "POST" : "PATCH",
        body: {
          ...(mode === "edit" ? { id } : {}),
          profileName: f.profileName,
          disclaimer: f.disclaimer,
          volumeDiscountProfileItemList: f.volumeDiscountProfileItemList,
        },
      })}
      renderForm={(form, update) => (
        <>
          <FormField label="Profile Name" required>
            <TextInput
              value={form.profileName}
              onChange={(e) => update({ profileName: e.target.value })}
              placeholder="e.g. Wholesale Tiers"
              autoFocus
            />
          </FormField>
          <FormField label="Disclaimer">
            <Textarea
              value={form.disclaimer}
              onChange={(e) => update({ disclaimer: e.target.value })}
              placeholder="Shown beneath the discount table…"
              rows={2}
            />
          </FormField>
          <FormField label="Discount Tiers" hint="Ordered from lowest to highest minimum quantity.">
            <RepeatableRows<ProfileVolumeConfigItem>
              rows={form.volumeDiscountProfileItemList}
              columns={TIER_COLS}
              onChange={(rows) => update({ volumeDiscountProfileItemList: rows })}
              newRow={newTier}
              addLabel="Add tier"
            />
          </FormField>
        </>
      )}
    />
  );
}
