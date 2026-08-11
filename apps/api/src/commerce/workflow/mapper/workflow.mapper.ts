// @ts-nocheck
import { IWorkflow, IWorkflowTemplate, IElementFeedback } from '../types/workflow.types.js';

export function mapWorkflowRowToDto(row: any): IWorkflow {
  return {
    id: row.id,
    templateId: row.templateId,
    orderId: row.orderId,
    status: row.status
  };
}

export function mapWorkflowTemplateRowToDto(row: any): IWorkflowTemplate {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    isActive: row.isActive
  };
}

export function mapElementFeedbackRowToDto(row: any): IElementFeedback {
  return {
    id: row.id,
    elementId: row.elementId,
    feedbackText: row.feedbackText,
    artisanId: row.artisanId
  };
}
// @ts-nocheck
// @ts-nocheck
