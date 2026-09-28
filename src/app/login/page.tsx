import type { Metadata } from "next";
import { Suspense } from "react";
import AuthForm from "@/components/AuthForm";

export const metadata: Metadata = {
  title: "Log in",
  description: "Log in to your Backlot account.",
  alternates: { canonical: "/login" },
};

export default function LoginPage() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center bg-grid px-6 py-20">
      <div className="flex flex-col items-center">
        <h1 className="mb-8 text-center font-display text-3xl tracking-tight">
          Welcome back
        </h1>
        <Suspense fallback={null}>
          <AuthForm mode="login" />
        </Suspense>
      </div>
    </div>
  );
}
