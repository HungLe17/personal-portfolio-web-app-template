import { ArticlePage } from "@/components/article-page";
import { getContentBySlug } from "@/lib/content";

export default async function SectionPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const item = await getContentBySlug("section", slug);
  return <ArticlePage item={item} label="Section" />;
}
