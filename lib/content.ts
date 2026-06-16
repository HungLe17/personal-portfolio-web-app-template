import { notFound } from "next/navigation";
import { unstable_cache } from "next/cache";
import { createClient } from "@supabase/supabase-js";
import { createSupabaseServerClient, hasSupabaseEnv } from "./supabase/server";
import { seedContent } from "./seed";
import type { ContentItem, ContentType } from "./types";

const typeOrder: ContentType[] = ["intro", "section", "project", "post"];
const CONTENT_CACHE_TAG = "portfolio-content";
const PUBLIC_CONTENT_TIMEOUT_MS = 1800;

function withTimeout<T>(operation: PromiseLike<T>, timeoutMs = PUBLIC_CONTENT_TIMEOUT_MS) {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("Content request timed out.")), timeoutMs);
    Promise.resolve(operation).then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      }
    );
  });
}

function createPublicSupabaseClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch(input, init = {}) {
        return fetch(input, {
          ...init,
          signal: init.signal || AbortSignal.timeout(3000)
        });
      }
    }
  });
}

const getPublishedContent = unstable_cache(
  async () => {
    const supabase = createPublicSupabaseClient();
    const { data, error } = await withTimeout(
      supabase.from("content_items").select("*").eq("is_published", true).order("sort_order", { ascending: true })
    );
    if (error || !data?.length) throw error || new Error("No published content.");
    return data as ContentItem[];
  },
  ["published-content"],
  { revalidate: 60, tags: [CONTENT_CACHE_TAG] }
);

const getPublishedContentBySlug = unstable_cache(
  async (type: ContentType, slug: string) => {
    const supabase = createPublicSupabaseClient();
    const { data, error } = await withTimeout(
      supabase
        .from("content_items")
        .select("*")
        .eq("type", type)
        .eq("slug", slug)
        .eq("is_published", true)
        .maybeSingle()
    );
    if (error) throw error;
    return (data as ContentItem | null) || null;
  },
  ["published-content-by-slug"],
  { revalidate: 60, tags: [CONTENT_CACHE_TAG] }
);

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

  if (!options?.includeUnpublished) {
    try {
      return await getPublishedContent();
    } catch {
      return seedContent.filter((item) => item.is_published);
    }
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) return seedContent;
  const { data, error } = await supabase.from("content_items").select("*").order("sort_order", { ascending: true });
  return error || !data?.length ? seedContent : (data as ContentItem[]);
}

export async function getContentByType(type: ContentType, options?: { includeUnpublished?: boolean }) {
  const items = await getContentItems(options);
  return items
    .filter((item) => item.type === type)
    .sort((a, b) => a.sort_order - b.sort_order || typeOrder.indexOf(a.type) - typeOrder.indexOf(b.type));
}

export async function getContentBySlug(type: ContentType, slug: string) {
  let item: ContentItem | null | undefined;
  if (hasSupabaseEnv()) {
    try {
      item = await getPublishedContentBySlug(type, slug);
    } catch {
      item = undefined;
    }
  }
  item ||= seedContent.find((entry) => entry.type === type && entry.slug === slug && entry.is_published);
  if (!item) notFound();
  return item;
}

export function findIntro(items: ContentItem[], slug: string) {
  return items.find((item) => item.type === "intro" && item.slug === slug);
}
