import Link from "next/link";
import { importSeedContentAction, signInAction, signOutAction } from "@/app/actions";
import { AdminEditor } from "@/components/admin-editor";
import { getContentItems } from "@/lib/content";
import { createSupabaseServerClient, hasSupabaseEnv } from "@/lib/supabase/server";

export default async function AdminPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  const envReady = hasSupabaseEnv();
  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = supabase ? await supabase.auth.getUser() : { data: { user: null } };

  if (!envReady) {
    return (
      <main className="admin-page section-shell">
        <section className="glass-panel admin-shell no-glass-hover">
          <p className="eyebrow">Setup required</p>
          <h1>Connect Supabase</h1>
          <p className="form-hint">
            Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` to `.env.local`, then run the SQL in
            `supabase/schema.sql`.
          </p>
          <Link className="liquid-button secondary" href="/">
            Back to site
          </Link>
        </section>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="admin-page section-shell">
        <form className="glass-panel admin-shell no-glass-hover" action={signInAction}>
          <p className="eyebrow">Admin</p>
          <h1>Sign in</h1>
          {error ? <p className="form-error">Sign in failed: {error}</p> : null}
          <label>
            Username
            <input name="username" type="text" autoComplete="username" required />
          </label>
          <label>
            Password
            <input name="password" type="password" autoComplete="current-password" required />
          </label>
          <button className="liquid-button primary" type="submit">
            Sign in
          </button>
        </form>
      </main>
    );
  }

  const items = await getContentItems({ includeUnpublished: true });

  return (
    <main className="admin-page section-shell">
      <section className="glass-panel admin-shell no-glass-hover">
        <div className="admin-topbar">
          <div>
            <p className="eyebrow">Admin</p>
            <h1>Content Manager</h1>
          </div>
          <form action={signOutAction}>
            <button className="liquid-button secondary" type="submit">
              Sign out
            </button>
          </form>
        </div>
        <form action={importSeedContentAction} className="seed-import">
          <p className="form-hint">New Supabase project? Import the placeholder portfolio content, then edit it below.</p>
          <button className="mini-button" type="submit">
            Import Seed Content
          </button>
        </form>
        <AdminEditor items={items} />
      </section>
    </main>
  );
}
