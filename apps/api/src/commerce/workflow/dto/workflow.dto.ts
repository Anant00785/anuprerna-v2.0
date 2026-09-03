export function parseWorkflowTemplateInput(body: any): any {
  if (!body) throw new Error('Invalid input');
  return {
    name: body.name,
    description: body.description,
    isActive: body.isActive ?? true
  };
}

export function parseWorkflowInput(body: any): any {
  if (!body) throw new Error('Invalid input');
  return {
    templateId: Number(body.templateId),
    orderId: body.orderId ? Number(body.orderId) : null,
    status: body.status
  };
}

export function parseElementFeedbackInput(body: any): any {
  if (!body) throw new Error('Invalid input');
  return {
    elementId: Number(body.elementId),
    feedbackText: body.feedbackText,
    artisanId: body.artisanId ? Number(body.artisanId) : null
  };
}
