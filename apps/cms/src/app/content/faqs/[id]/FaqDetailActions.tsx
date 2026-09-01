"use client";

/**
 * FaqDetailActions — small client island for the FAQ detail page (a server
 * component). Renders the "Edit" button + FaqDrawer for this one FAQ group,
 * without needing to convert the whole detail page to a client component.
 */

import React, { useState } from "react";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui";
import { FaqDrawer } from "../FaqDrawer";
import type { FaqItem } from "@/lib/content-api";

export function FaqDetailActions({ faq }: { faq: FaqItem }) {
  const [editing, setEditing] = useState(false);

  return (
    <>
      <Button variant="secondary" size="sm" onClick={() => setEditing(true)}>
        <Pencil className="h-3.5 w-3.5 mr-1" />
        Edit
      </Button>
      {editing && (
        <FaqDrawer mode="edit" faq={faq} onClose={() => setEditing(false)} />
      )}
    </>
  );
}
