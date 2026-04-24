import api from './api';

export interface GenerateRequest {
  prompt: string;
  diagramType: string;
  workspaceId: string;
}

export const aiService = {
  async generate(data: GenerateRequest): Promise<{ syntax: string; visualData: any }> {
    const response = await api.post('/ai/generate', data);
    return response.data;
  },

  async explain(syntax: string, diagramType: string): Promise<{ explanation: string }> {
    const response = await api.post('/ai/explain', { syntax, diagramType });
    return response.data;
  },

  async improve(syntax: string, diagramType: string, instruction: string): Promise<{ syntax: string }> {
    const response = await api.post('/ai/improve', { syntax, diagramType, instruction });
    return response.data;
  },

  async streamGenerate(data: GenerateRequest, onChunk: (chunk: string) => void): Promise<void> {
    const response = await fetch(`${api.defaults.baseURL}/ai/stream-generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error('Stream generation failed');
    }

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();

    if (!reader) return;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      onChunk(chunk);
    }
  },
};
