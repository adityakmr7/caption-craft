import Link from "next/link";
import { Type } from "lucide-react";

export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-[100dvh] items-center justify-center overflow-hidden bg-[#0a0a0f] px-6 py-16 text-white">
      <div className="orb absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 bg-gradient-to-br from-[#a855f7] to-[#ec4899] opacity-[0.12]" />

      <div className="relative w-full max-w-sm">
        <Link href="/" className="mb-8 flex items-center justify-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#a855f7] to-[#ec4899]">
            <Type className="h-4 w-4 text-white" strokeWidth={2} />
          </span>
          <span className="text-lg font-bold tracking-tight">
            Caption<span className="gradient-text">Craft</span>
          </span>
        </Link>

        <div className="glass-card p-8">
          <h1 className="mb-1 text-center text-2xl font-bold tracking-tight text-white">
            {title}
          </h1>
          <p className="mb-6 text-center text-sm text-[#a1a1aa]">{subtitle}</p>
          {children}
        </div>

        <p className="mt-6 text-center text-sm text-[#71717a]">{footer}</p>
      </div>
    </div>
  );
}
