"use client";

import { useActionState, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { AlertCircle, CheckCircle2, Cloud, Loader2, Rocket, Save, UserCircle2 } from "lucide-react";
import dynamic from "next/dynamic";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import { deleteContentAction, saveContentAction } from "@/app/actions";
import type { ContentFormState, ContentItem, ContentType } from "@/lib/types";
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

const initialState: ContentFormState = { ok: true, message: "", item: null };

function EditorSubmitButton({
  children,
  icon,
  intent,
  variant = "secondary"
}: {
  children: React.ReactNode;
  icon: React.ReactNode;
  intent: "save" | "draft" | "publish" | "autosave";
  variant?: "primary" | "secondary";
}) {
  const { pending } = useFormStatus();

  return (
    <button
      className={`liquid-button ${variant} editor-save-button`}
      disabled={pending}
      name="publish_action"
      type="submit"
      value={intent}
    >
      {pending ? <Loader2 className="button-spinner" aria-hidden="true" size={16} /> : icon}
      <span>{pending ? "Saving..." : children}</span>
    </button>
  );
}

function buildSnapshot(type: ContentType, id: string, title: string, slug: string, body: string) {
  return JSON.stringify({ type, id, title: title.trim(), slug: slug.trim(), body });
}

export function AdminEditor({ items, username }: { items: ContentItem[]; username: string }) {
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
  const [notice, setNotice] = useState<ContentFormState>(initialState);
  const [dirty, setDirty] = useState(false);
  const [autosaveState, setAutosaveState] = useState<"idle" | "queued" | "saving" | "saved">("idle");
  const autosaveButtonRef = useRef<HTMLButtonElement | null>(null);
  const lastSubmittedSnapshot = useRef(
    buildSnapshot("project", initialItem?.id || "", initialItem?.title || "", initialItem?.slug || "", initialItem?.body || "")
  );

  const activeItems = useMemo(
    () => items.filter((item) => item.type === activeType).sort((a, b) => a.sort_order - b.sort_order),
    [activeType, items]
  );
  const activeTabIndex = Math.max(0, tabs.findIndex((tab) => tab.value === activeType));

  useEffect(() => {
    if (!state.message) return;
    setNotice(state);

    if (state.ok && state.item) {
      setSelected(state.item);
      setActiveType(state.item.type);
      setTitle(state.item.title);
      setSlug(state.item.slug);
      setBody(state.item.body || "");
      setDirty(false);
      setAutosaveState("saved");
      lastSubmittedSnapshot.current = buildSnapshot(state.item.type, state.item.id, state.item.title, state.item.slug, state.item.body || "");
      router.refresh();
    }
  }, [router, state]);

  useEffect(() => {
    if (!notice.message) return;
    const timer = window.setTimeout(() => setNotice(initialState), notice.ok ? 3600 : 5600);
    return () => window.clearTimeout(timer);
  }, [notice]);

  function editItem(item: ContentItem) {
    setSelected(item);
    setTitle(item.title);
    setSlug(item.slug);
    setBody(item.body || "");
    setDirty(false);
    setAutosaveState("idle");
    lastSubmittedSnapshot.current = buildSnapshot(item.type, item.id, item.title, item.slug, item.body || "");
  }

  function newItem() {
    setSelected(null);
    setTitle("");
    setSlug("");
    setBody("");
    setDirty(false);
    setAutosaveState("idle");
    lastSubmittedSnapshot.current = buildSnapshot(activeType, "", "", "", "");
  }

  function markDirty() {
    setDirty(true);
    setAutosaveState("queued");
  }

  useEffect(() => {
    if (!dirty || !title.trim()) return;

    const timer = window.setTimeout(() => {
      const id = selected?.id || "";
      const snapshot = buildSnapshot(activeType, id, title, slug, body);
      if (snapshot === lastSubmittedSnapshot.current) {
        setDirty(false);
        setAutosaveState("saved");
        return;
      }

      setAutosaveState("saving");
      lastSubmittedSnapshot.current = snapshot;
      autosaveButtonRef.current?.click();
    }, 4500);

    return () => window.clearTimeout(timer);
  }, [activeType, body, dirty, selected?.id, slug, title]);

  return (
    <div className="admin-editor">
      {notice.message ? (
        <div className={`editor-toast ${notice.ok ? "is-success" : "is-error"}`} role="status" aria-live="polite">
          {notice.ok ? <CheckCircle2 aria-hidden="true" size={18} /> : <AlertCircle aria-hidden="true" size={18} />}
          <span>{notice.message}</span>
          <button type="button" onClick={() => setNotice(initialState)} aria-label="Dismiss notification">
            Dismiss
          </button>
        </div>
      ) : null}

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

      <form
        action={formAction}
        className="content-form editor-surface"
        key={selected?.id || `new-${activeType}`}
        onInput={markDirty}
      >
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
                markDirty();
              }}
            />
            <div className="editor-identity-row">
              <span className="logged-in-chip">
                <UserCircle2 aria-hidden="true" size={14} />
                Logged in as {username}
              </span>
              <span className={`autosave-chip is-${autosaveState}`}>
                <Cloud aria-hidden="true" size={14} />
                {autosaveState === "saving"
                  ? "Autosaving..."
                  : autosaveState === "queued"
                    ? "Autosave queued"
                    : autosaveState === "saved"
                      ? "Saved"
                      : "Autosave ready"}
              </span>
            </div>
          </div>
          <div className="editor-workbar-actions">
            <span className={`publish-status ${selected?.is_published ?? true ? "is-live" : "is-draft"}`}>
              {selected?.is_published ?? true ? "Live" : "Draft"}
            </span>
            <EditorSubmitButton intent="draft" icon={<Save aria-hidden="true" size={16} />}>
              Save Draft
            </EditorSubmitButton>
            <EditorSubmitButton intent="publish" icon={<Rocket aria-hidden="true" size={16} />} variant="primary">
              Publish
            </EditorSubmitButton>
          </div>
        </div>

        <input name="id" type="hidden" value={selected?.id || ""} />
        <input name="type" type="hidden" value={activeType} />
        <button
          aria-hidden="true"
          className="editor-hidden-submit"
          name="publish_action"
          ref={autosaveButtonRef}
          tabIndex={-1}
          type="submit"
          value="autosave"
        />

        <div className="editor-inspector-row">
          <details className="editor-document-options glass-dropdown" open={!selected}>
            <summary>
              <span>Document details</span>
              <small>Slug, category, summary</small>
            </summary>
            <div className="editor-metadata-grid">
              <label>
                Slug
                <input
                  name="slug"
                  required
                  value={slug}
                  onChange={(event) => {
                    setSlug(slugify(event.target.value));
                    markDirty();
                  }}
                />
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

          <details className="editor-document-options glass-dropdown">
            <summary>
              <span>Publishing and card</span>
              <small>Tags, image, visibility</small>
            </summary>
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
                Include in public site when using regular Save
              </label>
            </div>
          </details>
        </div>

        <div className="editor-shell">
          <input name="body" type="hidden" value={body} readOnly />
          <RichArticleEditor
            content={body}
            onChange={(html) => {
              setBody(html);
              markDirty();
            }}
          />
        </div>
      </form>
    </div>
  );
}
