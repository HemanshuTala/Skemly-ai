import api from '@/lib/api'

// Types
export interface User {
  id: string
  name: string
  email: string
  avatar?: string
  plan: 'free' | 'starter' | 'basic' | 'pro' | 'team' | 'enterprise'
  emailVerified: boolean
  color?: string
}

const pickId = (obj: any): string => obj?.id || obj?._id || ''

const normalizeUser = (raw: any): User => ({
  id: pickId(raw),
  name: raw?.name || '',
  email: raw?.email || '',
  avatar: raw?.avatar,
  plan: (raw?.plan === 'team' ? 'enterprise' : raw?.plan) || 'free',
  emailVerified: Boolean(raw?.emailVerified),
  color: raw?.color || '#3b82f6',
})

const normalizeWorkspace = (raw: any): Workspace => ({
  id: pickId(raw),
  name: raw?.name || 'Workspace',
  type: raw?.type || 'personal',
  icon: raw?.icon,
  members: raw?.members,
  createdAt: raw?.createdAt || new Date().toISOString(),
})

const normalizeProject = (raw: any): Project => ({
  id: pickId(raw),
  name: raw?.name || 'Untitled Project',
  icon: raw?.icon,
  color: raw?.color,
  workspaceId: raw?.workspaceId || '',
  diagramCount: raw?.diagramCount || 0,
  createdAt: raw?.createdAt || new Date().toISOString(),
})

const normalizeDiagram = (raw: any): Diagram => ({
  id: pickId(raw),
  title: raw?.title || 'Untitled Diagram',
  type: raw?.type || 'flowchart',
  syntax: raw?.syntax || '',
  nodes: raw?.nodes || [],
  edges: raw?.edges || [],
  thumbnail: raw?.thumbnail,
  workspaceId: raw?.workspaceId || '',
  projectId: raw?.projectId || undefined,
  starred: Boolean(raw?.starred || raw?.isStarred),
  trashed: Boolean(raw?.trashed || raw?.isTrashed),
  version: raw?.version || 1,
  isPublic: Boolean(raw?.isPublic),
  publicLinkToken: raw?.publicLinkToken ?? null,
  createdAt: raw?.createdAt || new Date().toISOString(),
  updatedAt: raw?.updatedAt || new Date().toISOString(),
})

export interface Workspace {
  id: string
  name: string
  type: 'personal' | 'team'
  icon?: string
  members?: WorkspaceMember[]
  createdAt: string
}

export interface WorkspaceMember {
  userId: string
  name: string
  email: string
  avatar?: string
  role: 'owner' | 'admin' | 'editor' | 'commenter' | 'viewer'
  joinedAt: string
}

export interface Project {
  id: string
  name: string
  icon?: string
  color?: string
  workspaceId: string
  diagramCount?: number
  createdAt: string
}

export interface Diagram {
  id: string
  title: string
  type: 'flowchart' | 'sequence' | 'class' | 'state' | 'er' | 'gantt' | 'pie' | 'mindmap'
  syntax: string
  nodes?: any[]
  edges?: any[]
  thumbnail?: string
  workspaceId: string
  projectId?: string
  starred: boolean
  trashed: boolean
  version: number
  isPublic?: boolean
  publicLinkToken?: string | null
  createdAt: string
  updatedAt: string
}

export interface Template {
  id: string
  name: string
  description: string
  category: string
  diagramType: string
  thumbnail?: string
  syntax: string
  usageCount: number
}

const normalizeTemplate = (raw: any): Template => ({
  id: pickId(raw),
  name: raw?.name || 'Template',
  description: raw?.description || '',
  category: raw?.category || 'general',
  diagramType: raw?.diagramType || raw?.type || 'flowchart',
  thumbnail: raw?.thumbnail,
  syntax: raw?.syntax || '',
  usageCount: raw?.usageCount || 0,
})

export interface Notification {
  id: string
  type: string
  title: string
  message: string
  read: boolean
  createdAt: string
}

