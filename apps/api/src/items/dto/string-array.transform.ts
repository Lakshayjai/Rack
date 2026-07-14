/**
 * class-transformer helpers for string[] DTO fields that may arrive either as a
 * real array (JSON body) or as a JSON-encoded string (multipart form field on
 * upload). A bare string that isn't valid JSON is wrapped as a one-element array.
 */

function parse(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String);
  if (typeof value === 'string' && value.trim() !== '') {
    try {
      const parsed: unknown = JSON.parse(value);
      return Array.isArray(parsed) ? parsed.map(String) : [value];
    } catch {
      return [value];
    }
  }
  return [];
}

/** For required fields: anything unparsable (including missing) becomes []. */
export function toStringArray({ value }: { value: unknown }): string[] {
  return parse(value);
}

/** For optional (PATCH) fields: an absent value stays undefined so it isn't updated. */
export function toOptionalStringArray({ value }: { value: unknown }): string[] | undefined {
  if (value === undefined) return undefined;
  return parse(value);
}
