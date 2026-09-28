"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { sendAgentMessage } from "./actions";

type Message = { id: string; role: "user" | "assistant"; content: string; changes: string[] };

const SUGGESTIONS = [
  "Make the hook punchier",
  "Tighten the voiceover so it's easier to read along",
  "Add a close-up of the product before the end card",
];

export default function AgentPanel({ projectId, messages }: { projectId: string; messages: Message[] }) {
  const [draft, setDraft] = useState("");
  const [pendingText, setPendingText] = useState<string | null>(null);
  const [state, action, pending] = useActionState(
    async (prev: { error: string | null }, formData: FormData) => {
      const result = await sendAgentMessage(projectId, prev, formData);
      if (!result.error) setDraft("");
      setPendingText(null);
      return result;
    },
    { error: null },
  );
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages.length, pending]);

  return (
    <div className="flex flex-col rounded-2xl border border-border bg-surface">
      <div className="border-b border-border px-5 py-4">
        <p className="text-xs uppercase tracking-wide text-accent">Project assistant</p>
        <p className="mt-1 text-xs text-fg-muted">
          Ask for storyboard changes. It only uses your confirmed facts, and every change it makes is listed.
        </p>
      </div>

      <div ref={listRef} className="max-h-[420px] min-h-[120px] space-y-3 overflow-y-auto px-5 py-4" aria-live="polite">
        {messages.length === 0 && !pending && (
          <div className="space-y-2">
            <p className="text-xs text-fg-subtle">Try:</p>
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setDraft(s)}
                className="block w-full rounded-lg border border-dashed border-border-strong px-3 py-2 text-left text-xs text-fg-muted transition-colors hover:border-accent hover:text-fg"
              >
                {s}
              </button>
            ))}
          </div>
        )}
        {messages.map((m) => (
          <Bubble key={m.id} role={m.role} content={m.content} changes={m.changes} />
        ))}
        {pending && pendingText && (
          <>
            <Bubble role="user" content={pendingText} changes={[]} />
            <p className="text-xs text-fg-subtle">Working on it…</p>
          </>
        )}
      </div>

      <form
        action={action}
        onSubmit={() => setPendingText(draft.trim() || null)}
        className="border-t border-border p-3"
      >
        <label htmlFor="agent-message" className="sr-only">
          Message the project assistant
        </label>
        <textarea
          id="agent-message"
          name="message"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              e.currentTarget.form?.requestSubmit();
            }
          }}
          rows={2}
          maxLength={1000}
          disabled={pending}
          placeholder="e.g. Make shot 2 feel warmer"
          className="w-full resize-none rounded-lg border border-border-strong bg-bg-elevated px-3 py-2 text-sm outline-none focus:border-accent disabled:opacity-60"
        />
        {state.error && <p className="mt-1.5 text-xs text-red-400">{state.error}</p>}
        <div className="mt-2 flex items-center justify-between gap-2">
          <p className="text-[10px] text-fg-subtle">Edits withdraw storyboard approval.</p>
          <button
            type="submit"
            disabled={pending || !draft.trim()}
            className="rounded-full bg-accent px-4 py-1.5 text-xs font-medium text-accent-fg disabled:opacity-50"
          >
            {pending ? "Sending…" : "Send"}
          </button>
        </div>
      </form>
    </div>
  );
}

function Bubble({ role, content, changes }: { role: "user" | "assistant"; content: string; changes: string[] }) {
  if (role === "user") {
    return (
      <div className="ml-6 rounded-xl bg-surface-2 px-3 py-2 text-sm text-fg">
        <p className="whitespace-pre-wrap break-words">{content}</p>
      </div>
    );
  }
  return (
    <div className="mr-2 text-sm text-fg-muted">
      <p className="whitespace-pre-wrap break-words">{content}</p>
      {changes.length > 0 && (
        <ul className="mt-2 space-y-0.5 border-l-2 border-accent/50 pl-2.5 text-[11px] text-fg-subtle">
          {changes.map((c, i) => (
            <li key={i}>{c}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
