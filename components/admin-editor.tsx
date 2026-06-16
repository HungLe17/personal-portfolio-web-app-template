"use client";

import { useActionState, useEffect, useMemo, useState, type CSSProperties } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { deleteContentAction, saveContentAction } from "@/app/actions";
import type { ContentItem, ContentType } from "@/lib/types";
import { slugify } from "@/lib/slug";

const RichArticleEditor = dynamic(
  () => import("@/components/rich-article-editor").then((module) => module.RichArticleEditor),
  {
    ssr: false,
    loading: () => <div className="word-editor editor-loading">Loading document editor...</div>
  }
);

const tabs: { label: string; value: ContentType }[] = [
  { label: "Intro", value: "intro" },
  { label: "Sections", value: "section" },
  { label: "Projects", value: "project" },
  { label: "Posts", value: "post" }
];

const initialState = { ok: true, message: "" };

export function AdminEditor({ items }: { items: ContentItem[] }) {
  const initialItem =
    items
      .filter((item) => item.type === "project")
      .sort((a, b) => a.sort_order - b.sort_order)[0] || null;
  const router = useRouter();
  const [activeType, setActiveType] = useState<ContentType>("project");
  const [selected, setSelected] = useState<ContentItem | null>(initialItem);
  const [title, setTitle] = useState(initialItem?.title || "");
  const [slug, setSlug] = useState(initialItem?.slug || "");
  const [body, setBody] = useState(initialItem?.body || "");
  const [state, formAction] = useActionState(saveContentAction, initialState);

  const activeItems = useMemo(
    () => items.filter((item) => item.type === activeType).sort((a, b) => a.sort_order - b.sort_order),
    [activeType, items]
  );
  const activeTabIndex = Math.max(0, tabs.findIndex((tab) => tab.value === activeType));

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

  return (
    <div className="admin-editor">
      <aside className="admin-sidebar">
        <div
          className={`admin-tabs segmented-slider segments-4 is-${activeType === "section" ? "sections" : activeType === "project" ? "projects" : activeType === "post" ? "posts" : "intro"}`}
          style={
            {
              "--segment-count": tabs.length,
              "--segment-index": activeTabIndex
            } as CSSProperties
          }
        >
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
        <div className="editor-workbar">
          <div className="editor-document-heading">
            <p className="eyebrow">{selected ? "Editing" : "Creating"}</p>
            <input
              className="editor-document-title"
              name="title"
              aria-label="Document title"
              placeholder={`Untitled ${activeType}`}
              required
              value={title}
              onChange={(event) => {
                setTitle(event.target.value);
                if (!selected) setSlug(slugify(event.target.value));
              }}
            />
          </div>
          <div className="editor-workbar-actions">
            {state.message ? <p className={state.ok ? "form-success" : "form-error"}>{state.message}</p> : null}
            <button className="liquid-button primary editor-save-button" type="submit">
              Save
            </button>
          </div>
        </div>

        <input name="id" type="hidden" value={selected?.id || ""} />
        <input name="type" type="hidden" value={activeType} />

        <div className="editor-inspector-row">
          <details className="editor-document-options" open={!selected}>
            <summary>Document details</summary>
            <div className="editor-metadata-grid">
              <label>
                Slug
                <input name="slug" required value={slug} onChange={(event) => setSlug(slugify(event.target.value))} />
              </label>
              <label>
                Category
                <input name="category" defaultValue={selected?.category || ""} />
              </label>
              <label className="editor-description-field">
                Description
                <textarea name="description" rows={2} defaultValue={selected?.description || ""} />
              </label>
            </div>
          </details>

          <details className="editor-document-options">
            <summary>Publishing and card</summary>
            <div className="editor-publishing-grid">
              <label>
                Tags
                <input name="tags" defaultValue={selected?.tags.join(", ") || ""} placeholder="Design, Next.js" />
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
            </div>
          </details>
        </div>

        <div className="editor-shell">
          <input name="body" type="hidden" value={body} readOnly />
          <RichArticleEditor content={body} onChange={setBody} />
        </div>
      </form>
    </div>
  );
}
