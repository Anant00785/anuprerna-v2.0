export enum WorkflowStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

export interface IWorkflowTemplate {
  id?: number;
  name: string;
  description?: string;
  isActive: boolean;
}

export interface IWorkflow {
  id?: number;
  templateId: number;
  orderId?: number;
  status: string;
}

export interface IStepElement {
  id?: number;
  workflowId: number;
  name: string;
  status: string;
}

export interface ISubProcessElement {
  id?: number;
  workflowId: number;
  name: string;
  status: string;
}

export interface IElementFeedback {
  id?: number;
  elementId: number;
  feedbackText: string;
  artisanId?: number;
}
