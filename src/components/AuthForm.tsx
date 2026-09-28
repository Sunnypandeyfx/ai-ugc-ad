"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const isSignup = mode === "signup";
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/dashboard";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkEmail, setCheckEmail] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const supabase = createClient();

    if (isSignup) {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: name } },
      });

      setLoading(false);
      if (signUpError) {
        setError(signUpError.message);
        return;
      }
      if (!data.session) {
        setCheckEmail(true);
        return;
      }
      router.push(next);
      router.refresh();
    } else {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      setLoading(false);
      if (signInError) {
        setError(signInError.message);
        return;
      }
      router.push(next);
      router.refresh();
    }
  }

  if (checkEmail) {
    return (
      <div className="w-full max-w-sm rounded-2xl border border-border bg-surface p-8 text-center">
        <p className="text-sm text-fg">Check your inbox</p>
        <p className="mt-2 text-sm text-fg-muted">
          We sent a confirmation link to {email}. Confirm your email, then log
          in.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-sm rounded-2xl border border-border bg-surface p-8"
    >
      {isSignup && (
        <div className="mb-4">
          <label htmlFor="name" className="text-xs text-fg-muted">
            Full name
          </label>
          <input
            id="name"
            type="text"
            autoComplete="name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1.5 w-full rounded-lg border border-border-strong bg-bg-elevated px-3 py-2.5 text-sm outline-none focus:border-accent"
            placeholder="Jordan Lee"
          />
        </div>
      )}

      <div className="mb-4">
        <label htmlFor="email" className="text-xs text-fg-muted">
          Work email
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1.5 w-full rounded-lg border border-border-strong bg-bg-elevated px-3 py-2.5 text-sm outline-none focus:border-accent"
          placeholder="you@brand.com"
        />
      </div>

      <div className="mb-2">
        <label htmlFor="password" className="text-xs text-fg-muted">
          Password
        </label>
        <input
          id="password"
          type="password"
          autoComplete={isSignup ? "new-password" : "current-password"}
          required
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-1.5 w-full rounded-lg border border-border-strong bg-bg-elevated px-3 py-2.5 text-sm outline-none focus:border-accent"
          placeholder="••••••••"
        />
      </div>

      {error && <p className="mt-3 text-xs text-red-400">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="mt-6 w-full rounded-full bg-accent px-5 py-3 text-sm font-medium text-accent-fg transition-transform hover:scale-[1.02] disabled:opacity-60"
      >
        {loading ? "Please wait…" : isSignup ? "Create account" : "Log in"}
      </button>

      <p className="mt-5 text-center text-xs text-fg-subtle">
        {isSignup ? "Already have an account?" : "Don't have an account?"}{" "}
        <a
          href={isSignup ? "/login" : "/signup"}
          className="text-fg underline underline-offset-4"
        >
          {isSignup ? "Log in" : "Start free"}
        </a>
      </p>
    </form>
  );
}
