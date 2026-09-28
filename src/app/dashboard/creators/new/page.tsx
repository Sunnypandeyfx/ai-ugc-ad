import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import NewCreatorForm from "./NewCreatorForm";

export const metadata: Metadata = {
  title: "New creator",
  alternates: { canonical: "/dashboard/creators/new" },
};

export default async function NewCreatorPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/dashboard/creators/new");

  return (
    <div className="mx-auto max-w-xl px-6 py-16">
      <h1 className="font-display text-3xl tracking-tight">
        Train your own creator
      </h1>
      <p className="mt-2 text-sm text-fg-muted">
        Upload footage of a real person and Backlot trains a custom AI
        creator that speaks your scripts in their voice and likeness.
      </p>
      <NewCreatorForm />
    </div>
  );
}
