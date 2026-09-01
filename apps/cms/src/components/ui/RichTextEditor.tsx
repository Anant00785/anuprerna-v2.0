"use client";

import React, { useCallback, useEffect, useRef } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Underline from "@tiptap/extension-underline";
import Placeholder from "@tiptap/extension-placeholder";
import { cn } from "@/lib/utils";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  List,
  ListOrdered,
  Link as LinkIcon,
  Undo2,
  Redo2,
  Heading2,
  Heading3,
} from "lucide-react";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  className?: string;
  id?: string;
}

/**
 * WYSIWYG rich-text editor backed by Tiptap / ProseMirror.
 *
 * Contract (unchanged from the textarea stub):
 *   value  — HTML string from Loom (loaded from product.productOverview / productCare)
 *   onChange — called with updated HTML string on every keystroke / command
 *
 * The user sees formatted text; the raw HTML is never visible.
 * Outputs the same HTML structure that CKEditor produced (p, strong, em, u,
 * ul/ol/li, h2/h3, a[href]) so Loom remains compatible.
 */
export function RichTextEditor({
  value,
  onChange,
  placeholder,
  className,
  id,
}: RichTextEditorProps) {
  // Track whether the current editor HTML matches the incoming value prop so
  // we only call setContent when the value genuinely changed externally.
  const lastEmitted = useRef<string>("");

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        // StarterKit includes heading — configure to restrict to h2/h3
        heading: { levels: [2, 3] },
        // Disable code block; CKEditor output doesn't use it and it adds bulk
        codeBlock: false,
        code: false,
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { target: "_blank", rel: "noopener noreferrer" },
      }),
      Placeholder.configure({
        placeholder: placeholder ?? "Start typing…",
      }),
    ],
    content: value || "<p></p>",
    onUpdate({ editor: ed }) {
      const html = ed.getHTML();
      // Avoid firing onChange with the empty-doc sentinel Tiptap returns
      const normalized = html === "<p></p>" ? "" : html;
      lastEmitted.current = normalized;
      onChange(normalized);
    },
    // Suppress SSR mismatch — editor renders fully client-side
    immediatelyRender: false,
  });

  // Sync when the parent changes value externally (e.g. product data load)
  useEffect(() => {
    if (!editor) return;
    const current = editor.getHTML();
    const normalized = current === "<p></p>" ? "" : current;
    if (value !== normalized && value !== lastEmitted.current) {
      editor.commands.setContent(value || "<p></p>", { emitUpdate: false });
      lastEmitted.current = value;
    }
  }, [value, editor]);

  const setLink = useCallback(() => {
    if (!editor) return;
    const prev = editor.getAttributes("link").href as string | undefined;
    // eslint-disable-next-line no-alert
    const url = window.prompt("Enter URL:", prev ?? "https://");
    if (url === null) return; // cancelled
    if (url === "") {
      editor.chain().focus().unsetLink().run();
    } else {
      editor.chain().focus().setLink({ href: url }).run();
    }
  }, [editor]);

  if (!editor) return null;

  return (
    <div className={cn("flex flex-col rounded-lg border", className)} style={{ borderColor: "#E8E4DE" }}>
      {/* Toolbar */}
      <div
        className="flex flex-wrap items-center gap-0.5 border-b px-2 py-1.5 rounded-t-lg"
        style={{ borderColor: "#E8E4DE", background: "#FAF9F7" }}
        id={id ? `${id}-toolbar` : undefined}
      >
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          active={editor.isActive("bold")}
          title="Bold (Ctrl+B)"
        >
          <Bold size={14} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          active={editor.isActive("italic")}
          title="Italic (Ctrl+I)"
        >
          <Italic size={14} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          active={editor.isActive("underline")}
          title="Underline (Ctrl+U)"
        >
          <UnderlineIcon size={14} />
        </ToolbarButton>

        <Divider />

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          active={editor.isActive("heading", { level: 2 })}
          title="Heading 2"
        >
          <Heading2 size={14} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          active={editor.isActive("heading", { level: 3 })}
          title="Heading 3"
        >
          <Heading3 size={14} />
        </ToolbarButton>

        <Divider />

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          active={editor.isActive("bulletList")}
          title="Bullet list"
        >
          <List size={14} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          active={editor.isActive("orderedList")}
          title="Numbered list"
        >
          <ListOrdered size={14} />
        </ToolbarButton>

        <Divider />

        <ToolbarButton
          onClick={setLink}
          active={editor.isActive("link")}
          title="Insert / edit link"
        >
          <LinkIcon size={14} />
        </ToolbarButton>

        <Divider />

        <ToolbarButton
          onClick={() => editor.chain().focus().undo().run()}
          active={false}
          title="Undo (Ctrl+Z)"
          disabled={!editor.can().undo()}
        >
          <Undo2 size={14} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().redo().run()}
          active={false}
          title="Redo (Ctrl+Y)"
          disabled={!editor.can().redo()}
        >
          <Redo2 size={14} />
        </ToolbarButton>
      </div>

      {/* Editor content area */}
      <EditorContent
        id={id}
        editor={editor}
        className="weave-rte-content"
      />

      {/* Scoped ProseMirror styles */}
      <style>{`
        .weave-rte-content .ProseMirror {
          min-height: 120px;
          padding: 10px 12px;
          outline: none;
          font-size: 0.875rem;
          line-height: 1.6;
          color: #1A1714;
        }
        .weave-rte-content .ProseMirror p { margin: 0 0 0.5em; }
        .weave-rte-content .ProseMirror p:last-child { margin-bottom: 0; }
        .weave-rte-content .ProseMirror h2 { font-size: 1.1em; font-weight: 600; margin: 0.75em 0 0.35em; }
        .weave-rte-content .ProseMirror h3 { font-size: 1em; font-weight: 600; margin: 0.6em 0 0.25em; }
        .weave-rte-content .ProseMirror ul,
        .weave-rte-content .ProseMirror ol { padding-left: 1.4em; margin: 0.4em 0; }
        .weave-rte-content .ProseMirror li { margin-bottom: 0.15em; }
        .weave-rte-content .ProseMirror a { color: #7C5A3C; text-decoration: underline; }
        .weave-rte-content .ProseMirror strong { font-weight: 600; }
        .weave-rte-content .ProseMirror em { font-style: italic; }
        .weave-rte-content .ProseMirror .is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left;
          color: #B0A99F;
          pointer-events: none;
          height: 0;
        }
      `}</style>
    </div>
  );
}

// ── Internal toolbar helpers ─────────────────────────────────────────────────

interface ToolbarButtonProps {
  onClick: () => void;
  active: boolean;
  title: string;
  disabled?: boolean;
  children: React.ReactNode;
}

function ToolbarButton({ onClick, active, title, disabled, children }: ToolbarButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      disabled={disabled}
      className={cn(
        "flex h-7 w-7 items-center justify-center rounded transition-colors",
        active
          ? "bg-[#E8E4DE] text-[#1A1714]"
          : "text-[#847D77] hover:bg-[#F0EDE9] hover:text-[#1A1714]",
        disabled && "opacity-35 cursor-not-allowed",
      )}
    >
      {children}
    </button>
  );
}

function Divider() {
  return (
    <div
      className="mx-1 h-4 w-px self-center"
      style={{ background: "#E8E4DE" }}
    />
  );
}
