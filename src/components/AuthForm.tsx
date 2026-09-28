"use client";

export default function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const isSignup = mode === "signup";

  return (
    <form
      onSubmit={(e) => e.preventDefault()}
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
          className="mt-1.5 w-full rounded-lg border border-border-strong bg-bg-elevated px-3 py-2.5 text-sm outline-none focus:border-accent"
          placeholder="you@brand.com"
        />
      </div>

      <div className="mb-6">
        <label htmlFor="password" className="text-xs text-fg-muted">
          Password
        </label>
        <input
          id="password"
          type="password"
          autoComplete={isSignup ? "new-password" : "current-password"}
          className="mt-1.5 w-full rounded-lg border border-border-strong bg-bg-elevated px-3 py-2.5 text-sm outline-none focus:border-accent"
          placeholder="••••••••"
        />
      </div>

      <button
        type="submit"
        className="w-full rounded-full bg-accent px-5 py-3 text-sm font-medium text-accent-fg transition-transform hover:scale-[1.02]"
      >
        {isSignup ? "Create account" : "Log in"}
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