// Auth API
export const authAPI = {
  register: (data: { name: string; email: string; password: string }) =>
    api.post('/auth/register', data),
  
  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data).then((res) => ({
      ...res,
      data: {
        ...res.data,
        data: {
          ...res.data?.data,
          user: normalizeUser(res.data?.data?.user),
        },
      },
    })),
  
  logout: () =>
    api.post('/auth/logout'),
  
  getMe: () =>
    api.get('/auth/me').then((res) => ({
      ...res,
      data: {
        ...res.data,
        data: normalizeUser(res.data.data),
      },
    })),
  
  updateProfile: (data: { name?: string; avatar?: string }) =>
    api.put('/auth/me', data).then((res) => ({
      ...res,
      data: {
        ...res.data,
        data: normalizeUser(res.data?.data),
      },
    })),
  
  forgotPassword: (email: string) =>
    api.post('/auth/forgot-password', { email }),
  
  resetPassword: (token: string, newPassword: string) =>
    api.post('/auth/reset-password', { token, newPassword }),
}

// Workspace API
export const workspaceAPI = {
  list: () =>
    api.get('/workspaces').then((res) => ({
      ...res,
      data: {
        ...res.data,
        data: (res.data?.data || []).map(normalizeWorkspace),
      },
    })),
  
  create: (data: { name: string; type: 'personal' | 'team' }) =>
    api.post('/workspaces', data).then((res) => ({
      ...res,
      data: {
        ...res.data,
        data: normalizeWorkspace(res.data?.data),
      },
    })),
  
  get: (id: string) =>
    api.get(`/workspaces/${id}`).then((res) => ({
      ...res,
      data: {
        ...res.data,
        data: normalizeWorkspace(res.data?.data),
      },
    })),
  
  update: (id: string, data: { name?: string; icon?: string }) =>
    api.put(`/workspaces/${id}`, data).then((res) => ({
      ...res,
      data: {
        ...res.data,
        data: normalizeWorkspace(res.data?.data),
      },
    })),
  
  delete: (id: string) =>
    api.delete(`/workspaces/${id}`),
  
  getMembers: (id: string) =>
    api.get(`/workspaces/${id}/members`).then((res) => ({
      ...res,
      data: {
        ...res.data,
        data: (res.data?.data || []).map((member: any) => ({
          userId: pickId(member?.userId),
          name: member?.userId?.name || member?.name || 'Member',
          email: member?.userId?.email || member?.email || '',
          avatar: member?.userId?.avatar || member?.avatar,
          role: member?.role || 'viewer',
          joinedAt: member?.joinedAt || new Date().toISOString(),
        })),
      },
    })),
  
  invite: (id: string, data: { email: string; role: string }) =>
    api.post(`/workspaces/${id}/invite`, data),

  acceptInvite: (token: string) =>
    api.post('/workspaces/invitations/accept', { token }).then((res) => ({
      ...res,
      data: {
        ...res.data,
        data: normalizeWorkspace(res.data?.data),
      },
    })),
  
  removeMember: (id: string, userId: string) =>
    api.delete(`/workspaces/${id}/members/${userId}`),
  
  updateMemberRole: (id: string, userId: string, role: string) =>
    api.put(`/workspaces/${id}/members/${userId}/role`, { role }),
}

// Project API
export const projectAPI = {
  list: (workspaceId: string) =>
    api.get(`/workspaces/${workspaceId}/projects`).then((res) => ({
      ...res,
      data: {
        ...res.data,
        data: (res.data?.data || []).map(normalizeProject),
      },
    })),
  
  create: (workspaceId: string, data: { name: string; icon?: string; color?: string }) =>
    api.post(`/workspaces/${workspaceId}/projects`, data).then((res) => ({
      ...res,
      data: {
        ...res.data,
        data: normalizeProject(res.data?.data),
      },
    })),
  
  update: (workspaceId: string, id: string, data: { name?: string; icon?: string; color?: string }) =>
    api.put(`/workspaces/${workspaceId}/projects/${id}`, data).then((res) => ({
      ...res,
      data: {
        ...res.data,
        data: normalizeProject(res.data?.data),
      },
    })),
  
  delete: (workspaceId: string, id: string) =>
    api.delete(`/workspaces/${workspaceId}/projects/${id}`),
}

