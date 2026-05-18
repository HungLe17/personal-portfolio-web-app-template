import { ArticlePage } from "@/components/article-page";
import { getContentBySlug } from "@/lib/content";

export default async function ProjectPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const item = await getContentBySlug("project", slug);
  return <ArticlePage item={item} label="Project" />;
}
