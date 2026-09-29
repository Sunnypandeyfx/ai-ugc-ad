"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { siteConfig } from "@/lib/seo";

const NAV_LINKS = [
  { href: "/how-it-works", label: "How it works" },
  { href: "/product", label: "Product" },
  { href: "/examples", label: "Examples" },
  { href: "/pricing", label: "Pricing" },
  { href: "/faq", label: "FAQ" },
];

export default function Header() {
  const [open, setOpen] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return;
    const supabase = createClient();

    supabase.auth.getUser().then(({ data }) => {
      setUserEmail(data.user?.email ?? null);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserEmail(session?.user?.email ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-50 border-b border-border/80 bg-bg/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-accent text-sm font-semibold text-accent-fg">
            B
          </span>
          <span className="font-display text-lg tracking-tight">
            {siteConfig.name}
          </span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm text-fg-muted transition-colors hover:text-fg"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          {userEmail ? (
            <>
              <Link
                href="/dashboard"
                className="text-sm text-fg-muted transition-colors hover:text-fg"
              >
                Dashboard
              </Link>
              <button
                type="button"
                onClick={handleSignOut}
                className="rounded-full border border-border-strong px-4 py-2 text-sm font-medium text-fg transition-colors hover:bg-surface"
              >
                Log out
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="text-sm text-fg-muted transition-colors hover:text-fg"
              >
                Log in
              </Link>
              <Link
                href="/signup"
                className="btn-gradient rounded-full px-4 py-2 text-sm font-medium text-white transition-transform hover:scale-[1.03]"
              >
                Start free
              </Link>
            </>
          )}
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle menu"
          aria-expanded={open}
          className="flex h-9 w-9 items-center justify-center rounded-md border border-border text-fg md:hidden"
        >
          <span className="relative block h-3 w-4">
            <span
              className={`absolute left-0 top-0 h-px w-4 bg-current transition-transform ${open ? "translate-y-1.5 rotate-45" : ""}`}
            />
            <span
              className={`absolute left-0 bottom-0 h-px w-4 bg-current transition-transform ${open ? "-translate-y-1.5 -rotate-45" : ""}`}
            />
          </span>
        </button>
      </div>

      {open && (
        <div className="border-t border-border bg-bg px-6 py-4 md:hidden">
          <nav className="flex flex-col gap-4">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="text-sm text-fg-muted hover:text-fg"
              >
                {link.label}
              </Link>
            ))}
            <div className="mt-2 flex flex-col gap-3 border-t border-border pt-4">
              {userEmail ? (
                <>
                  <Link href="/dashboard" className="text-sm text-fg-muted hover:text-fg">
                    Dashboard
                  </Link>
                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="rounded-full border border-border-strong px-4 py-2 text-center text-sm font-medium text-fg"
                  >
                    Log out
                  </button>
                </>
              ) : (
                <>
                  <Link href="/login" className="text-sm text-fg-muted hover:text-fg">
                    Log in
                  </Link>
                  <Link
                    href="/signup"
                    className="btn-gradient rounded-full px-4 py-2 text-center text-sm font-medium text-white"
                  >
                    Start free
                  </Link>
                </>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
