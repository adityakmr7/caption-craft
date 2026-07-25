import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Type, Zap } from "lucide-react";
import { createClient } from "@/app/lib/supabase/server";
import { VideoUpload } from "@/app/components/dashboard/VideoUpload";

export const metadata: Metadata = {
  title: "Dashboard — CaptionCraft",
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("users")
    .select("credits, plan")
    .eq("id", user.id)
    .single();

  return (
    <div className="min-h-[100dvh] bg-[#0a0a0f] text-white">
      <header className="flex items-center justify-between border-b border-white/5 px-6 py-4 lg:px-8">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#a855f7] to-[#ec4899]">
            <Type className="h-4 w-4 text-white" strokeWidth={2} />
          </span>
          <span className="text-lg font-bold tracking-tight">
            Caption<span className="gradient-text">Craft</span>
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span className="hidden text-sm text-[#a1a1aa] sm:inline">{user.email}</span>
          <form action="/auth/signout" method="post">
            <button
              type="submit"
              className="btn-ghost px-4 py-2 text-sm font-medium"
            >
              Sign out
            </button>
          </form>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
        <h1 className="mb-8 text-2xl font-bold tracking-tight">
          Welcome back{profile ? "" : " — setting up your account"}
        </h1>

        <div className="mb-10 grid gap-6 sm:grid-cols-2">
          <div className="glass-card p-6">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#a855f7] to-[#ec4899]">
              <Zap className="h-5 w-5 text-white" strokeWidth={2} />
            </div>
            <p className="text-sm text-[#71717a]">Credits remaining</p>
            <p className="text-3xl font-bold tracking-tight">{profile?.credits ?? "—"}</p>
          </div>
          <div className="glass-card p-6">
            <p className="mb-3 text-sm text-[#71717a]">Current plan</p>
            <p className="text-3xl font-bold capitalize tracking-tight">
              {profile?.plan ?? "free"}
            </p>
          </div>
        </div>

        <VideoUpload />
      </main>
    </div>
  );
}
