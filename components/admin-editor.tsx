"use client";

import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import type { ClipboardEvent } from "react";
import { useRouter } from "next/navigation";
import { deleteContentAction, saveContentAction } from "@/app/actions";
import { ArticleMarkdown } from "@/components/article-markdown";
import type { ContentItem, ContentType } from "@/lib/types";
import { slugify } from "@/lib/slug";

const tabs: { label: string; value: ContentType }[] = [
  { label: "Intro", value: "intro" },
  { label: "Sections", value: "section" },
  { label: "Projects", value: "project" },
  { label: "Posts", value: "post" }
];

const initialState = { ok: true, message: "" };

const editorTools = [
  { label: "H2", before: "## ", after: "", fallback: "Section heading" },
  { label: "H3", before: "### ", after: "", fallback: "Subheading" },
  { label: "B", before: "**", after: "**", fallback: "bold text" },
  { label: "I", before: "*", after: "*", fallback: "italic text" },
  { label: "UL", before: "- ", after: "", fallback: "List item" },
  { label: "OL", before: "1. ", after: "", fallback: "List item" },
  { label: "Quote", before: "> ", after: "", fallback: "Quoted insight" },
  { label: "Code", before: "`", after: "`", fallback: "code" },
  { label: "Block", before: "```\n", after: "\n```", fallback: "code block" },
  { label: "Link", before: "[", after: "](https://example.com)", fallback: "link text" },
  { label: "Divider", before: "\n\n---\n\n", after: "", fallback: "" }
];

