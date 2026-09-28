// Some avatar looks only render on avatar_iii, not the avatar_iv default —
// requesting an unsupported engine 400s, so always pick from what the look
// actually declares rather than omitting `engine` and hoping for the best.
// Pure logic only (no API calls), so this is safe to import from client code.
export function preferredEngine(supported?: string[]): string | null {
  if (!supported || supported.length === 0) return null;
  if (supported.includes("avatar_iv")) return "avatar_iv";
  if (supported.includes("avatar_v")) return "avatar_v";
  return supported[0];
}
