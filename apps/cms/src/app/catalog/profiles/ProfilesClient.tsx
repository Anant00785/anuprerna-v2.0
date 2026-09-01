"use client";

/**
 * ProfilesClient — tabbed view across the seven profile types. Mirrors the
 * Catalog → Filters tab pattern: one WeaveShell page, a tab switcher, and an
 * embedded per-type list + drawer (hideHeader) in each panel. Each panel is a
 * self-contained component built on the shared ProfileCrud scaffold.
 */

import React, { useState } from "react";
import { WeaveShell } from "@/components/weave/WeaveShell";
import type { ProfileType } from "@/types/profiles";
import type {
  ProfileBadgeItem,
  ProfileVolumeItem,
  ProfileSizeItem,
  ProfileCustomSizeItem,
  FabricProfileItem,
  ProfileCustomFinish,
  ProfileMadeToOrder,
} from "@/types/profiles";
import { BadgeProfiles } from "./types/BadgeProfiles";
import { VolumeDiscountProfiles } from "./types/VolumeDiscountProfiles";
import { SizeProfiles } from "./types/SizeProfiles";
import { CustomSizeProfiles } from "./types/CustomSizeProfiles";
import { FabricProfiles } from "./types/FabricProfiles";
import { CustomFinishProfiles } from "./types/CustomFinishProfiles";
import { MadeToOrderProfiles } from "./types/MadeToOrderProfiles";

export interface ProfilesClientProps {
  badge: ProfileBadgeItem[];
  volume: ProfileVolumeItem[];
  size: ProfileSizeItem[];
  customSize: ProfileCustomSizeItem[];
  fabric: FabricProfileItem[];
  customFinish: ProfileCustomFinish[];
  madeToOrder: ProfileMadeToOrder[];
  initialTab?: ProfileType;
}

export function ProfilesClient({
  badge,
  volume,
  size,
  customSize,
  fabric,
  customFinish,
  madeToOrder,
  initialTab = "badge",
}: ProfilesClientProps) {
  const [tab, setTab] = useState<ProfileType>(initialTab);

  const tabs: { id: ProfileType; label: string; count: number }[] = [
    { id: "badge", label: "Badge", count: badge.length },
    { id: "volume", label: "Volume Discount", count: volume.length },
    { id: "size", label: "Size", count: size.length },
    { id: "custom-size", label: "Custom Size", count: customSize.length },
    { id: "fabric", label: "Fabric", count: fabric.length },
    { id: "custom-finish", label: "Custom Finish", count: customFinish.length },
    { id: "made-to-order", label: "Made to Order", count: madeToOrder.length },
  ];

  return (
    <WeaveShell
      breadcrumb={
        <div className="flex items-center gap-2 text-sm" style={{ color: "#847D77" }}>
          <span>Catalog</span>
          <span>/</span>
          <span className="font-medium" style={{ color: "#1A1714" }}>Profiles</span>
        </div>
      }
    >
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="font-serif text-2xl font-semibold" style={{ color: "#1A1714" }}>
            Product Profiles
          </h1>
          <p className="mt-1 text-sm" style={{ color: "#847D77" }}>
            Reusable configuration sets — badges, discounts, sizing, fabrics,
            finishes and made-to-order terms — attached to products and
            sub-categories.
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex flex-wrap items-center gap-1 border-b pb-0" style={{ borderColor: "#E8E4DE" }}>
          {tabs.map((t) => {
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors"
                style={
                  active
                    ? { borderBottomColor: "#A86120", color: "#A86120" }
                    : { borderBottomColor: "transparent", color: "#847D77" }
                }
              >
                {t.label}
                <span
                  className="rounded-full px-1.5 py-0.5 text-[10px] font-semibold"
                  style={
                    active
                      ? { background: "#FEF3E2", color: "#A86120" }
                      : { background: "#F3F1ED", color: "#AAA39E" }
                  }
                >
                  {t.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Tab content */}
        <div>
          {tab === "badge" && <BadgeProfiles items={badge} />}
          {tab === "volume" && <VolumeDiscountProfiles items={volume} />}
          {tab === "size" && <SizeProfiles items={size} />}
          {tab === "custom-size" && <CustomSizeProfiles items={customSize} />}
          {tab === "fabric" && <FabricProfiles items={fabric} />}
          {tab === "custom-finish" && <CustomFinishProfiles items={customFinish} />}
          {tab === "made-to-order" && <MadeToOrderProfiles items={madeToOrder} />}
        </div>
      </div>
    </WeaveShell>
  );
}
