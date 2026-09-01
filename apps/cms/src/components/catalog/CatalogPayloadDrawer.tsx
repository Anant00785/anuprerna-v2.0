"use client";

import React from "react";
import { Button } from "@/components/ui";

interface CatalogPayloadDrawerProps {
  payload: Record<string, unknown>;
  onClose: () => void;
  entityName?: string;
}

/**
 * Shared "Preview — you can edit; saving goes live at launch" payload drawer for all catalog CRUD
 * forms. Shows the assembled write-payload as formatted JSON so devs can
 * verify the shape before the write endpoints are wired up.
 */
export function CatalogPayloadDrawer({
  payload,
  onClose,
  entityName = "item",
}: CatalogPayloadDrawerProps) {
  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative flex h-full w-full max-w-xl flex-col bg-white shadow-2xl">
        {/* Header */}
        <div
          className="flex items-center justify-between border-b px-5 py-3"
          style={{ borderColor: "#E8E4DE" }}
        >
          <h3
            className="font-serif text-lg font-semibold"
            style={{ color: "#1A1714" }}
          >
            Validate {entityName}
          </h3>
          <button
            onClick={onClose}
            className="text-2xl leading-none"
            style={{ color: "#847D77" }}
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-auto p-5">
          <div
            className="mb-4 rounded-lg border px-4 py-3 text-sm"
            style={{
              background: "#FFF8F0",
              borderColor: "#FDE9C5",
              color: "#8A4C19",
            }}
          >
            <strong>Preview — you can edit; saving goes live at launch.</strong>
            <p className="mt-1 text-xs">
              This is the exact payload the write endpoint would receive.
              Nothing is sent to Loom.
            </p>
          </div>

          <h4
            className="mb-2 text-sm font-semibold"
            style={{ color: "#1A1714" }}
          >
            Payload preview
          </h4>
          <pre
            className="overflow-auto rounded-lg border p-3 text-[11px] leading-relaxed"
            style={{
              background: "#FAF9F7",
              borderColor: "#E8E4DE",
              color: "#3A352F",
            }}
          >
            {JSON.stringify(payload, null, 2)}
          </pre>
        </div>

        {/* Footer */}
        <div
          className="flex justify-end gap-3 border-t px-5 py-3"
          style={{ borderColor: "#E8E4DE" }}
        >
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
