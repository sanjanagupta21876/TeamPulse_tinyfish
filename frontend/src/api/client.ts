import {
  Project,
  Task,
  RiskAssessment,
  ResearchResult,
  ResearchSource,
  RecoveryPlan,
  ActivityEvent,
  HealthStatus
} from '../types';

const BASE_URL = '/api';

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let errorMsg = `HTTP Error ${res.status}`;
    try {
      const errJson = await res.json();
      if (errJson.detail) {
        errorMsg = typeof errJson.detail === 'string' ? errJson.detail : JSON.stringify(errJson.detail);
      }
    } catch {
      // ignore
    }
    throw new Error(errorMsg);
  }
  return res.json();
}

export const api = {
  async getHealth(): Promise<HealthStatus> {
    const res = await fetch(`${BASE_URL}/health`);
    return handleResponse<HealthStatus>(res);
  },

  async getProjects(): Promise<Project[]> {
    const res = await fetch(`${BASE_URL}/projects`);
    return handleResponse<Project[]>(res);
  },

  async getProject(projectId: string): Promise<Project> {
    const res = await fetch(`${BASE_URL}/projects/${projectId}`);
    return handleResponse<Project>(res);
  },

  async analyzeRisk(projectId: string): Promise<RiskAssessment> {
    const res = await fetch(`${BASE_URL}/projects/${projectId}/analyze`, {
      method: 'POST'
    });
    return handleResponse<RiskAssessment>(res);
  },

  async resetDemo(): Promise<{ message: string; project_id: string }> {
    const res = await fetch(`${BASE_URL}/projects/reset-demo`, {
      method: 'POST'
    });
    return handleResponse<{ message: string; project_id: string }>(res);
  },

  async getTasks(projectId: string): Promise<Task[]> {
    const res = await fetch(`${BASE_URL}/projects/${projectId}/tasks`);
    return handleResponse<Task[]>(res);
  },

  async createTask(data: Partial<Task> & { id: string; project_id: string; title: string; owner: string }): Promise<Task> {
    const res = await fetch(`${BASE_URL}/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return handleResponse<Task>(res);
  },

  async updateTask(taskId: string, data: Partial<Task>): Promise<Task> {
    const res = await fetch(`${BASE_URL}/tasks/${taskId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return handleResponse<Task>(res);
  },

  async researchBlocker(
    projectId: string,
    params: { task_id?: string; query?: string; purpose?: string; fetch_top_url?: boolean }
  ): Promise<ResearchResult> {
    const res = await fetch(`${BASE_URL}/projects/${projectId}/research`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ project_id: projectId, ...params })
    });
    return handleResponse<ResearchResult>(res);
  },

  async getProjectSources(projectId: string): Promise<ResearchSource[]> {
    const res = await fetch(`${BASE_URL}/projects/${projectId}/research-sources`);
    return handleResponse<ResearchSource[]>(res);
  },

  async generateRecoveryPlan(
    projectId: string,
    taskId: string,
    customContext?: string
  ): Promise<RecoveryPlan> {
    const res = await fetch(`${BASE_URL}/recovery-plans/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ project_id: projectId, task_id: taskId, custom_context: customContext })
    });
    return handleResponse<RecoveryPlan>(res);
  },

  async approveRecoveryPlan(
    planId: string,
    notes?: string,
    customAction?: string
  ): Promise<RecoveryPlan> {
    const res = await fetch(`${BASE_URL}/recovery-plans/${planId}/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notes, custom_action: customAction })
    });
    return handleResponse<RecoveryPlan>(res);
  },

  async rejectRecoveryPlan(planId: string, reason: string): Promise<RecoveryPlan> {
    const res = await fetch(`${BASE_URL}/recovery-plans/${planId}/reject`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason })
    });
    return handleResponse<RecoveryPlan>(res);
  },

  async verifyRecoveryPlan(
    planId: string,
    outcome: 'RESOLVED' | 'PARTIALLY_RESOLVED' | 'STILL_BLOCKED',
    notes: string
  ): Promise<{
    success: boolean;
    resolved: boolean;
    project_risk: string;
    outcome: any;
    adapted_plan: RecoveryPlan | null;
  }> {
    const res = await fetch(`${BASE_URL}/recovery-plans/${planId}/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ outcome, notes })
    });
    return handleResponse(res);
  },

  async getRecoveryHistory(projectId: string): Promise<RecoveryPlan[]> {
    const res = await fetch(`${BASE_URL}/projects/${projectId}/recovery-history`);
    return handleResponse<RecoveryPlan[]>(res);
  },

  async getEvents(projectId: string): Promise<ActivityEvent[]> {
    const res = await fetch(`${BASE_URL}/projects/${projectId}/events`);
    return handleResponse<ActivityEvent[]>(res);
  }
};
