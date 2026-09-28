import type { Metadata } from "next";
import PageHeader from "@/components/PageHeader";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How Backlot collects, uses, and protects your data.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <>
      <PageHeader eyebrow="Legal" title="Privacy Policy" />
      <div className="mx-auto max-w-2xl px-6 py-20 text-sm leading-relaxed text-fg-muted">
        <p className="rounded-lg border border-border-strong bg-surface p-4 text-xs text-fg-subtle">
          Draft placeholder — replace with policy language reviewed by
          counsel before this site goes live. It should cover what data you
          collect (account info, uploaded product images, billing details),
          how uploaded images are used and stored, third-party AI providers
          you send data to for generation, retention, and user rights.
        </p>
        <h2 className="mt-8 text-base font-medium text-fg">
          Information we collect
        </h2>
        <p className="mt-2">
          Account details you provide, product images and brief content you
          upload, and usage data needed to operate and bill for the service.
        </p>
        <h2 className="mt-8 text-base font-medium text-fg">
          How we use it
        </h2>
        <p className="mt-2">
          To generate the ads you request, operate your subscription, and
          improve reliability of the product. Uploaded product images are
          processed by third-party AI generation providers solely to fulfill
          your requests.
        </p>
        <h2 className="mt-8 text-base font-medium text-fg">Your rights</h2>
        <p className="mt-2">
          You can request export or deletion of your account data at any
          time by contacting hello@backlot.ai.
        </p>
      </div>
    </>
  );
}
