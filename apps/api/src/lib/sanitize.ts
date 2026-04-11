// ---------------------------------------------------------------------------
// XSS sanitization — strip HTML tags from user input
// ---------------------------------------------------------------------------

/**
 * Strips all HTML tags from a string to prevent XSS.
 * Preserves text content, removes everything between < and >.
 * Also decodes common HTML entities and strips event handlers.
 */
export function stripHtml(input: string): string {
  return input
    // Remove script/style tags and their content
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
    // Remove all HTML tags
    .replace(/<[^>]*>/g, "")
    // Decode common HTML entities
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, "/")
    // After decoding, strip any newly formed tags
    .replace(/<[^>]*>/g, "")
    .trim();
}

/**
 * Sanitizes an object's string values recursively.
 * Useful for sanitizing request bodies before processing.
 */
export function sanitizeObject<T>(obj: T): T {
  if (typeof obj === "string") {
    return stripHtml(obj) as T;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizeObject(item)) as T;
  }

  if (obj !== null && typeof obj === "object") {
    const sanitized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
      sanitized[key] = sanitizeObject(value);
    }
    return sanitized as T;
  }

  return obj;
}
