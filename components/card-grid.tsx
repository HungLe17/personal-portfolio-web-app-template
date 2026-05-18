import { Reveal } from "./reveal";
import { ContentCard } from "./content-card";
import type { ContentItem } from "@/lib/types";

export function CardGrid({ items, variant, className }: { items: ContentItem[]; variant: string; className: string }) {
  return (
    <section className={`section-shell ${className}`}>
      {items.map((item) => (
        <Reveal key={item.id}>
          <ContentCard item={item} variant={variant} />
        </Reveal>
      ))}
    </section>
  );
}
