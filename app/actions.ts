"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/slug";
import { seedContent } from "@/lib/seed";
import type { ContentFormState, ContentType } from "@/lib/types";

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
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    redirect("/admin?error=missing-supabase-env");
  }

  const username = String(formData.get("username") || "");
  const email = usernameToAuthEmail(username);
  const password = String(formData.get("password") || "");

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
  const supabase = await createSupabaseServerClient();
  await supabase?.auth.signOut();
  redirect("/admin");
}

export async function saveContentAction(_state: ContentFormState, formData: FormData): Promise<ContentFormState> {
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
    is_published: boolFromForm(formData.get("is_published"))
  };

  const query = id && isUuid(id)
    ? supabase.from("content_items").update(payload).eq("id", id)
    : supabase.from("content_items").insert(payload);

  const { error } = await query;
  if (error) return { ok: false, message: error.message };

  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath(`/${type === "project" ? "projects" : type === "post" ? "posts" : "sections"}/${slug}`);
  return { ok: true, message: "Saved." };
}

export async function deleteContentAction(formData: FormData) {
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
  redirect("/admin");
}

export async function importSeedContentAction() {
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
  redirect("/admin");
}
