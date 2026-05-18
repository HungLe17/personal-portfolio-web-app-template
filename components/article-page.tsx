import Image from "next/image";
import Link from "next/link";
import { ArticleMarkdown } from "@/components/article-markdown";
import type { ContentItem } from "@/lib/types";

export function ArticlePage({ item, label }: { item: ContentItem; label: string }) {
  return (
    <main className="detail-page section-shell">
      <article className={`glass-panel detail-card no-glass-hover ${item.image ? "has-detail-media" : ""}`}>
        <Link className="detail-back" href="/#work">
          Back to portfolio
        </Link>
        {item.image ? (
          <div className="detail-media">
            <Image src={item.image} alt={`${item.title} preview`} fill priority sizes="(max-width: 768px) 100vw, 1120px" />
          </div>
        ) : null}
        <div className="detail-content">
          <div className="detail-article-meta">
            <span>{label}</span>
            <span>{item.category}</span>
          </div>
          <h1>{item.title}</h1>
          <p className="detail-description">{item.description}</p>
          <div className="detail-body">
            <ArticleMarkdown content={item.body || item.description} />
          </div>
          <div className="tag-row">
            {item.tags.map((tag) => (
              <span className="tag" key={tag}>
                {tag}
              </span>
            ))}
          </div>
          <div className="detail-actions">
            {item.link ? (
              <a className="liquid-button primary" href={item.link} target="_blank" rel="noreferrer">
                Visit Link
              </a>
            ) : null}
            <Link className="liquid-button secondary" href="/#contact">
              Contact
            </Link>
          </div>
        </div>
      </article>
    </main>
  );
}
