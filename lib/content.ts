import { notFound } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { createSupabaseServerClient, hasSupabaseEnv } from "./supabase/server";
import { seedContent } from "./seed";
import type { ContentItem, ContentType } from "./types";

const typeOrder: ContentType[] = ["intro", "section", "project", "post"];

export function getRouteForItem(item: ContentItem) {
  if (item.type === "project") return `/projects/${item.slug}`;
  if (item.type === "post") return `/posts/${item.slug}`;
  if (item.type === "section") return `/sections/${item.slug}`;
  return "/";
}

export function getPluralType(type: ContentType) {
  if (type === "project") return "projects";
  if (type === "post") return "posts";
  if (type === "section") return "sections";
  return "intro";
}

export async function getContentItems(options?: { includeUnpublished?: boolean }) {
  if (!hasSupabaseEnv()) {
    return seedContent.filter((item) => options?.includeUnpublished || item.is_published);
  }

  const supabase = options?.includeUnpublished
    ? await createSupabaseServerClient()
    : createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
        auth: { persistSession: false, autoRefreshToken: false }
      });

  if (!supabase) return seedContent;

  let query = supabase.from("content_items").select("*").order("sort_order", { ascending: true });
  if (!options?.includeUnpublished) {
    query = query.eq("is_published", true);
  }

  const { data, error } = await query;
  if (error || !data?.length) {
    return seedContent.filter((item) => options?.includeUnpublished || item.is_published);
  }

  return data as ContentItem[];
}

export async function getContentByType(type: ContentType, options?: { includeUnpublished?: boolean }) {
  const items = await getContentItems(options);
  return items
    .filter((item) => item.type === type)
    .sort((a, b) => a.sort_order - b.sort_order || typeOrder.indexOf(a.type) - typeOrder.indexOf(b.type));
}

export async function getContentBySlug(type: ContentType, slug: string) {
  const items = await getContentByType(type);
  const item = items.find((entry) => entry.slug === slug);
  if (!item) notFound();
  return item;
}

export function findIntro(items: ContentItem[], slug: string) {
  return items.find((item) => item.type === "intro" && item.slug === slug);
}
