import { apiClient } from './client';

export interface AgentRun {
  id: number;
  project_id: number;
  agent_id: string;
  agent_name: string;
  status: string;
  output_data?: any;
  created_at: string;
}

export interface OrchestrationRequest {
  project_id: number;
  config?: any;
}

// 启动 Agent 编排
export const orchestrateAgents = async (data: OrchestrationRequest) => {
  const response = await apiClient.post('/agents/orchestrate', data);
  return response.data;
};

// 获取 Agent 执行记录
export const getAgentRuns = async (projectId: number): Promise<AgentRun[]> => {
  const response = await apiClient.get(`/agents/runs/${projectId}`);
  return response.data;
};
