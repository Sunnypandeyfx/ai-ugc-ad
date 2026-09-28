"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { startConsent } from "./actions";

type TrainingStatus = "uploading" | "training" | "ready" | "failed";
type ConsentStatus = "not_started" | "pending" | "approved" | "declined";

export default function CreatorStatusPanel({
  customAvatarId,
  initialTrainingStatus,
  initialConsentStatus,
  initialConsentUrl,
  initialError,
}: {
  customAvatarId: string;
  initialTrainingStatus: TrainingStatus;
  initialConsentStatus: ConsentStatus;
  initialConsentUrl: string | null;
  initialError: string | null;
}) {
  const [trainingStatus, setTrainingStatus] = useState(initialTrainingStatus);
  const [consentStatus, setConsentStatus] = useState(initialConsentStatus);
  const [consentUrl, setConsentUrl] = useState(initialConsentUrl);
  const [error, setError] = useState(initialError);
  const [isPending, startTransition] = useTransition();
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const shouldPoll =
      trainingStatus === "training" || consentStatus === "pending";
    if (!shouldPoll) return;

    pollRef.current = setInterval(async () => {
      const res = await fetch(`/api/creators/${customAvatarId}/status`);
      const data = await res.json();
      setTrainingStatus(data.training_status);
      setConsentStatus(data.consent_status);
      setError(data.error);
    }, 5000);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [trainingStatus, consentStatus, customAvatarId]);

  function handleStartConsent() {
    startTransition(async () => {
      const result = await startConsent(customAvatarId);
      if (result.error) {
        setError(result.error);
      } else {
        setConsentStatus("pending");
        setConsentUrl(result.consentUrl);
      }
    });
  }

  return (
    <div className="mt-10 rounded-xl border border-border bg-surface p-5">
      <p className="text-xs uppercase tracking-wide text-accent">Training</p>

      {trainingStatus === "training" && (
        <p className="mt-2 text-sm text-fg-muted">
          Training your creator… this can take a few minutes.
        </p>
      )}

      {trainingStatus === "failed" && (
        <p className="mt-2 text-sm text-red-400">
          Training failed: {error ?? "Unknown error"}
        </p>
      )}

      {trainingStatus === "ready" && (
        <>
          <p className="mt-2 text-sm text-fg-muted">Training complete.</p>

          <p className="mt-6 text-xs uppercase tracking-wide text-accent">
            Consent
          </p>

          {consentStatus === "not_started" && (
            <>
              <p className="mt-2 text-sm text-fg-muted">
                The person in the footage must confirm consent on camera
                before this creator can render any ads.
              </p>
              <button
                type="button"
                onClick={handleStartConsent}
                disabled={isPending}
                className="mt-4 rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-accent-fg transition-transform hover:scale-[1.02] disabled:opacity-60"
              >
                Send consent link
              </button>
            </>
          )}

          {consentStatus === "pending" && (
            <div className="mt-2">
              <p className="text-sm text-fg-muted">
                Waiting for consent. Send this link to the person in the
                video — it expires in 24 hours:
              </p>
              {consentUrl && (
                <a
                  href={consentUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 block break-all text-sm text-accent underline underline-offset-4"
                >
                  {consentUrl}
                </a>
              )}
            </div>
          )}

          {consentStatus === "approved" && (
            <p className="mt-2 text-sm text-fg-muted">
              Consent approved — this creator is ready to use on new ads.
            </p>
          )}

          {consentStatus === "declined" && (
            <p className="mt-2 text-sm text-red-400">
              Consent was declined. This creator can&rsquo;t be used.
            </p>
          )}
        </>
      )}
    </div>
  );
}
