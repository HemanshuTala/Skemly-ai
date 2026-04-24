import api from './api';

export interface Workspace {
  id: string;
  name: string;
  icon?: string;
  plan: 'free' | 'starter' | 'basic' | 'pro' | 'team';
  ownerId: string;
  createdAt: string;
}

export interface CreateWorkspaceData {
  name: string;
  icon?: string;
}

export const workspaceService = {
  async getWorkspaces(): Promise<Workspace[]> {
    const response = await api.get('/workspaces');
    return response.data;
  },

  async getWorkspace(id: string): Promise<Workspace> {
    const response = await api.get(`/workspaces/${id}`);
    return response.data;
  },

  async createWorkspace(data: CreateWorkspaceData): Promise<Workspace> {
    const response = await api.post('/workspaces', data);
    return response.data;
  },

  async updateWorkspace(id: string, data: Partial<CreateWorkspaceData>): Promise<Workspace> {
    const response = await api.put(`/workspaces/${id}`, data);
    return response.data;
  },

  async deleteWorkspace(id: string): Promise<void> {
    await api.delete(`/workspaces/${id}`);
  },

  async inviteMember(workspaceId: string, email: string, role: string): Promise<void> {
    await api.post(`/workspaces/${workspaceId}/invite`, { email, role });
  },

  async getMembers(workspaceId: string): Promise<any[]> {
    const response = await api.get(`/workspaces/${workspaceId}/members`);
    return response.data;
  },

  async removeMember(workspaceId: string, userId: string): Promise<void> {
    await api.delete(`/workspaces/${workspaceId}/members/${userId}`);
  },
};
