"use client";

import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  CheckSquare2,
  Code2,
  FileCode2,
  Heading2,
  Heading3,
  Highlighter,
  ImageIcon,
  Italic,
  Link2,
  List,
  ListOrdered,
  Minus,
  Pilcrow,
  Quote,
  Redo2,
  RemoveFormatting,
  Strikethrough,
  Table2,
  Underline as UnderlineIcon,
  Undo2
} from "lucide-react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import TextAlign from "@tiptap/extension-text-align";
import Underline from "@tiptap/extension-underline";
import Highlight from "@tiptap/extension-highlight";
import Placeholder from "@tiptap/extension-placeholder";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableHeader } from "@tiptap/extension-table-header";
import { TableCell } from "@tiptap/extension-table-cell";
import { marked } from "marked";
import { useEffect, useRef } from "react";

type RichArticleEditorProps = {
  content: string;
  onChange: (html: string) => void;
};

function containsHtml(content: string) {
  return /<\/?[a-z][\s\S]*>/i.test(content);
}

function normalizeContent(content: string) {
  if (!content) return "";
  if (containsHtml(content)) return content;
  return String(marked.parse(content, { async: false }));
}

const ArticleImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      alignment: {
        default: "center",
        parseHTML: (element) =>
          element.classList.contains("align-left")
            ? "left"
            : element.classList.contains("align-right")
              ? "right"
              : "center"
      },
      size: {
        default: "wide",
        parseHTML: (element) =>
          element.classList.contains("size-medium")
            ? "medium"
            : element.classList.contains("size-full")
              ? "full"
              : "wide"
      }
    };
  },
  renderHTML({ HTMLAttributes }) {
    const alignment = HTMLAttributes.alignment || "center";
    const size = HTMLAttributes.size || "wide";
    const attributes = { ...HTMLAttributes };
    delete attributes.alignment;
    delete attributes.size;
    attributes.class = `note-image align-${alignment} size-${size}`;
    return ["img", attributes];
  }
}).configure({ allowBase64: true });

function imageFileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error);
    reader.onload = () => {
      if (typeof reader.result !== "string") return reject(new Error("Unable to read image."));
      const image = new window.Image();
      image.onerror = () => reject(new Error("Unable to decode image."));
      image.onload = () => {
        const maxWidth = 1800;
        const scale = Math.min(1, maxWidth / image.width);
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(image.width * scale));
        canvas.height = Math.max(1, Math.round(image.height * scale));
        const context = canvas.getContext("2d");
        if (!context) return reject(new Error("Unable to process image."));
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.88));
      };
      image.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

function ToolbarButton({
  active = false,
  disabled = false,
  label,
  onClick,
  children
}: {
  active?: boolean;
  disabled?: boolean;
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      className={`editor-command ${active ? "is-active" : ""}`}
      disabled={disabled}
      onClick={onClick}
      title={label}
      type="button"
      aria-label={label}
      aria-pressed={active}
    >
      {children}
    </button>
  );
}

