export function sanitizeWorkflowTemplateName(name: string): string {
  if (!name) return name;
  return name.trim().replace(/\s+/g, ' ');
}

export function sanitizeFeedbackText(text: string): string {
  if (!text) return text;
  return text.trim();
}
