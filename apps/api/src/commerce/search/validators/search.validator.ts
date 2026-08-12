export function validateSearchTerm(term: string): string | null {
  if (typeof term !== "string") {
    return "Search term must be a string.";
  }
  const trimmed = term.trim();
  if (trimmed.length === 0) {
    return "Search term cannot be empty.";
  }
  if (trimmed.length >= 300) {
    return "Search term must be less than 300 characters.";
  }
  return null; // valid
}
// @ts-nocheck
// @ts-nocheck
