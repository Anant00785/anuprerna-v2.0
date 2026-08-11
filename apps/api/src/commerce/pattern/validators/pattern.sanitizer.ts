export function sanitizePatternName(name: string) {
  return name.trim().replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
