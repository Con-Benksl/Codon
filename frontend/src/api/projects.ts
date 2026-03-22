import { apiClient } from './client';

export interface Project {
  id: number;
  name: string;
  description?: string;
  owner_id: number;
  config_json: Record<string, any>;
  status: string;
  created_at: string;
  updated_at?: string;
}

export interface ProjectCreate {
  name: string;
  description?: string;
  config_json?: Record<string, any>;
}

export interface ProjectUpdate {
  name?: string;
  description?: string;
  config_json?: Record<string, any>;
  status?: string;
}

export const createProject = async (data: ProjectCreate): Promise<Project> => {
  const response = await apiClient.post('/projects/', data);
  return response.data;
};

export const getProjects = async (): Promise<Project[]> => {
  const response = await apiClient.get('/projects/');
  return response.data;
};

export const getProject = async (id: number): Promise<Project> => {
  const response = await apiClient.get(`/projects/${id}`);
  return response.data;
};

export const updateProject = async (id: number, data: ProjectUpdate): Promise<Project> => {
  const response = await apiClient.put(`/projects/${id}`, data);
  return response.data;
};

export const deleteProject = async (id: number): Promise<void> => {
  await apiClient.delete(`/projects/${id}`);
};
