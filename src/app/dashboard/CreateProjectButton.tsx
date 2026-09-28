"use client";

import { useFormStatus } from "react-dom";
import { createProject } from "./actions";

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-full bg-accent px-6 py-3 text-sm font-medium text-accent-fg transition-transform hover:scale-[1.02] disabled:opacity-60"
    >
      {pending ? "Creating…" : label}
    </button>
  );
}

export default function CreateProjectButton({ label = "Create New Ad" }: { label?: string }) {
  return (
    <form action={createProject}>
      <SubmitButton label={label} />
    </form>
  );
}
