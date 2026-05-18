create extension if not exists "pgcrypto";

create table if not exists public.content_items (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('intro', 'section', 'project', 'post')),
  slug text not null unique,
  title text not null,
  category text not null default '',
  description text not null default '',
  body text not null default '',
  tags text[] not null default '{}',
  link text not null default '',
  image text not null default '',
  sort_order integer not null default 0,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.content_items enable row level security;

create policy "Published content is readable"
on public.content_items for select
using (is_published = true);

create policy "Authenticated users can manage content"
on public.content_items for all
to authenticated
using (true)
with check (true);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_content_items_updated_at on public.content_items;
create trigger set_content_items_updated_at
before update on public.content_items
for each row execute function public.set_updated_at();
