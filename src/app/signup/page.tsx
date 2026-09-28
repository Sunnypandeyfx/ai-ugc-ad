import type { Metadata } from "next";
import { Suspense } from "react";
import AuthForm from "@/components/AuthForm";

export const metadata: Metadata = {
  title: "Start free",
  description:
    "Create your Backlot account and generate your first AI UGC ad or cinematic commercial in minutes.",
  alternates: { canonical: "/signup" },
};

export default function SignupPage() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center bg-grid px-6 py-20">
      <div className="flex flex-col items-center">
        <h1 className="mb-8 text-center font-display text-3xl tracking-tight">
          Start creating for free
        </h1>
        <Suspense fallback={null}>
          <AuthForm mode="signup" />
        </Suspense>
      </div>
    </div>
  );
}
