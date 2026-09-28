import "server-only";
import DodoPayments from "dodopayments";

// `environment` is a narrow union, but env vars are `string | undefined` —
// narrow explicitly and default to test mode so a missing/misspelled
// variable can never accidentally hit live.
export const dodoEnvironment =
  process.env.DODO_PAYMENTS_ENVIRONMENT === "live_mode" ? "live_mode" : "test_mode";

export const dodo = new DodoPayments({
  bearerToken: process.env.DODO_PAYMENTS_API_KEY,
  environment: dodoEnvironment,
});

export type PlanId = "starter" | "growth" | "agency";

export const PLANS: Record<
  PlanId,
  { productId: string; name: string; priceUsd: number; monthlyCredits: number }
> = {
  starter: {
    productId: "pdt_0Noa3nxp6Sd3qnZK8vf7L",
    name: "Starter",
    priceUsd: 49,
    monthlyCredits: 10,
  },
  growth: {
    productId: "pdt_0Noa3nzv4Pk7JKntnE33i",
    name: "Growth",
    priceUsd: 149,
    monthlyCredits: 40,
  },
  agency: {
    productId: "pdt_0Noa3o12aMfYAil9348if",
    name: "Agency",
    priceUsd: 399,
    monthlyCredits: 150,
  },
};

export function planForProductId(productId: string): PlanId | null {
  const entry = (Object.entries(PLANS) as [PlanId, (typeof PLANS)[PlanId]][]).find(
    ([, plan]) => plan.productId === productId,
  );
  return entry?.[0] ?? null;
}
