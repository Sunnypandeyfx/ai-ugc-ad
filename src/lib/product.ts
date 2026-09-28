export const ASSET_BUCKET = "product-assets";

export const ASSET_KINDS = [
  { key: "main", label: "Main photo", single: true, max: 1 },
  { key: "front", label: "Front", single: true, max: 1 },
  { key: "side", label: "Side", single: true, max: 1 },
  { key: "back", label: "Back", single: true, max: 1 },
  { key: "reference", label: "Reference images", single: false, max: 6 },
  { key: "logo", label: "Logo", single: true, max: 1 },
  { key: "brand", label: "Brand assets", single: false, max: 6 },
] as const;

export type AssetKind = (typeof ASSET_KINDS)[number]["key"];

export function assetKind(key: string) {
  return ASSET_KINDS.find((k) => k.key === key);
}

export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
export const MAX_ASSET_BYTES = 5 * 1024 * 1024;

export const MAX_ANALYSES_PER_PRODUCT = 5;

// What Claude inferred from the photos. Never used in an ad directly.
export type ProductAnalysis = {
  product_name: string;
  brand_name: string;
  category: string;
  summary: string;
  visible_text: string[];
  visual_features: string[];
  colors: string[];
  suggested_audiences: string[];
  uncertainties: string[];
  confidence: "high" | "medium" | "low";
};

// What the customer confirmed. The only product facts an ad may state.
export type ConfirmedFacts = {
  name: string;
  brand_name: string;
  category: string;
  description: string;
  facts: string[];
};

export const FACT_LIMITS = {
  name: 80,
  brand_name: 60,
  category: 60,
  description: 600,
  fact: 200,
  facts: 12,
} as const;

export type ProductAsset = {
  id: string;
  kind: AssetKind;
  storage_path: string;
  created_at: string;
  url: string | null;
};

export type AnalysisStatus = "none" | "running" | "ready" | "failed";

// A serverless function can be killed mid-analysis and leave the row
// "running"; after this long we treat it as failed so the customer can retry.
export const ANALYSIS_STALE_MS = 3 * 60 * 1000;

export function isAnalysisRunning(status: string, startedAt: string | null): boolean {
  if (status !== "running" || !startedAt) return false;
  return Date.now() - new Date(startedAt).getTime() < ANALYSIS_STALE_MS;
}
