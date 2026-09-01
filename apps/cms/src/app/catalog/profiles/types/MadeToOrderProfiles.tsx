"use client";

import React, { useMemo } from "react";
import { DataListColumn, FormField, TextInput } from "@/components/ui";
import { ProfileCrud } from "@/components/profiles/ProfileCrud";
import type { ProfileMadeToOrder } from "@/types/profiles";

interface MtoForm {
  profileName: string;
  consumedFabric: number | "";
  deliveryFromDays: number | "";
  deliveryToDays: number | "";
  minimumOrderQuantity: number | "";
}

const EMPTY: MtoForm = {
  profileName: "",
  consumedFabric: 0,
  deliveryFromDays: 0,
  deliveryToDays: 0,
  minimumOrderQuantity: 0,
};

const numStr = (v: number | "") => (v === "" ? "" : String(v));
const toNum = (v: string): number | "" => (v === "" ? "" : Number(v));

export function MadeToOrderProfiles({ items }: { items: ProfileMadeToOrder[] }) {
  const columns = useMemo<DataListColumn<ProfileMadeToOrder>[]>(
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
        key: "moq",
        label: "Min Order",
        headerClassName: "w-24",
        render: (r) => <span className="text-sm tabular-nums" style={{ color: "#635D58" }}>{r.minimumOrderQuantity}</span>,
      },
      {
        key: "fabric",
        label: "Fabric (m)",
        headerClassName: "w-24",
        render: (r) => <span className="text-sm tabular-nums" style={{ color: "#635D58" }}>{r.consumedFabric}</span>,
      },
      {
        key: "delivery",
        label: "Delivery (days)",
        headerClassName: "w-32",
        render: (r) => (
          <span className="text-sm tabular-nums" style={{ color: "#635D58" }}>
            {r.deliveryFromDays}–{r.deliveryToDays}
          </span>
        ),
      },
    ],
    [],
  );

  return (
    <ProfileCrud<ProfileMadeToOrder, MtoForm>
      title="Made-to-Order Profiles"
      description="Production lead-time + fabric + minimum-order terms for made-to-order products."
      entitySingular="Made-to-Order Profile"
      items={items}
      hideHeader
      searchText={(i) => i.profileName}
      columns={columns}
      deleteEndpoint={(id) => `/delete/made-to-order-profile/${id}`}
      emptyForm={EMPTY}
      toForm={(i) => ({
        profileName: i.profileName ?? "",
        consumedFabric: i.consumedFabric ?? 0,
        deliveryFromDays: i.deliveryFromDays ?? 0,
        deliveryToDays: i.deliveryToDays ?? 0,
        minimumOrderQuantity: i.minimumOrderQuantity ?? 0,
      })}
      isValid={(f) => f.profileName.trim().length > 0}
      buildPayload={(mode, id, f) => ({
        endpoint: mode === "create" ? "/add/made-to-order-profile" : "/update/made-to-order-profile",
        method: mode === "create" ? "POST" : "PATCH",
        body: {
          ...(mode === "edit" ? { id } : {}),
          profileName: f.profileName,
          consumedFabric: Number(f.consumedFabric) || 0,
          deliveryFromDays: Number(f.deliveryFromDays) || 0,
          deliveryToDays: Number(f.deliveryToDays) || 0,
          minimumOrderQuantity: Number(f.minimumOrderQuantity) || 0,
        },
      })}
      renderForm={(form, update) => (
        <>
          <FormField label="Profile Name" required>
            <TextInput
              value={form.profileName}
              onChange={(e) => update({ profileName: e.target.value })}
              placeholder="e.g. 2-Week Production"
              autoFocus
            />
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Minimum Order Qty">
              <TextInput
                type="number"
                value={numStr(form.minimumOrderQuantity)}
                onChange={(e) => update({ minimumOrderQuantity: toNum(e.target.value) })}
                placeholder="0"
              />
            </FormField>
            <FormField label="Consumed Fabric (m)">
              <TextInput
                type="number"
                step={0.01}
                value={numStr(form.consumedFabric)}
                onChange={(e) => update({ consumedFabric: toNum(e.target.value) })}
                placeholder="0"
              />
            </FormField>
            <FormField label="Delivery From (days)">
              <TextInput
                type="number"
                value={numStr(form.deliveryFromDays)}
                onChange={(e) => update({ deliveryFromDays: toNum(e.target.value) })}
                placeholder="0"
              />
            </FormField>
            <FormField label="Delivery To (days)">
              <TextInput
                type="number"
                value={numStr(form.deliveryToDays)}
                onChange={(e) => update({ deliveryToDays: toNum(e.target.value) })}
                placeholder="0"
              />
            </FormField>
          </div>
        </>
      )}
    />
  );
}
