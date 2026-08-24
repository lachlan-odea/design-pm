import type { Project } from "./types";

type ContentTypeFields = Pick<Project, "contentType" | "contentTypes">;

// A project's content types, tolerating docs written before the field went
// multi-value. No migration was run: every read goes through here, so an
// untouched legacy doc keeps working indefinitely and converges to an array
// the first time somebody saves it.
export function projectContentTypes(p: ContentTypeFields): string[] {
  if (p.contentTypes && p.contentTypes.length > 0) return p.contentTypes;
  // Guard against a legacy doc that somehow stored an array here, and against
  // an empty string, which is how "unset" was previously represented.
  if (Array.isArray(p.contentType)) return p.contentType;
  return p.contentType ? [p.contentType] : [];
}

// Comma-joined for display. Callers that need an em dash for "none" pass the
// fallback they want.
export function contentTypesLabel(
  p: ContentTypeFields,
  fallback = "—",
): string {
  const list = projectContentTypes(p);
  return list.length > 0 ? list.join(", ") : fallback;
}

// Flattened into the free-text blob the search box matches against.
export function contentTypesSearchText(p: ContentTypeFields): string {
  return projectContentTypes(p).join(" ");
}

// Trim, drop blanks, and de-duplicate case-insensitively while keeping the
// casing the user typed. Stops "Web" and "web" becoming two chips.
export function normaliseContentTypes(values: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of values) {
    const value = raw.trim();
    if (!value) continue;
    const key = value.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(value);
  }
  return out;
}