// Diagram API
export const diagramAPI = {
  list: (params?: { workspaceId?: string; projectId?: string; starred?: boolean; trashed?: boolean; page?: number; limit?: number }) =>
    api.get('/diagrams', { params }).then((res) => ({
      ...res,
      data: {
        ...res.data,
        data: (res.data?.data || []).map(normalizeDiagram),
      },
    })),
  
  create: (data: { title: string; type: string; workspaceId: string; projectId?: string; syntax?: string }) =>
    api.post('/diagrams', data).then((res) => ({
      ...res,
      data: {
        ...res.data,
        data: normalizeDiagram(res.data?.data),
      },
    })),
  
  get: (id: string) =>
    api.get(`/diagrams/${id}`).then((res) => ({
      ...res,
      data: {
        ...res.data,
        data: normalizeDiagram(res.data?.data),
      },
    })),
  
  update: (id: string, data: { title?: string; syntax?: string; nodes?: any[]; edges?: any[] }) =>
    api.put(`/diagrams/${id}`, data).then((res) => ({
      ...res,
      data: {
        ...res.data,
        data: normalizeDiagram(res.data?.data),
      },
    })),
  
  delete: (id: string) =>
    api.delete(`/diagrams/${id}`),
  
  duplicate: (id: string) =>
    api.post(`/diagrams/${id}/duplicate`).then((res) => ({
      ...res,
      data: {
        ...res.data,
        data: normalizeDiagram(res.data?.data),
      },
    })),
  
  star: (id: string) =>
    api.post(`/diagrams/${id}/star`),
  
  unstar: (id: string) =>
    api.delete(`/diagrams/${id}/star`),
  
  trash: (id: string) =>
    api.post(`/diagrams/${id}/trash`),
  
  restore: (id: string) =>
    api.post(`/diagrams/${id}/restore`),
  
  share: (id: string, data: { expiresAt?: string; password?: string }) =>
    api.post(`/diagrams/${id}/share`, data),
  
  revokeShare: (id: string) =>
    api.delete(`/diagrams/${id}/share`),
  
  getVersions: (id: string) =>
    api.get(`/diagrams/${id}/versions`),
  
  saveVersion: (id: string, name: string) =>
    api.post(`/diagrams/${id}/versions`, { name }),
  
  restoreVersion: (id: string, versionId: string) =>
    api.post(`/diagrams/${id}/versions/${versionId}/restore`),
}

// Template API
export const templateAPI = {
  list: (params?: { category?: string; workspaceId?: string }) =>
    api.get('/templates', { params }).then((res) => ({
      ...res,
      data: {
        ...res.data,
        data: (res.data?.data || []).map(normalizeTemplate),
      },
    })),
  
  get: (id: string) =>
    api.get(`/templates/${id}`).then((res) => ({
      ...res,
      data: {
        ...res.data,
        data: normalizeTemplate(res.data?.data),
      },
    })),
  
  create: (data: { name: string; description: string; category: string; diagramType: string; syntax: string }) =>
    api.post('/templates', data),
  
  use: (id: string, data: { workspaceId: string; projectId?: string; title: string }) =>
    api.post(`/templates/${id}/use`, data).then((res) => ({
      ...res,
      data: {
        ...res.data,
        data: normalizeDiagram(res.data?.data),
      },
    })),
  
  delete: (id: string) =>
    api.delete(`/templates/${id}`),
}

// Notification API
export const notificationAPI = {
  list: (params?: { unread?: boolean; page?: number; limit?: number }) =>
    api.get<{ success: boolean; data: Notification[]; meta: { page: number; limit: number; total: number; unreadCount: number } }>('/notifications', { params }),
  
  markAsRead: (id: string) =>
    api.put(`/notifications/${id}/read`),
  
  markAllAsRead: () =>
    api.post('/notifications/read-all'),
  
  delete: (id: string) =>
    api.delete(`/notifications/${id}`),

  updatePreferences: (data: Record<string, unknown>) =>
    api.put('/notifications/preferences', data),
}

