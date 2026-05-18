import ReactMarkdown from "react-markdown";

type MarkdownBlock =
  | { type: "markdown"; content: string }
  | { type: "align"; align: "left" | "center" | "right"; content: string };

function parseAlignedMarkdown(content: string) {
  const lines = content.split(/\r?\n/);
  const blocks: MarkdownBlock[] = [];
  let buffer: string[] = [];
  let alignedBuffer: string[] | null = null;
  let align: "left" | "center" | "right" = "left";

  function flushMarkdown() {
    const text = buffer.join("\n").trim();
    if (text) blocks.push({ type: "markdown", content: text });
    buffer = [];
  }

  for (const line of lines) {
    const openMatch = line.match(/^:::\s*align-(left|center|right)\s*$/);
    if (openMatch && !alignedBuffer) {
      flushMarkdown();
      align = openMatch[1] as "left" | "center" | "right";
      alignedBuffer = [];
      continue;
    }

    if (line.trim() === ":::" && alignedBuffer) {
      blocks.push({ type: "align", align, content: alignedBuffer.join("\n").trim() });
      alignedBuffer = null;
      align = "left";
      continue;
    }

    if (alignedBuffer) alignedBuffer.push(line);
    else buffer.push(line);
  }

  if (alignedBuffer) blocks.push({ type: "align", align, content: alignedBuffer.join("\n").trim() });
  flushMarkdown();

  return blocks;
}

export function ArticleMarkdown({ content }: { content: string }) {
  const blocks = parseAlignedMarkdown(content);

  return (
    <>
      {blocks.map((block, index) =>
        block.type === "align" ? (
          <div className={`align-block align-${block.align}`} key={`${block.type}-${index}`}>
            <ReactMarkdown>{block.content}</ReactMarkdown>
          </div>
        ) : (
          <ReactMarkdown key={`${block.type}-${index}`}>{block.content}</ReactMarkdown>
        )
      )}
    </>
  );
}
