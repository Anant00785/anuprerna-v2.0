"use client";

/**
 * FiltersClient — tabbed view for the three product filter lists:
 * Materials, Colors, and Patterns.
 *
 * All three share the same structure (name-only CatalogSimpleItem).
 * Uses the shared SimpleItemCrud (shell=false) embedded in tab panels
 * so they don't nest WeaveShell.
 */

import React, { useState } from "react";
import Link from "next/link";
import { WeaveShell } from "@/components/weave/WeaveShell";
import { SimpleItemCrud } from "@/components/catalog/SimpleItemCrud";
import type { CatalogSimpleItem } from "@/types/catalog";

type FilterTab = "materials" | "colors" | "patterns";

interface FiltersClientProps {
  materials: CatalogSimpleItem[];
  colors: CatalogSimpleItem[];
  patterns: CatalogSimpleItem[];
}

export function FiltersClient({
  materials,
  colors,
  patterns,
}: FiltersClientProps) {
  const [tab, setTab] = useState<FilterTab>("materials");

  const tabs: { id: FilterTab; label: string; count: number }[] = [
    { id: "materials", label: "Materials", count: materials.length },
    { id: "colors",    label: "Colors",    count: colors.length },
    { id: "patterns",  label: "Patterns",  count: patterns.length },
  ];

  return (
    <WeaveShell
      breadcrumb={
        <div
          className="flex items-center gap-2 text-sm"
          style={{ color: "#847D77" }}
        >
          <span>Catalog</span>
          <span>/</span>
          <span className="font-medium" style={{ color: "#1A1714" }}>
            Filters
          </span>
        </div>
      }
    >
      <div className="flex flex-col gap-6">
        {/* Page header */}
        <div>
          <h1
            className="font-serif text-2xl font-semibold"
            style={{ color: "#1A1714" }}
          >
            Product Filters
          </h1>
          <p className="mt-1 text-sm" style={{ color: "#847D77" }}>
            Storefront filter options — Materials, Colors, and Patterns used
            to classify products.
          </p>
        </div>

        {/* Tab switcher */}
        <div
          className="flex items-center gap-1 border-b pb-0"
          style={{ borderColor: "#E8E4DE" }}
        >
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
                    ? {
                        borderBottomColor: "#A86120",
                        color: "#A86120",
                      }
                    : {
                        borderBottomColor: "transparent",
                        color: "#847D77",
                      }
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

        {/* Tab content — embedded SimpleItemCrud without its own WeaveShell */}
        <div>
          {tab === "materials" && (
            <SimpleItemCrud
              title="Materials"
              description="Filter values for product material (e.g. Cotton, Silk, Wool)."
              entitySingular="Material"
              breadcrumbSection="Filters"
              breadcrumbHref="/catalog/filters"
              items={materials}
              writeEndpoint="/add/material"
              updateEndpoint="/update/material"
              deleteEndpoint="/delete/material"
              shell={false}
              hideHeader={true}
            />
          )}
          {tab === "colors" && (
            <SimpleItemCrud
              title="Colors"
              description="Filter values for product colour (e.g. Red, Indigo, Natural)."
              entitySingular="Color"
              breadcrumbSection="Filters"
              breadcrumbHref="/catalog/filters"
              items={colors}
              writeEndpoint="/add/color"
              updateEndpoint="/update/color"
              deleteEndpoint="/delete/color"
              shell={false}
              hideHeader={true}
              extraField={{ key: "hex", label: "Hex", placeholder: "#000000", required: true }}
            />
          )}
          {tab === "patterns" && (
            <SimpleItemCrud
              title="Patterns"
              description="Filter values for product pattern (e.g. Checks, Stripes, Plain)."
              entitySingular="Pattern"
              breadcrumbSection="Filters"
              breadcrumbHref="/catalog/filters"
              items={patterns}
              writeEndpoint="/add/pattern"
              updateEndpoint="/update/pattern"
              deleteEndpoint="/delete/pattern"
              shell={false}
              hideHeader={true}
            />
          )}
        </div>
      </div>
    </WeaveShell>
  );
}
