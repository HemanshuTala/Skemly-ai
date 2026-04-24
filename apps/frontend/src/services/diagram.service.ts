import api from './api';

export interface Diagram {
  id: string;
  title: string;
  type: string;
  syntax: string;
  visualData: any;
  notes: string;
  projectId?: string;
  workspaceId: string;
  createdBy: string;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDiagramData {
  title: string;
  type: string;
  syntax?: string;
  visualData?: any;
  notes?: string;
  projectId?: string;
  workspaceId: string;
}

export const diagramService = {
  async getDiagrams(params: {
    workspaceId?: string;
    projectId?: string;
    page?: number;
    limit?: number;
  }): Promise<{ diagrams: Diagram[]; total: number }> {
    const response = await api.get('/diagrams', { params });
    return response.data;
  },

  async getDiagram(id: string): Promise<Diagram> {
    const response = await api.get(`/diagrams/${id}`);
    return response.data;
  },

  async createDiagram(data: CreateDiagramData): Promise<Diagram> {
    const response = await api.post('/diagrams', data);
    return response.data;
  },

  async updateDiagram(id: string, data: Partial<CreateDiagramData>): Promise<Diagram> {
    const response = await api.put(`/diagrams/${id}`, data);
    return response.data;
  },

  async deleteDiagram(id: string): Promise<void> {
    await api.delete(`/diagrams/${id}`);
  },

  async shareDiagram(id: string, settings: any): Promise<{ publicUrl: string }> {
    const response = await api.post(`/diagrams/${id}/share`, settings);
    return response.data;
  },

  async getVersions(id: string): Promise<any[]> {
    const response = await api.get(`/diagrams/${id}/versions`);
    return response.data;
  },
};
