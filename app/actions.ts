"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { DEMO_AUTH_COOKIE, isDemoCredentials, isDemoLoginEnabled } from "@/lib/demo-auth";
import { slugify } from "@/lib/slug";
import { seedContent } from "@/lib/seed";
import type { ContentFormState, ContentItem, ContentType } from "@/lib/types";

function tagsFromForm(value: FormDataEntryValue | null) {
  return String(value || "")
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

function boolFromForm(value: FormDataEntryValue | null) {
  return value === "on" || value === "true";
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function usernameToAuthEmail(username: string) {
  const normalizedUsername = username
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, "");
  const domain = process.env.AUTH_USERNAME_DOMAIN || "portfolio.local";

  if (!normalizedUsername) return "";
  return `${normalizedUsername}@${domain}`;
}

export async function signInAction(formData: FormData) {
  const username = String(formData.get("username") || "");
  const password = String(formData.get("password") || "");

  if (isDemoCredentials(username, password)) {
    const cookieStore = await cookies();
    cookieStore.set(DEMO_AUTH_COOKIE, "active", {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 8,
      path: "/"
    });
    redirect("/admin");
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    redirect("/admin?error=missing-supabase-env");
  }

  const email = usernameToAuthEmail(username);

  if (!email) {
    redirect("/admin?error=Enter a valid username.");
  }

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    redirect(`/admin?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/admin");
}

export async function signOutAction() {
  const cookieStore = await cookies();
  cookieStore.delete(DEMO_AUTH_COOKIE);
  const supabase = await createSupabaseServerClient();
  await supabase?.auth.signOut();
  redirect("/admin");
}

export async function saveContentAction(_state: ContentFormState, formData: FormData): Promise<ContentFormState> {
  const cookieStore = await cookies();
  if (isDemoLoginEnabled() && cookieStore.get(DEMO_AUTH_COOKIE)?.value === "active") {
    return { ok: true, message: "Demo mode: formatting works, but changes are not persisted." };
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { ok: false, message: "Supabase env vars are missing. Add .env.local before saving." };

  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "You must be signed in to save content." };

  const id = String(formData.get("id") || "");
  const type = String(formData.get("type") || "project") as ContentType;
  const title = String(formData.get("title") || "").trim();
  const slug = slugify(String(formData.get("slug") || title));
  const publishAction = String(formData.get("publish_action") || "save");
  const isPublished =
    publishAction === "publish"
      ? true
      : publishAction === "draft"
        ? false
        : boolFromForm(formData.get("is_published"));

  if (!title) return { ok: false, message: "Add a title before saving." };
  if (!slug) return { ok: false, message: "Add a valid slug before saving." };

  const payload = {
    type,
    slug,
    title,
    category: String(formData.get("category") || "").trim(),
    description: String(formData.get("description") || "").trim(),
    body: String(formData.get("body") || "").trim(),
    tags: tagsFromForm(formData.get("tags")),
    link: String(formData.get("link") || "").trim(),
    image: String(formData.get("image") || "").trim(),
    sort_order: Number(formData.get("sort_order") || 0),
    is_published: isPublished
  };

  const query = id && isUuid(id)
    ? supabase.from("content_items").update(payload).eq("id", id).select("*").single()
    : supabase.from("content_items").insert(payload).select("*").single();

  const { data, error } = await query;
  if (error) {
    const message = error.code === "23505" ? "That slug is already used. Choose a unique slug." : error.message;
    return { ok: false, message };
  }

  revalidatePath("/");
  revalidatePath("/admin");
  revalidateTag("portfolio-content");
  revalidatePath(`/${type === "project" ? "projects" : type === "post" ? "posts" : "sections"}/${slug}`);
  return {
    ok: true,
    message: isPublished ? "Published to Supabase." : "Saved as draft.",
    item: data as ContentItem
  };
}

export async function deleteContentAction(formData: FormData) {
  const cookieStore = await cookies();
  if (isDemoLoginEnabled() && cookieStore.get(DEMO_AUTH_COOKIE)?.value === "active") {
    redirect("/admin");
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) redirect("/admin?error=missing-supabase-env");

  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) redirect("/admin?error=not-signed-in");

  const id = String(formData.get("id") || "");
  if (id && isUuid(id)) {
    await supabase.from("content_items").delete().eq("id", id);
  }

  revalidatePath("/");
  revalidatePath("/admin");
  revalidateTag("portfolio-content");
  redirect("/admin");
}

export async function importSeedContentAction() {
  const cookieStore = await cookies();
  if (isDemoLoginEnabled() && cookieStore.get(DEMO_AUTH_COOKIE)?.value === "active") {
    redirect("/admin");
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) redirect("/admin?error=missing-supabase-env");

  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) redirect("/admin?error=not-signed-in");

  const rows = seedContent.map(({ id: _id, created_at: _created, updated_at: _updated, ...item }) => item);
  await supabase.from("content_items").upsert(rows, { onConflict: "slug" });

  revalidatePath("/");
  revalidatePath("/admin");
  revalidateTag("portfolio-content");
  redirect("/admin");
}
