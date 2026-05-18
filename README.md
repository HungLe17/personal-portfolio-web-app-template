# Liquid Glass Portfolio

Full-stack portfolio CMS built with Next.js, Supabase, Tailwind CSS, Framer Motion, and React Markdown.

## Run Locally

```bash
npm install
npm run dev
```

Copy `.env.example` to `.env.local` and add Supabase keys.

## Supabase Setup

1. Create a free Supabase project.
2. Run `supabase/schema.sql` in the Supabase SQL editor.
3. In Authentication -> Providers -> Email, enable email/password and turn off email confirmation for this project.
4. Create an auth user for yourself in Supabase Auth using the internal username email format.
   - Username `admin` becomes `admin@portfolio.local`.
   - If you change `AUTH_USERNAME_DOMAIN`, use that domain instead.
   - Mark the user as confirmed if Supabase asks.
5. Put your Supabase URL and anon key in `.env.local`.

The app falls back to local seed content when Supabase env vars are missing, so the public site still renders during setup.

## Admin

Admin route: `/admin`

Features:
- Login with username and password. Supabase Auth stores this internally as `username@portfolio.local`, but the admin UI never asks for an email.
- Add/edit/delete sections, projects, and posts.
- Add image URLs.
- Write long article bodies in Markdown.
- Dynamic public pages at `/projects/[slug]`, `/posts/[slug]`, and `/sections/[slug]`.

## Markdown

Article bodies support normal Markdown through `react-markdown`, including headings, paragraphs, lists, bold, italic, and links.
