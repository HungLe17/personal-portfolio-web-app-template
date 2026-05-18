import Image from "next/image";
import Link from "next/link";
import { getRouteForItem } from "@/lib/content";
import type { ContentItem } from "@/lib/types";

export function ContentCard({ item, variant }: { item: ContentItem; variant: string }) {
  return (
    <article className={`glass-panel ${variant}`}>
      {item.image ? (
        <div className="card-media">
          <Image src={item.image} alt={`${item.title} preview`} fill sizes="(max-width: 768px) 100vw, 33vw" />
        </div>
      ) : null}
      <span className="card-category">{item.category}</span>
      <h3>{item.title}</h3>
      <p>{item.description}</p>
      <div className="tag-row">
        {item.tags.map((tag) => (
          <span className="tag" key={tag}>
            {tag}
          </span>
        ))}
      </div>
      <Link className="card-link detail-link" href={getRouteForItem(item)}>
        Open page
      </Link>
      {item.link ? (
        <a className="card-link" href={item.link} target="_blank" rel="noreferrer">
          Visit link
        </a>
      ) : null}
    </article>
  );
}
