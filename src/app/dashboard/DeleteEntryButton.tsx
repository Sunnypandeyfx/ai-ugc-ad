"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { DeleteState } from "./actions";

export default function DeleteEntryButton({
  label,
  confirmMessage,
  action,
  position = "corner",
}: {
  label: string;
  confirmMessage: string;
  action: () => Promise<DeleteState>;
  position?: "corner" | "center-right";
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div
      className={`absolute z-10 ${
        position === "corner" ? "right-2 top-2" : "right-2 top-1/2 -translate-y-1/2"
      }`}
    >
      <button
        type="button"
        aria-label={label}
        disabled={pending}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (!window.confirm(confirmMessage)) return;
          setError(null);
          startTransition(async () => {
            const result = await action();
            if (result.error) setError(result.error);
            else router.refresh();
          });
        }}
        className="flex h-7 w-7 items-center justify-center rounded-full bg-bg/80 text-fg-subtle opacity-100 backdrop-blur transition-opacity hover:bg-surface-2 hover:text-red-300 disabled:opacity-60 sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100"
      >
        {pending ? (
          <span className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
        ) : (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path
              d="M5 7h14M10 11v6M14 11v6M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13M9 7V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </button>
      {error && (
        <p className="absolute right-0 top-9 w-40 rounded-lg border border-border-strong bg-bg px-2.5 py-1.5 text-[11px] text-red-400 shadow-lg">
          {error}
        </p>
      )}
    </div>
  );
}
