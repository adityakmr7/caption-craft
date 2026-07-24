import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { AuthShell } from "@/app/components/auth/AuthShell";
import { LoginForm } from "@/app/components/auth/LoginForm";

export const metadata: Metadata = {
  title: "Sign in — CaptionCraft",
  description: "Sign in to your CaptionCraft account.",
};

export default function LoginPage() {
  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to your CaptionCraft account."
      footer={
        <>
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="font-medium text-white hover:underline">
            Create one
          </Link>
        </>
      }
    >
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </AuthShell>
  );
}
