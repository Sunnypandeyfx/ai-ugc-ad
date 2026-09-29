import "server-only";
import { falVideoProvider } from "./fal";
import type { VideoProvider } from "./types";

// Single switch point: every caller imports getVideoProvider() instead of
// a concrete provider, so adding or swapping providers never touches
// storyboard, credit-ledger or job code.
export function getVideoProvider(): VideoProvider {
  return falVideoProvider;
}

export type { ProviderJobResult, SubmitImageToVideoInput, VideoProvider } from "./types";
