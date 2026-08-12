// @ts-nocheck
export function validateWorkflowInput(input: any): string[] {
  const errors: string[] = [];
  if (!input.templateId) errors.push('templateId is required');
  if (!input.status) errors.push('status is required');
  return errors;
}

export function validateWorkflowTemplateInput(input: any): string[] {
  const errors: string[] = [];
  if (!input.name) errors.push('name is required');
  return errors;
}
// @ts-nocheck
// @ts-nocheck
