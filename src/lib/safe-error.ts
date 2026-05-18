/**
 * Map raw Supabase/PostgREST/AI errors to safe, user-friendly messages.
 * Real error is logged to the console for debugging; never returned to UI.
 */
export function safeErrorMessage(err: unknown, fallback = "Something went wrong. Please try again."): string {
  if (typeof console !== "undefined") console.error("[app error]", err);

  const code = (err as { code?: string } | null)?.code;
  if (code) {
    switch (code) {
      case "23505": return "That entry already exists.";
      case "23503": return "Related item is missing.";
      case "23502": return "Please fill in all required fields.";
      case "23514": return "One of the values isn't valid.";
      case "42501":
      case "PGRST301": return "You don't have permission to do that.";
      case "PGRST116": return "We couldn't find what you were looking for.";
    }
  }

  const status = (err as { status?: number } | null)?.status;
  if (status === 401 || status === 403) return "You don't have permission to do that.";
  if (status === 404) return "We couldn't find what you were looking for.";
  if (status === 429) return "Too many requests. Please slow down a moment.";

  // For network/timeout, keep generic
  return fallback;
}
