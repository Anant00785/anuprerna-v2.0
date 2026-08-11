// @ts-nocheck
import { Injectable } from '@nestjs/common';
import { WorkflowRepository } from '../repository/workflow.repository.js';
import { IWorkflow, IWorkflowTemplate, IStepElement, ISubProcessElement, IElementFeedback } from '../types/workflow.types.js';

@Injectable()
export class WorkflowService {
  constructor(private readonly workflowRepository: WorkflowRepository) {}

  // --- Workflow Templates ---
  async getWorkflowTemplates() {
    return this.workflowRepository.getWorkflowTemplates();
  }

  async getWorkflowTemplateById(templateId: number) {
    return this.workflowRepository.getWorkflowTemplateById(templateId);
  }

  async createWorkflowTemplate(data: any) {
    return this.workflowRepository.createWorkflowTemplate(data);
  }

  async updateWorkflowTemplate(templateId: number, data: any) {
    return this.workflowRepository.updateWorkflowTemplate(templateId, data);
  }

  async deleteWorkflowTemplate(templateId: number) {
    return this.workflowRepository.deleteWorkflowTemplate(templateId);
  }

  async getTableExplorerWorkflowTemplates(page: number, size: number) {
    return this.workflowRepository.getTableExplorerWorkflowTemplates(page, size);
  }

  // --- Workflows ---
  async getWorkflowsByStatus(status: string) {
    return this.workflowRepository.getWorkflowsByStatus(status);
  }

  async getArtisanWorkflowsByStatus(status: string, artisanId: number) {
    return this.workflowRepository.getArtisanWorkflowsByStatus(status, artisanId);
  }

  async getWorkflowById(workflowId: number) {
    return this.workflowRepository.getWorkflowById(workflowId);
  }

  async createWorkflow(data: any) {
    return this.workflowRepository.createWorkflow(data);
  }

  async updateWorkflow(workflowId: number, data: any) {
    return this.workflowRepository.updateWorkflow(workflowId, data);
  }

  async deleteWorkflow(workflowId: number) {
    return this.workflowRepository.deleteWorkflow(workflowId);
  }

  // --- Step Elements ---
  async updateStepElement(id: number, data: any) {
    return this.workflowRepository.updateStepElement(id, data);
  }

  // --- Element Feedback ---
  async createElementFeedback(data: any) {
    return this.workflowRepository.createElementFeedback(data);
  }

  async updateElementFeedback(id: number, data: any) {
    return this.workflowRepository.updateElementFeedback(id, data);
  }

  async getElementFeedbackById(id: number) {
    return this.workflowRepository.getElementFeedbackById(id);
  }
}
// @ts-nocheck
