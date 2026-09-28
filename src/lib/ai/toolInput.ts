// Claude occasionally returns a nested array or object argument as a
// JSON-encoded string instead of structured JSON. Accept both.
export function asArray(value: unknown): unknown[] {
  const parsed = typeof value === "string" ? safeParse(value) : value;
  return Array.isArray(parsed) ? parsed : [];
}

export function asObject(value: unknown): Record<string, unknown> {
  const parsed = typeof value === "string" ? safeParse(value) : value;
  return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? (parsed as Record<string, unknown>) : {};
}

// Sometimes the whole answer arrives JSON-encoded inside its main field,
// e.g. {"shots": "{\"title\": ..., \"shots\": [...]}"}; lift it back out.
export function unwrapToolInput(input: unknown, key: string): Record<string, unknown> {
  const outer = asObject(input);
  if (typeof outer[key] !== "string") return outer;
  const parsed = safeParse(outer[key] as string);
  if (Array.isArray(parsed)) return { ...outer, [key]: parsed };
  if (parsed && typeof parsed === "object" && key in parsed) {
    return { ...outer, ...(parsed as Record<string, unknown>) };
  }
  return outer;
}

function safeParse(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}
