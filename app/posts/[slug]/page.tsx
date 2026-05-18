import { ArticlePage } from "@/components/article-page";
import { getContentBySlug } from "@/lib/content";

export default async function PostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const item = await getContentBySlug("post", slug);
  return <ArticlePage item={item} label="Post" />;
}
