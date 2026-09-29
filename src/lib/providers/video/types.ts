import "server-only";

export type VideoJobStatus = "queued" | "generating" | "ready" | "failed";

export type SubmitImageToVideoInput = {
  imageUrl: string;
  prompt: string;
  aspectRatio: "9:16" | "16:9" | "1:1";
  durationSeconds: number;
  webhookUrl: string | null;
};

export type SubmitImageToVideoResult = {
  providerJobId: string;
};

export type ProviderJobResult =
  | { status: "queued" | "generating" }
  | { status: "ready"; videoUrl: string }
  | { status: "failed"; error: string };

// Every video provider (fal, and later others) implements this. Pipeline
// code (server actions, the webhook route) only ever talks to this
// interface, so swapping the provider or the model behind it never touches
// storyboard, credit or job logic.
export interface VideoProvider {
  readonly name: string;
  submitImageToVideo(input: SubmitImageToVideoInput): Promise<SubmitImageToVideoResult>;
  checkJob(providerJobId: string): Promise<ProviderJobResult>;
  estimateCredits(durationSeconds: number): number;
}
