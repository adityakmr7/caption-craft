import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell } from "@/app/components/auth/AuthShell";
import { SignupForm } from "@/app/components/auth/SignupForm";

export const metadata: Metadata = {
  title: "Sign up — CaptionCraft",
  description: "Create your CaptionCraft account.",
};

export default function SignupPage() {
  return (
    <AuthShell
      title="Create your account"
      subtitle="Start with 20 free credits, no card required."
      footer={
        <>
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-white hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <SignupForm />
    </AuthShell>
  );
}
