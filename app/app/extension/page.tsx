import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { redirect } from "next/navigation";
import { getUser } from "@/app/lib/supabase/server";
import ExtensionTokens from "./extension-tokens";

export default async function ExtensionPage() {
  const user = await getUser();
  if (!user) {
    redirect("/login?next=/app/extension");
  }

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text-1)] px-6 py-12">
      <div className="max-w-2xl mx-auto flex flex-col gap-8">
        <Link
          href="/app"
          className="inline-flex items-center gap-1.5 text-sm text-[var(--text-3)] hover:text-[var(--text-2)] transition-colors w-fit"
        >
          <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2} />
          Back to app
        </Link>

        <div>
          <h1 className="text-2xl font-semibold mb-1">Chrome extension</h1>
          <p className="text-sm text-[var(--text-3)] max-w-[52ch]">
            Insert a generated post into LinkedIn&apos;s compose box without
            switching tabs. The extension never posts on your behalf — you
            still review and click Post yourself. Click &quot;Connect
            extension&quot; below to connect it in one step.
          </p>
        </div>

        <ExtensionTokens />
      </div>
    </div>
  );
}
