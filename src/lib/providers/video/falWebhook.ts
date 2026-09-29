import "server-only";
import { createHash, createPublicKey, verify as edVerify } from "node:crypto";

// Verified against fal's own docs on 2026-09-29 (fal.ai/docs/model-endpoints/webhooks):
//   headers: X-Fal-Webhook-Request-Id, X-Fal-Webhook-User-Id,
//            X-Fal-Webhook-Timestamp, X-Fal-Webhook-Signature (hex, Ed25519)
//   signed message: `${requestId}\n${userId}\n${timestamp}\n${sha256hex(rawBody)}`
//   public keys: https://rest.fal.ai/.well-known/jwks.json (standard JWKS,
//   kty "OKP", crv "Ed25519")
const JWKS_URL = "https://rest.fal.ai/.well-known/jwks.json";
const MAX_CLOCK_SKEW_SECONDS = 300;

type Jwk = { kty: string; crv: string; x: string };

let cachedKeys: { keys: Jwk[]; fetchedAt: number } | null = null;
const JWKS_TTL_MS = 10 * 60 * 1000;

async function getJwks(): Promise<Jwk[]> {
  if (cachedKeys && Date.now() - cachedKeys.fetchedAt < JWKS_TTL_MS) return cachedKeys.keys;
  const res = await fetch(JWKS_URL, { cache: "no-store" });
  if (!res.ok) throw new Error(`Could not fetch fal.ai JWKS (${res.status}).`);
  const json = (await res.json()) as { keys: Jwk[] };
  cachedKeys = { keys: json.keys ?? [], fetchedAt: Date.now() };
  return cachedKeys.keys;
}

export type FalWebhookHeaders = {
  requestId: string | null;
  userId: string | null;
  timestamp: string | null;
  signature: string | null;
};

export async function verifyFalWebhook(
  rawBody: string,
  headers: FalWebhookHeaders,
): Promise<boolean> {
  const { requestId, userId, timestamp, signature } = headers;
  if (!requestId || !userId || !timestamp || !signature) return false;

  const age = Math.abs(Date.now() / 1000 - Number(timestamp));
  if (!Number.isFinite(age) || age > MAX_CLOCK_SKEW_SECONDS) return false;

  let signatureBytes: Buffer;
  try {
    signatureBytes = Buffer.from(signature, "hex");
  } catch {
    return false;
  }
  if (signatureBytes.length === 0) return false;

  const bodyHashHex = createHash("sha256").update(rawBody, "utf8").digest("hex");
  const message = Buffer.from(`${requestId}\n${userId}\n${timestamp}\n${bodyHashHex}`, "utf8");

  let keys: Jwk[];
  try {
    keys = await getJwks();
  } catch {
    return false;
  }

  for (const jwk of keys) {
    if (jwk.kty !== "OKP" || jwk.crv !== "Ed25519") continue;
    try {
      const keyObject = createPublicKey({
        key: { kty: jwk.kty, crv: jwk.crv, x: jwk.x },
        format: "jwk",
      });
      if (edVerify(null, message, keyObject, signatureBytes)) return true;
    } catch {
      continue;
    }
  }
  return false;
}
