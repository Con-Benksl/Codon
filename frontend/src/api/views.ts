import { apiClient, getApiBaseUrl } from './client';

export interface RuntimeMetric {
  label: string;
  value: string;
  tone?: string;
}

export interface RuntimeLayoutBlock {
  id: string;
  type: string;
  binding?: string;
}

export interface RuntimeLayoutSection {
  id: string;
  layout: 'stack' | 'grid' | 'split';
  blocks: RuntimeLayoutBlock[];
}

export interface RuntimeLayout {
  page?: {
    title?: string;
    subtitle?: string;
  };
  sections: RuntimeLayoutSection[];
}

export interface ProjectViewSnapshot {
  snapshot_id: number;
  project_id: number;
  view_key: string;
  schema_version: string;
  dataset_version: number;
  generation_status: string;
  layout: RuntimeLayout;
  bindings_manifest: string[];
  resolved_meta: Record<string, any>;
  data: Record<string, any>;
}

export interface ProjectArtifact {
  id: number;
  project_id: number;
  filename: string;
  content_type?: string;
  file_ext: string;
  size_bytes: number;
  parser_type: string;
  parse_status: string;
  parse_summary_json: Record<string, any>;
  created_at: string;
}

export interface ProjectJob {
  id: number;
  project_id: number;
  job_type: string;
  status: string;
  payload_json: Record<string, any>;
  result_json: Record<string, any>;
  events_json: Array<Record<string, any>>;
  error_message?: string | null;
  created_at: string;
  updated_at?: string;
  completed_at?: string | null;
}

export interface ArtifactUploadResponse {
  job: ProjectJob;
  artifacts: ProjectArtifact[];
}

export const getProjectView = async (projectId: number, viewKey: string): Promise<ProjectViewSnapshot> => {
  const response = await apiClient.get(`/projects/${projectId}/views/${viewKey}`);
  return response.data;
};

export const regenerateProjectViews = async (projectId: number, viewKeys: string[]): Promise<ProjectJob> => {
  const response = await apiClient.post(`/projects/${projectId}/views/regenerate`, { view_keys: viewKeys });
  return response.data;
};

export const uploadProjectArtifacts = async (projectId: number, files: File[]): Promise<ArtifactUploadResponse> => {
  const formData = new FormData();
  files.forEach((file) => formData.append('files', file));
  const response = await apiClient.post(`/projects/${projectId}/artifacts`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const getProjectArtifacts = async (projectId: number): Promise<ProjectArtifact[]> => {
  const response = await apiClient.get(`/projects/${projectId}/artifacts`);
  return response.data;
};

export const getProjectJob = async (projectId: number, jobId: number): Promise<ProjectJob> => {
  const response = await apiClient.get(`/projects/${projectId}/jobs/${jobId}`);
  return response.data;
};

export const buildJobEventsUrl = (projectId: number, jobId: number): string => {
  const base = getApiBaseUrl();
  const absoluteBase = base.startsWith('http') ? base : `${window.location.origin}${base}`;
  return `${absoluteBase}/projects/${projectId}/jobs/${jobId}/events`;
};
