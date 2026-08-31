import { redirect } from "next/navigation";
import { createClient, getUser } from "@/app/lib/supabase/server";
import GenerationWorkspace from "./generation-workspace";
import PostHistory from "./post-history";

// Protected dashboard root. The proxy (proxy.ts) already redirects
// unauthenticated requests to /login as an optimistic check, but per
// Next.js's auth guidance, every protected page also verifies the session
// itself — the proxy is not the only line of defense.
export default async function AppHome() {
  const user = await getUser();

  if (!user) {
    redirect("/login?next=/app");
  }

  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("plan, free_generations_used")
    .eq("id", user.id)
    .single();

  const remainingFree =
    profile && profile.plan === "free"
      ? Math.max(0, 3 - profile.free_generations_used)
      : null;

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text-1)] px-6 py-12">
      <div className="max-w-4xl mx-auto flex flex-col gap-10">
        <header className="flex items-center justify-between">
          <div>
            <p className="text-sm text-[var(--text-3)] mb-1">Signed in as</p>
            <h1 className="text-lg font-semibold">{user.email}</h1>
          </div>
          <form action="/auth/signout" method="post">
            <button
              type="submit"
              className="btn-ghost px-4 py-2 text-sm font-semibold"
            >
              Sign out
            </button>
          </form>
        </header>

        <GenerationWorkspace initialRemainingFree={remainingFree} />

        <PostHistory userId={user.id} />
      </div>
    </div>
  );
}