export function AdminEditor({ items }: { items: ContentItem[] }) {
  const router = useRouter();
  const [activeType, setActiveType] = useState<ContentType>("project");
  const [selected, setSelected] = useState<ContentItem | null>(null);
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [body, setBody] = useState("");
  const bodyRef = useRef<HTMLTextAreaElement | null>(null);
  const [state, formAction] = useActionState(saveContentAction, initialState);

  const activeItems = useMemo(
    () => items.filter((item) => item.type === activeType).sort((a, b) => a.sort_order - b.sort_order),
    [activeType, items]
  );

  useEffect(() => {
    if (state.ok && state.message) {
      router.refresh();
    }
  }, [router, state]);

  function editItem(item: ContentItem) {
    setSelected(item);
    setTitle(item.title);
    setSlug(item.slug);
    setBody(item.body || "");
  }

  function newItem() {
    setSelected(null);
    setTitle("");
    setSlug("");
    setBody("");
  }

  function updateBody(nextBody: string, cursorPosition?: number) {
    setBody(nextBody);
    requestAnimationFrame(() => {
      const textarea = bodyRef.current;
      if (!textarea) return;
      textarea.focus();
      if (typeof cursorPosition === "number") {
        textarea.setSelectionRange(cursorPosition, cursorPosition);
      }
    });
  }

  function insertMarkdown(before: string, after: string, fallback: string) {
    const textarea = bodyRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = body.slice(start, end) || fallback;
    const nextBody = `${body.slice(0, start)}${before}${selectedText}${after}${body.slice(end)}`;
    const cursorPosition = start + before.length + selectedText.length + after.length;

    updateBody(nextBody, cursorPosition);
  }

  function alignSelection(align: "left" | "center" | "right") {
    const textarea = bodyRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = body.slice(start, end) || "Aligned paragraph";
    const wrapped = `::: align-${align}\n${selectedText}\n:::`;
    const nextBody = `${body.slice(0, start)}${wrapped}${body.slice(end)}`;
    updateBody(nextBody, start + wrapped.length);
  }

  function insertImageMarkdown(source: string, alt = "Image") {
    const textarea = bodyRef.current;
    const start = textarea?.selectionStart ?? body.length;
    const imageMarkdown = `\n\n![${alt}](${source})\n\n`;
    updateBody(`${body.slice(0, start)}${imageMarkdown}${body.slice(start)}`, start + imageMarkdown.length);
  }

  function insertImageUrl() {
    const source = window.prompt("Image URL");
    if (source) insertImageMarkdown(source, "Image");
  }

  function handleEditorPaste(event: ClipboardEvent<HTMLTextAreaElement>) {
    const imageItem = Array.from(event.clipboardData.items).find((item) => item.type.startsWith("image/"));
    if (!imageItem) return;

    const file = imageItem.getAsFile();
    if (!file) return;

    event.preventDefault();
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        insertImageMarkdown(reader.result, file.name.replace(/\.[^.]+$/, "") || "Pasted image");
      }
    };
    reader.readAsDataURL(file);
  }

  return (
    <div className="admin-editor">
      <aside className="admin-sidebar">
        <div className={`admin-tabs is-${activeType === "section" ? "sections" : activeType === "project" ? "projects" : activeType === "post" ? "posts" : "intro"}`}>
          {tabs.map((tab) => (
            <button
              className={`tab-button ${activeType === tab.value ? "active" : ""}`}
              key={tab.value}
              onClick={() => {
                setActiveType(tab.value);
                newItem();
              }}
              type="button"
            >
              {tab.label}
            </button>
          ))}
        </div>

        <button className="liquid-button secondary admin-new-button" onClick={newItem} type="button">
          New {activeType}
        </button>

        <div className="admin-list">
          {activeItems.map((item) => (
            <div className={`admin-item ${selected?.id === item.id ? "active" : ""}`} key={item.id}>
              <button className="admin-item-main" onClick={() => editItem(item)} type="button">
                <strong>{item.title}</strong>
                <span>{item.slug}</span>
              </button>
              {item.type !== "intro" ? (
                <form action={deleteContentAction}>
                  <input name="id" type="hidden" value={item.id} />
                  <button className="mini-button" type="submit">
                    Delete
                  </button>
                </form>
              ) : null}
            </div>
          ))}
        </div>
      </aside>

      <form action={formAction} className="content-form editor-surface" key={selected?.id || `new-${activeType}`}>
        <div className="editor-status-row">
          <div>
            <p className="eyebrow">{selected ? "Editing" : "Creating"}</p>
            <h2>{selected?.title || `New ${activeType}`}</h2>
          </div>
          {state.message ? <p className={state.ok ? "form-success" : "form-error"}>{state.message}</p> : null}
        </div>

        <input name="id" type="hidden" value={selected?.id || ""} />
        <input name="type" type="hidden" value={activeType} />
        <label>
          Title
          <input
            name="title"
            required
            value={title}
            onChange={(event) => {
              setTitle(event.target.value);
              if (!selected) setSlug(slugify(event.target.value));
            }}
          />
        </label>
        <label>
          Slug
          <input name="slug" required value={slug} onChange={(event) => setSlug(slugify(event.target.value))} />
        </label>
        <label>
          Category
          <input name="category" defaultValue={selected?.category || ""} />
        </label>
        <label>
          Description
          <textarea name="description" rows={4} defaultValue={selected?.description || ""} />
        </label>
        <div className="editor-shell">
          <div className="editor-topbar">
            <label htmlFor="article-body">Article Body</label>
            <div className="editor-tools" aria-label="Markdown formatting tools">
              {editorTools.map((tool) => (
                <button
                  className="mini-button editor-tool"
                  key={tool.label}
                  onClick={() => insertMarkdown(tool.before, tool.after, tool.fallback)}
                  type="button"
                >
                  {tool.label}
                </button>
              ))}
              <button className="mini-button editor-tool" onClick={() => alignSelection("left")} type="button">
                Left
              </button>
              <button className="mini-button editor-tool" onClick={() => alignSelection("center")} type="button">
                Center
              </button>
              <button className="mini-button editor-tool" onClick={() => alignSelection("right")} type="button">
                Right
              </button>
              <button className="mini-button editor-tool" onClick={insertImageUrl} type="button">
                Image
              </button>
            </div>
          </div>
          <div className="editor-grid">
            <textarea
              id="article-body"
              name="body"
              ref={bodyRef}
              rows={16}
              value={body}
              onChange={(event) => setBody(event.target.value)}
              onPaste={handleEditorPaste}
              placeholder={"## Project overview\n\nWrite formatted Markdown here. Use headings, lists, links, quotes, and code snippets."}
            />
            <div className="editor-preview detail-body" aria-label="Article preview">
              {body ? <ArticleMarkdown content={body} /> : <p>Preview appears here while you write.</p>}
            </div>
          </div>
        </div>
        <label>
          Tags
          <input name="tags" defaultValue={selected?.tags.join(", ") || ""} placeholder="Design, Next.js, Supabase" />
        </label>
        <label>
          Link
          <input name="link" defaultValue={selected?.link || ""} />
        </label>
        <label>
          Image URL
          <input name="image" defaultValue={selected?.image || ""} />
        </label>
        <label>
          Sort Order
          <input name="sort_order" type="number" defaultValue={selected?.sort_order || 0} />
        </label>
        <label className="checkbox-label">
          <input name="is_published" type="checkbox" defaultChecked={selected?.is_published ?? true} />
          Published
        </label>
        <div className="form-actions">
          <button className="liquid-button primary" type="submit">
            Save Item
          </button>
        </div>
      </form>
    </div>
  );
}
