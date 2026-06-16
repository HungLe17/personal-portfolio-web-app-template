import Link from "next/link";
import { cookies } from "next/headers";
import { importSeedContentAction, signInAction, signOutAction } from "@/app/actions";
import { AdminEditor } from "@/components/admin-editor";
import { getContentItems } from "@/lib/content";
import { createSupabaseServerClient, hasSupabaseEnv } from "@/lib/supabase/server";
import { DEMO_AUTH_COOKIE, isDemoLoginEnabled } from "@/lib/demo-auth";
import { seedContent } from "@/lib/seed";

export default async function AdminPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  const envReady = hasSupabaseEnv();
  const cookieStore = await cookies();
  const demoMode = isDemoLoginEnabled() && cookieStore.get(DEMO_AUTH_COOKIE)?.value === "active";
  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = supabase ? await supabase.auth.getUser() : { data: { user: null } };

  if (!envReady && !isDemoLoginEnabled()) {
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

  if (!user && !demoMode) {
    return (
      <main className="admin-page section-shell">
        <form className="glass-panel admin-shell no-glass-hover" action={signInAction}>
          <p className="eyebrow">Admin</p>
          <h1>Sign in</h1>
          {error ? <p className="form-error">Sign in failed: {error}</p> : null}
          <label>
            Username
            <input name="username" type="text" autoComplete="username" defaultValue={isDemoLoginEnabled() ? "dev" : ""} required />
          </label>
          <label>
            Password
            <input name="password" type="password" autoComplete="current-password" defaultValue={isDemoLoginEnabled() ? "dev" : ""} required />
          </label>
          <button className="liquid-button primary" type="submit">
            Sign in
          </button>
        </form>
      </main>
    );
  }

  const items = demoMode ? seedContent : await getContentItems({ includeUnpublished: true });

  return (
    <main className="admin-page admin-workspace-page">
      <section className="admin-shell admin-workspace-shell">
        <div className="admin-topbar">
          <div>
            <p className="eyebrow">Publishing workspace</p>
            <h1>Content Manager</h1>
          </div>
          {demoMode ? (
            <p className="admin-session-note">Demo session. Changes are not saved.</p>
          ) : (
            <form action={importSeedContentAction} className="admin-seed-action">
              <span>Need placeholder content?</span>
              <button className="mini-button" type="submit">
                Import
              </button>
            </form>
          )}
          <form action={signOutAction} className="admin-signout">
            <button className="liquid-button secondary" type="submit">
              Sign out
            </button>
          </form>
        </div>
        <AdminEditor items={items} />
      </section>
    </main>
  );
}
