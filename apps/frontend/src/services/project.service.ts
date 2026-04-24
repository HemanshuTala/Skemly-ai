import api from './api';

export interface Project {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  workspaceId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProjectData {
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  workspaceId: string;
}

export const projectService = {
  async getProjects(workspaceId: string): Promise<Project[]> {
    const response = await api.get(`/workspaces/${workspaceId}/projects`);
    return response.data;
  },

  async getProject(workspaceId: string, projectId: string): Promise<Project> {
    const response = await api.get(`/workspaces/${workspaceId}/projects/${projectId}`);
    return response.data;
  },

  async createProject(workspaceId: string, data: Omit<CreateProjectData, 'workspaceId'>): Promise<Project> {
    const response = await api.post(`/workspaces/${workspaceId}/projects`, data);
    return response.data;
  },

  async updateProject(workspaceId: string, projectId: string, data: Partial<CreateProjectData>): Promise<Project> {
    const response = await api.put(`/workspaces/${workspaceId}/projects/${projectId}`, data);
    return response.data;
  },

  async deleteProject(workspaceId: string, projectId: string): Promise<void> {
    await api.delete(`/workspaces/${workspaceId}/projects/${projectId}`);
  },
};
