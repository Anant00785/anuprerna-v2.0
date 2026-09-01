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
import type { ProfileBadgeItem, ProfileBadgeConfigItem } from "@/types/profiles";

interface BadgeForm {
  profileName: string;
  badgeProfileItemList: ProfileBadgeConfigItem[];
}

const EMPTY: BadgeForm = { profileName: "", badgeProfileItemList: [] };

const newBadge = (): ProfileBadgeConfigItem => ({
  id: 0,
  caption: "",
  link: "",
  image: "",
});

const BADGE_COLS: RepeatableColumn<ProfileBadgeConfigItem>[] = [
  { key: "caption", label: "Caption", placeholder: "e.g. Bestseller" },
  { key: "link", label: "Link", placeholder: "https://…" },
  { key: "image", label: "Image URL", placeholder: "https://cdn…" },
];

export function BadgeProfiles({ items }: { items: ProfileBadgeItem[] }) {
  const columns = useMemo<DataListColumn<ProfileBadgeItem>[]>(
    () => [
      {
        key: "id",
        label: "ID",
        headerClassName: "w-16",
        render: (r) => (
          <span className="font-mono text-xs" style={{ color: "#AAA39E" }}>#{r.id}</span>
        ),
      },
      {
        key: "profileName",
        label: "Profile Name",
        render: (r) => (
          <span className="font-medium text-sm" style={{ color: "#1A1714" }}>{r.profileName}</span>
        ),
      },
      {
        key: "badges",
        label: "Badges",
        headerClassName: "w-28",
        render: (r) => (
          <Badge variant={r.badgeProfileItemList?.length ? "green" : "stone"}>
            {r.badgeProfileItemList?.length ?? 0} badge{(r.badgeProfileItemList?.length ?? 0) === 1 ? "" : "s"}
          </Badge>
        ),
      },
    ],
    [],
  );

  return (
    <ProfileCrud<ProfileBadgeItem, BadgeForm>
      title="Badge Profiles"
      description="Reusable badge sets (caption + link + image) attached to products."
      entitySingular="Badge Profile"
      items={items}
      hideHeader
      searchText={(i) => i.profileName}
      columns={columns}
      deleteEndpoint={(id) => `/delete/badge-profile/${id}`}
      emptyForm={EMPTY}
      toForm={(i) => ({
        profileName: i.profileName ?? "",
        badgeProfileItemList: (i.badgeProfileItemList ?? []).map((b) => ({ ...b })),
      })}
      isValid={(f) => f.profileName.trim().length > 0 && f.badgeProfileItemList.length > 0}
      buildPayload={(mode, id, f) => ({
        endpoint: mode === "create" ? "/add/badge-profile" : `/update/badge-profile/${id}`,
        method: mode === "create" ? "POST" : "PATCH",
        body: {
          ...(mode === "edit" ? { id } : {}),
          profileName: f.profileName,
          badgeProfileItemList: f.badgeProfileItemList,
        },
      })}
      renderForm={(form, update) => (
        <>
          <FormField label="Profile Name" required>
            <TextInput
              value={form.profileName}
              onChange={(e) => update({ profileName: e.target.value })}
              placeholder="e.g. Festive Badges"
              autoFocus
            />
          </FormField>
          <FormField label="Badges" hint="Each badge shows a caption with an optional link and image.">
            <RepeatableRows<ProfileBadgeConfigItem>
              rows={form.badgeProfileItemList}
              columns={BADGE_COLS}
              onChange={(rows) => update({ badgeProfileItemList: rows })}
              newRow={newBadge}
              addLabel="Add badge"
            />
          </FormField>
        </>
      )}
    />
  );
}