export function RichArticleEditor({ content, onChange }: RichArticleEditorProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const initialContent = useRef(normalizeContent(content));

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        link: false,
        underline: false
      }),
      ArticleImage,
      Link.configure({
        openOnClick: false,
        autolink: true,
        defaultProtocol: "https://",
        HTMLAttributes: { rel: "noopener noreferrer" }
      }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Underline,
      Highlight.configure({ multicolor: false }),
      Placeholder.configure({
        placeholder: "Start writing. Paste formatted text or images directly into the article."
      }),
      TaskList,
      TaskItem.configure({ nested: true }),
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell
    ],
    content: initialContent.current,
    editorProps: {
      attributes: {
        class: "word-editor tiptap-editor",
        "aria-label": "Article body rich text editor"
      },
      handlePaste(view, event) {
        const image = Array.from(event.clipboardData?.files || []).find((file) => file.type.startsWith("image/"));
        if (image) {
          event.preventDefault();
          void imageFileToDataUrl(image).then((src) => {
            editor?.chain().focus().setImage({ src, alt: image.name || "Pasted image" }).run();
          });
          return true;
        }

        const html = event.clipboardData?.getData("text/html");
        const text = event.clipboardData?.getData("text/plain") || "";
        const looksLikeMarkdown = /(^|\n)(#{1,3}\s|[-*]\s|\d+\.\s|>\s|```)|\*\*[^*]+\*\*/.test(text);
        if (!html && looksLikeMarkdown) {
          event.preventDefault();
          editor?.chain().focus().insertContent(String(marked.parse(text, { async: false }))).run();
          return true;
        }

        return false;
      },
      handleDrop(view, event) {
        const image = Array.from(event.dataTransfer?.files || []).find((file) => file.type.startsWith("image/"));
        if (!image) return false;
        event.preventDefault();
        void imageFileToDataUrl(image).then((src) => {
          const position = view.posAtCoords({ left: event.clientX, top: event.clientY })?.pos;
          if (typeof position === "number") {
            editor?.chain().focus().insertContentAt(position, { type: "image", attrs: { src, alt: image.name } }).run();
          }
        });
        return true;
      }
    },
    onUpdate: ({ editor: currentEditor }) => onChange(currentEditor.getHTML())
  });

  useEffect(() => {
    if (editor) onChange(editor.getHTML());
  }, [editor, onChange]);

  if (!editor) return <div className="word-editor editor-loading">Loading editor...</div>;

  function setLink() {
    const previousUrl = editor?.getAttributes("link").href || "";
    const url = window.prompt("Link URL", previousUrl);
    if (url === null) return;
    if (!url.trim()) {
      editor?.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor?.chain().focus().extendMarkRange("link").setLink({ href: url.trim() }).run();
  }

  function insertImageUrl() {
    const source = window.prompt("Image URL");
    if (source?.trim()) editor?.chain().focus().setImage({ src: source.trim(), alt: "Article image" }).run();
  }

  function updateImage(alignment: "left" | "center" | "right", size: "medium" | "wide" | "full") {
    editor?.chain().focus().updateAttributes("image", { alignment, size }).run();
  }

  const imageSelected = editor.isActive("image");

  return (
    <div className="rich-editor">
      <div className="editor-menubar" role="toolbar" aria-label="Article formatting">
        <div className="editor-command-group">
          <ToolbarButton label="Undo" disabled={!editor.can().undo()} onClick={() => editor.chain().focus().undo().run()}>
            <Undo2 size={17} />
          </ToolbarButton>
          <ToolbarButton label="Redo" disabled={!editor.can().redo()} onClick={() => editor.chain().focus().redo().run()}>
            <Redo2 size={17} />
          </ToolbarButton>
        </div>

        <div className="editor-command-group">
          <ToolbarButton label="Paragraph" active={editor.isActive("paragraph")} onClick={() => editor.chain().focus().setParagraph().run()}>
            <Pilcrow size={17} />
          </ToolbarButton>
          <ToolbarButton label="Heading 2" active={editor.isActive("heading", { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
            <Heading2 size={18} />
          </ToolbarButton>
          <ToolbarButton label="Heading 3" active={editor.isActive("heading", { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>
            <Heading3 size={18} />
          </ToolbarButton>
        </div>

        <div className="editor-command-group">
          <ToolbarButton label="Bold" active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()}>
            <Bold size={17} />
          </ToolbarButton>
          <ToolbarButton label="Italic" active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()}>
            <Italic size={17} />
          </ToolbarButton>
          <ToolbarButton label="Underline" active={editor.isActive("underline")} onClick={() => editor.chain().focus().toggleUnderline().run()}>
            <UnderlineIcon size={17} />
          </ToolbarButton>
          <ToolbarButton label="Strike" active={editor.isActive("strike")} onClick={() => editor.chain().focus().toggleStrike().run()}>
            <Strikethrough size={17} />
          </ToolbarButton>
          <ToolbarButton label="Highlight" active={editor.isActive("highlight")} onClick={() => editor.chain().focus().toggleHighlight().run()}>
            <Highlighter size={17} />
          </ToolbarButton>
          <ToolbarButton label="Inline code" active={editor.isActive("code")} onClick={() => editor.chain().focus().toggleCode().run()}>
            <Code2 size={17} />
          </ToolbarButton>
          <ToolbarButton label="Code block" active={editor.isActive("codeBlock")} onClick={() => editor.chain().focus().toggleCodeBlock().run()}>
            <FileCode2 size={17} />
          </ToolbarButton>
        </div>

        <div className="editor-command-group">
          <ToolbarButton label="Bullet list" active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()}>
            <List size={18} />
          </ToolbarButton>
          <ToolbarButton label="Numbered list" active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
            <ListOrdered size={18} />
          </ToolbarButton>
          <ToolbarButton label="Task list" active={editor.isActive("taskList")} onClick={() => editor.chain().focus().toggleTaskList().run()}>
            <CheckSquare2 size={18} />
          </ToolbarButton>
          <ToolbarButton label="Quote" active={editor.isActive("blockquote")} onClick={() => editor.chain().focus().toggleBlockquote().run()}>
            <Quote size={17} />
          </ToolbarButton>
        </div>

        <div className="editor-command-group">
          <ToolbarButton label="Align left" active={editor.isActive({ textAlign: "left" })} onClick={() => editor.chain().focus().setTextAlign("left").run()}>
            <AlignLeft size={18} />
          </ToolbarButton>
          <ToolbarButton label="Align center" active={editor.isActive({ textAlign: "center" })} onClick={() => editor.chain().focus().setTextAlign("center").run()}>
            <AlignCenter size={18} />
          </ToolbarButton>
          <ToolbarButton label="Align right" active={editor.isActive({ textAlign: "right" })} onClick={() => editor.chain().focus().setTextAlign("right").run()}>
            <AlignRight size={18} />
          </ToolbarButton>
        </div>

        <div className="editor-command-group">
          <ToolbarButton label="Link" active={editor.isActive("link")} onClick={setLink}>
            <Link2 size={17} />
          </ToolbarButton>
          <ToolbarButton label="Horizontal line" onClick={() => editor.chain().focus().setHorizontalRule().run()}>
            <Minus size={18} />
          </ToolbarButton>
          <ToolbarButton label="Insert image" onClick={() => fileInputRef.current?.click()}>
            <ImageIcon size={18} />
          </ToolbarButton>
          <ToolbarButton label="Image from URL" onClick={insertImageUrl}>
            <ImageIcon size={18} />
            <span className="editor-command-text">URL</span>
          </ToolbarButton>
          <ToolbarButton label="Insert table" onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}>
            <Table2 size={18} />
          </ToolbarButton>
          <ToolbarButton label="Clear formatting" onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}>
            <RemoveFormatting size={18} />
          </ToolbarButton>
        </div>

        {imageSelected ? (
          <div className="editor-command-group editor-image-tools">
            <button type="button" onClick={() => updateImage("left", "medium")}>Left</button>
            <button type="button" onClick={() => updateImage("center", "wide")}>Center</button>
            <button type="button" onClick={() => updateImage("right", "medium")}>Right</button>
            <button type="button" onClick={() => updateImage("center", "full")}>Full</button>
          </div>
        ) : null}

        {editor.isActive("table") ? (
          <div className="editor-command-group editor-table-tools">
            <button type="button" onClick={() => editor.chain().focus().addColumnAfter().run()}>+ Column</button>
            <button type="button" onClick={() => editor.chain().focus().deleteColumn().run()}>- Column</button>
            <button type="button" onClick={() => editor.chain().focus().addRowAfter().run()}>+ Row</button>
            <button type="button" onClick={() => editor.chain().focus().deleteRow().run()}>- Row</button>
            <button type="button" onClick={() => editor.chain().focus().toggleHeaderRow().run()}>Header</button>
            <button type="button" onClick={() => editor.chain().focus().deleteTable().run()}>Delete table</button>
          </div>
        ) : null}
      </div>

      <input
        ref={fileInputRef}
        hidden
        type="file"
        accept="image/*"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (!file) return;
          void imageFileToDataUrl(file).then((src) => {
            editor.chain().focus().setImage({ src, alt: file.name }).run();
            event.target.value = "";
          });
        }}
      />
      <EditorContent className="editor-document-scroll" editor={editor} />
      <div className="editor-footer">
        <span>{editor.getText().trim() ? editor.getText().trim().split(/\s+/).length : 0} words</span>
        <span>{editor.getText().length} characters</span>
      </div>
    </div>
  );
}
