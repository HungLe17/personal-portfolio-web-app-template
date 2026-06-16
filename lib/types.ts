export type ContentType = "intro" | "section" | "project" | "post";

export type ContentItem = {
  id: string;
  type: ContentType;
  slug: string;
  title: string;
  category: string;
  description: string;
  body: string;
  tags: string[];
  link: string;
  image: string;
  sort_order: number;
  is_published: boolean;
  created_at?: string;
  updated_at?: string;
};

export type ContentFormState = {
  ok: boolean;
  message: string;
  item?: ContentItem | null;
};
