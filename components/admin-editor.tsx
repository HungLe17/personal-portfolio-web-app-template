"use client";

import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import type { ClipboardEvent, MouseEvent } from "react";
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

function looksLikeHtml(content: string) {
  return /<\/?[a-z][\s\S]*>/i.test(content);
}

function escapeHtml(content: string) {
  return content
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function bodyToEditorHtml(content: string) {
  if (!content) return "";
  if (looksLikeHtml(content)) return content;
  return content
    .split(/\n{2,}/)
    .map((paragraph) => `<p>${escapeHtml(paragraph).replace(/\n/g, "<br>")}</p>`)
    .join("");
}

export function AdminEditor({ items }: { items: ContentItem[] }) {
  const router = useRouter();
  const [activeType, setActiveType] = useState<ContentType>("project");
  const [selected, setSelected] = useState<ContentItem | null>(null);
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [body, setBody] = useState("");
  const [selectedImage, setSelectedImage] = useState<HTMLImageElement | null>(null);
  const editorRef = useRef<HTMLDivElement | null>(null);
  const bodyInputRef = useRef<HTMLInputElement | null>(null);
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
    setBody(bodyToEditorHtml(item.body || ""));
  }

  function newItem() {
    setSelected(null);
    setTitle("");
    setSlug("");
    setBody("");
  }

  function syncEditorBody() {
    if (bodyInputRef.current) {
      bodyInputRef.current.value = editorRef.current?.innerHTML || "";
    }
  }

  function insertImageElement(source: string, alt = "Article image") {
    editorRef.current?.focus();
    document.execCommand(
      "insertHTML",
      false,
      `<p><img class="note-image align-center size-wide" src="${source}" alt="${escapeHtml(alt)}"></p><p><br></p>`
    );
    syncEditorBody();
  }

  function runEditorCommand(command: string, value?: string) {
    editorRef.current?.focus();
    document.execCommand(command, false, value);
    syncEditorBody();
  }

  function formatBlock(tag: "p" | "h2" | "h3" | "blockquote" | "pre") {
    runEditorCommand("formatBlock", tag);
  }

  function insertLink() {
    const url = window.prompt("Link URL");
    if (url) runEditorCommand("createLink", url);
  }

  function insertImageUrl() {
    const source = window.prompt("Image URL");
    if (source) insertImageElement(source);
  }

  function handleEditorPaste(event: ClipboardEvent<HTMLDivElement>) {
    const imageItem = Array.from(event.clipboardData.items).find((item) => item.type.startsWith("image/"));
    if (!imageItem) return;

    const file = imageItem.getAsFile();
    if (!file) return;

    event.preventDefault();
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== "string") return;

      const image = new Image();
      image.onload = () => {
        const maxWidth = 1400;
        const scale = Math.min(1, maxWidth / image.width);
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(image.width * scale);
        canvas.height = Math.round(image.height * scale);
        const context = canvas.getContext("2d");
        if (!context) return;
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        insertImageElement(canvas.toDataURL("image/jpeg", 0.86), file.name.replace(/\.[^.]+$/, "") || "Pasted image");
      };
      image.src = reader.result;
    };
    reader.readAsDataURL(file);
  }

  function handleEditorClick(event: MouseEvent<HTMLDivElement>) {
    const target = event.target;
    if (target instanceof HTMLImageElement) {
      setSelectedImage(target);
      editorRef.current?.querySelectorAll("img.is-selected").forEach((image) => image.classList.remove("is-selected"));
      target.classList.add("is-selected");
      return;
    }

    setSelectedImage(null);
    editorRef.current?.querySelectorAll("img.is-selected").forEach((image) => image.classList.remove("is-selected"));
  }

  function updateImageFigure(className: string) {
    if (!selectedImage) return;

    selectedImage.classList.remove("align-left", "align-center", "align-right", "size-medium", "size-wide", "size-full");
    className.split(" ").forEach((name) => selectedImage.classList.add(name));
    syncEditorBody();
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
            <label htmlFor="article-body">Article Editor</label>
            <div className="editor-tools" aria-label="Rich text formatting tools">
              <button className="mini-button editor-tool" onMouseDown={(event) => event.preventDefault()} onClick={() => formatBlock("p")} type="button">
                Text
              </button>
              <button className="mini-button editor-tool" onMouseDown={(event) => event.preventDefault()} onClick={() => formatBlock("h2")} type="button">
                H2
              </button>
              <button className="mini-button editor-tool" onMouseDown={(event) => event.preventDefault()} onClick={() => formatBlock("h3")} type="button">
                H3
              </button>
              <button className="mini-button editor-tool" onMouseDown={(event) => event.preventDefault()} onClick={() => runEditorCommand("bold")} type="button">
                B
              </button>
              <button className="mini-button editor-tool" onMouseDown={(event) => event.preventDefault()} onClick={() => runEditorCommand("italic")} type="button">
                I
              </button>
              <button className="mini-button editor-tool" onMouseDown={(event) => event.preventDefault()} onClick={() => runEditorCommand("underline")} type="button">
                U
              </button>
              <button className="mini-button editor-tool" onMouseDown={(event) => event.preventDefault()} onClick={() => runEditorCommand("insertUnorderedList")} type="button">
                List
              </button>
              <button className="mini-button editor-tool" onMouseDown={(event) => event.preventDefault()} onClick={() => runEditorCommand("insertOrderedList")} type="button">
                1.
              </button>
              <button className="mini-button editor-tool" onMouseDown={(event) => event.preventDefault()} onClick={() => formatBlock("blockquote")} type="button">
                Quote
              </button>
              <button className="mini-button editor-tool" onMouseDown={(event) => event.preventDefault()} onClick={() => formatBlock("pre")} type="button">
                Code
              </button>
              <button className="mini-button editor-tool" onMouseDown={(event) => event.preventDefault()} onClick={() => runEditorCommand("justifyLeft")} type="button">
                Left
              </button>
              <button className="mini-button editor-tool" onMouseDown={(event) => event.preventDefault()} onClick={() => runEditorCommand("justifyCenter")} type="button">
                Center
              </button>
              <button className="mini-button editor-tool" onMouseDown={(event) => event.preventDefault()} onClick={() => runEditorCommand("justifyRight")} type="button">
                Right
              </button>
              <button className="mini-button editor-tool" onMouseDown={(event) => event.preventDefault()} onClick={insertLink} type="button">
                Link
              </button>
              <button className="mini-button editor-tool" onMouseDown={(event) => event.preventDefault()} onClick={() => runEditorCommand("insertHorizontalRule")} type="button">
                Line
              </button>
              <button className="mini-button editor-tool" onMouseDown={(event) => event.preventDefault()} onClick={insertImageUrl} type="button">
                Image
              </button>
              <button
                className="mini-button editor-tool"
                disabled={!selectedImage}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => updateImageFigure("align-left size-medium")}
                type="button"
              >
                Img Left
              </button>
              <button
                className="mini-button editor-tool"
                disabled={!selectedImage}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => updateImageFigure("align-center size-wide")}
                type="button"
              >
                Img Center
              </button>
              <button
                className="mini-button editor-tool"
                disabled={!selectedImage}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => updateImageFigure("align-right size-medium")}
                type="button"
              >
                Img Right
              </button>
              <button
                className="mini-button editor-tool"
                disabled={!selectedImage}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => updateImageFigure("align-center size-full")}
                type="button"
              >
                Img Full
              </button>
              <button className="mini-button editor-tool" onMouseDown={(event) => event.preventDefault()} onClick={() => runEditorCommand("removeFormat")} type="button">
                Clear
              </button>
            </div>
          </div>
          <input name="body" type="hidden" defaultValue={body} ref={bodyInputRef} />
          <div
            id="article-body"
            className="word-editor"
            contentEditable
            dangerouslySetInnerHTML={{ __html: body }}
            onBlur={syncEditorBody}
            onClick={handleEditorClick}
            onInput={syncEditorBody}
            onPaste={handleEditorPaste}
            ref={editorRef}
            role="textbox"
            aria-label="Article body rich text editor"
            data-placeholder="Start writing your article. Paste images, use the toolbar, and format it like a document."
            suppressContentEditableWarning
          />
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
