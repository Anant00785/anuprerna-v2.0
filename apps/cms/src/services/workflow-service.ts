import { apiClient } from '@/lib/api';
import { unwrapResponseData } from '@/lib/api-helper';

export class WorkflowService {
  public static async getWorkflowTemplates(): Promise<any[]> {
    const response = await apiClient.get('/get/workflow-template-list');
    return unwrapResponseData<any[]>(response.data, 'workflowTemplateList');
  }

  public static async getWorkflowTemplateById(id: string | number): Promise<any> {
    const response = await apiClient.get(`/get/workflow-template/${id}`);
    return unwrapResponseData<any>(response.data, 'workflowTemplate');
  }

  public static async updateWorkflowTemplate(payload: any): Promise<any> {
    const response = await apiClient.post('/update/workflow-template', payload);
    return response.data;
  }

  public static async getWorkflows(status: string = 'active'): Promise<any[]> {
    const response = await apiClient.get(`/get/workflow-list/${status}`);
    return unwrapResponseData<any[]>(response.data, 'workflowList');
  }

  public static async getCustomWorkflows(status: string = 'active'): Promise<any[]> {
    const response = await apiClient.get(`/get/custom-workflow-list/${status}`);
    return unwrapResponseData<any[]>(response.data, 'customWorkflowList');
  }

  public static async getWorkflowFeedback(): Promise<any[]> {
    const response = await apiClient.get('/get/element/feedback');
    return unwrapResponseData<any[]>(response.data, 'elementFeedbackList');
  }

  public static async getArtisanPayments(): Promise<any[]> {
    const response = await apiClient.get('/get/artisan-payments');
    return unwrapResponseData<any[]>(response.data, 'artisanPaymentRecordList');
  }
}