// Search API
export const searchAPI = {
  search: (params: { q: string; workspaceId?: string; type?: string; page?: number; limit?: number }) =>
    api.get('/search', { params }),
}

// AI API (matches POST /ai/generate — optional diagramId for refine-in-place)
export const aiAPI = {
  generate: (data: {
    prompt: string
    diagramType?: string
    diagramId?: string
    context?: string
  }) => api.post('/ai/generate', data),
  
  codeToDiagram: (data: {
    code: string
    language?: string
    diagramType?: string
  }) => api.post('/ai/code-to-diagram', data),
  
  explain: (data: { diagramId: string; nodeId?: string }) =>
    api.post('/ai/explain', data),
  
  improve: (diagramId: string) =>
    api.post('/ai/improve', { diagramId }),
  
  autofix: (data: { syntax: string; error: string }) =>
    api.post('/ai/autofix', data),
  
  getUsage: () =>
    api.get('/ai/usage'),
}

// Export API (backend expects diagramId; PNG uses optional scale 1 | 2 | 4)
export const exportAPI = {
  exportPNG: (data: { diagramId: string; scale?: 1 | 2 | 4 }) =>
    api.post('/export/png', { diagramId: data.diagramId, scale: data.scale ?? 1 }),

  exportSVG: (diagramId: string) => api.post('/export/svg', { diagramId }),

  exportPDF: (diagramId: string) => api.post('/export/pdf', { diagramId }),

  exportSyntax: (diagramId: string) =>
    api.post('/export/syntax', { diagramId }, { responseType: 'text' }),

  getStatus: (jobId: string) => api.get(`/export/status/${jobId}`),

  /** Returns JSON with fileUrl when export is ready (param is export job id) */
  getDownloadInfo: (jobId: string) => api.get(`/export/download/${jobId}`),
}

// Billing API
export const billingAPI = {
  getPlans: () => api.get('/billing/plans'),
  getSubscription: () => api.get('/billing/subscription'),
  subscribe: (data: { planId: string; paymentMethodId?: string }) =>
    api.post('/billing/subscribe', data),
  verifyPayment: (data: {
    razorpayPaymentId: string;
    razorpaySubscriptionId: string;
    razorpaySignature?: string;
  }) => api.post('/billing/verify-payment', data),
  cancel: () => api.post('/billing/cancel'),
  getPortal: () => api.post('/billing/portal'),
}

// Comment API
export const commentAPI = {
  list: (diagramId: string) =>
    api.get(`/diagrams/${diagramId}/comments`),
  
  create: (diagramId: string, data: { content: string; position?: { x: number; y: number }; mentions?: string[] }) =>
    api.post(`/diagrams/${diagramId}/comments`, data),
  
  update: (diagramId: string, commentId: string, content: string) =>
    api.put(`/diagrams/${diagramId}/comments/${commentId}`, { content }),
  
  delete: (diagramId: string, commentId: string) =>
    api.delete(`/diagrams/${diagramId}/comments/${commentId}`),
  
  resolve: (diagramId: string, commentId: string) =>
    api.post(`/diagrams/${diagramId}/comments/${commentId}/resolve`),
  
  reply: (diagramId: string, commentId: string, content: string) =>
    api.post(`/diagrams/${diagramId}/comments/${commentId}/reply`, { content }),
}

/** Diagram-attached notes (separate from canvas; stored in Note collection) */
export const notesAPI = {
  get: (diagramId: string) =>
    api.get(`/notes/${diagramId}`).then((res) => res.data?.data),

  update: (diagramId: string, body: { content?: object; contentText?: string }) =>
    api.put(`/notes/${diagramId}`, body),

  getVersions: (diagramId: string) => api.get(`/notes/${diagramId}/versions`),

  publish: (diagramId: string) => api.post(`/notes/${diagramId}/publish`),

  unpublish: (diagramId: string) => api.delete(`/notes/${diagramId}/publish`),
}
