"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { deleteContentAction, saveContentAction } from "@/app/actions";
import type { ContentItem, ContentType } from "@/lib/types";
import { slugify } from "@/lib/slug";

const tabs: { label: string; value: ContentType }[] = [
  { label: "Intro", value: "intro" },
  { label: "Sections", value: "section" },
  { label: "Projects", value: "project" },
  { label: "Posts", value: "post" }
];

const initialState = { ok: true, message: "" };

export function AdminEditor({ items }: { items: ContentItem[] }) {
  const router = useRouter();
  const [activeType, setActiveType] = useState<ContentType>("project");
  const [selected, setSelected] = useState<ContentItem | null>(null);
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
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
  }

  function newItem() {
    setSelected(null);
    setTitle("");
    setSlug("");
  }

  return (
    <div className="admin-editor">
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

      {state.message ? <p className={state.ok ? "form-success" : "form-error"}>{state.message}</p> : null}

      <form action={formAction} className="content-form" key={selected?.id || `new-${activeType}`}>
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
        <label>
          Article Body
          <textarea name="body" rows={10} defaultValue={selected?.body || ""} />
        </label>
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
          <button className="liquid-button secondary" onClick={newItem} type="button">
            New Item
          </button>
        </div>
      </form>

      <div className="admin-list">
        {activeItems.map((item) => (
          <div className="admin-item" key={item.id}>
            <div>
              <strong>{item.title}</strong>
              <span>{item.slug}</span>
            </div>
            <div className="admin-actions">
              <button className="mini-button" onClick={() => editItem(item)} type="button">
                Edit
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
          </div>
        ))}
      </div>
    </div>
  );
}
