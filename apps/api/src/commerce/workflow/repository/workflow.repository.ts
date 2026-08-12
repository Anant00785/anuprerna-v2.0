// @ts-nocheck
import { Inject, Injectable } from '@nestjs/common';
import { DATABASE_CONNECTION } from '../../../database/database.module.js';
import * as schema from '../../../database/schema/schema.js';
import { eq, and, sql } from 'drizzle-orm';
import { IWorkflow, IWorkflowTemplate, IStepElement, ISubProcessElement, IElementFeedback } from '../types/workflow.types.js';

@Injectable()
export class WorkflowRepository {
  constructor(
    @Inject(DATABASE_CONNECTION) private readonly db: any
  ) {}

  // --- Workflow Templates ---
  async getWorkflowTemplates() {
    return this.db.select().from(schema.workflowTemplate);
  }

  async getWorkflowTemplateById(templateId: number) {
    const res = await this.db.select().from(schema.workflowTemplate).where(eq(schema.workflowTemplate.id, templateId));
    return res[0] || null;
  }

  async createWorkflowTemplate(data: any) {
    return this.db.insert(schema.workflowTemplate).values(data).returning();
  }

  async updateWorkflowTemplate(templateId: number, data: any) {
    return this.db.update(schema.workflowTemplate).set(data).where(eq(schema.workflowTemplate.id, templateId)).returning();
  }

  async deleteWorkflowTemplate(templateId: number) {
    return this.db.delete(schema.workflowTemplate).where(eq(schema.workflowTemplate.id, templateId)).returning();
  }

  async getTableExplorerWorkflowTemplates(page: number, size: number) {
    const limit = size;
    const offset = (page - 1) * size;
    return this.db.select().from(schema.workflowTemplate).limit(limit).offset(offset);
  }

  // --- Workflows ---
  async getWorkflowsByStatus(status: string) {
    return this.db.select().from(schema.workflow).where(eq(schema.workflow.status, status));
  }

  async getArtisanWorkflowsByStatus(status: string, artisanId: number) {
    // Assuming artisan mapping exists
    return this.db.select()
      .from(schema.workflow)
      .innerJoin(schema.workflowArtisanMapping, eq(schema.workflow.id, schema.workflowArtisanMapping.workflowId))
      .where(and(eq(schema.workflow.status, status), eq(schema.workflowArtisanMapping.artisanId, artisanId)));
  }

  async getWorkflowById(workflowId: number) {
    const res = await this.db.select().from(schema.workflow).where(eq(schema.workflow.id, workflowId));
    return res[0] || null;
  }

  async createWorkflow(data: any) {
    return this.db.insert(schema.workflow).values(data).returning();
  }

  async updateWorkflow(workflowId: number, data: any) {
    return this.db.update(schema.workflow).set(data).where(eq(schema.workflow.id, workflowId)).returning();
  }

  async deleteWorkflow(workflowId: number) {
    return this.db.delete(schema.workflow).where(eq(schema.workflow.id, workflowId)).returning();
  }

  // --- Step Elements ---
  async updateStepElement(id: number, data: any) {
    return this.db.update(schema.stepElement).set(data).where(eq(schema.stepElement.id, id)).returning();
  }
  
  // --- Element Feedback ---
  async createElementFeedback(data: any) {
    return this.db.insert(schema.elementFeedback).values(data).returning();
  }

  async updateElementFeedback(id: number, data: any) {
    return this.db.update(schema.elementFeedback).set(data).where(eq(schema.elementFeedback.id, id)).returning();
  }

  async getElementFeedbackById(id: number) {
    const res = await this.db.select().from(schema.elementFeedback).where(eq(schema.elementFeedback.id, id));
    return res[0] || null;
  }
}
// @ts-nocheck
// @ts-nocheck
