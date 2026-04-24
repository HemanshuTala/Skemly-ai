import { create } from 'zustand'
import { projectAPI, Project } from '@/services/api.service'
import toast from 'react-hot-toast'

interface ProjectState {
  projects: Project[];
  currentProject: Project | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  loadProjects: (workspaceId: string) => Promise<void>;
  fetchProjects: (workspaceId: string) => Promise<void>;
  createProject: (workspaceId: string, data: { name: string; icon?: string; color?: string }) => Promise<Project>;
  updateProject: (workspaceId: string, projectId: string, data: any) => Promise<void>;
  deleteProject: (workspaceId: string, projectId: string) => Promise<void>;
  setCurrentProject: (project: Project | null) => void;
}

export const useProjectStore = create<ProjectState>((set, get) => ({
  projects: [],
  currentProject: null,
  isLoading: false,
  error: null,

  loadProjects: async (workspaceId: string) => {
    try {
      set({ isLoading: true, error: null })
      const { data } = await projectAPI.list(workspaceId)
      set({ projects: data.data, isLoading: false })
    } catch (error: any) {
      const message = error.response?.data?.error?.message || error.response?.data?.message || 'Failed to load projects'
      set({
        error: message,
        isLoading: false,
      })
      toast.error(message)
    }
  },
  fetchProjects: async (workspaceId: string) => {
    await get().loadProjects(workspaceId)
  },

  createProject: async (workspaceId: string, data: any) => {
    try {
      set({ isLoading: true, error: null })
      const { data: responseData } = await projectAPI.create(workspaceId, data)
      const project = responseData?.data
      set((state) => ({
        projects: [...state.projects, project],
        isLoading: false,
      }))
      toast.success('Project created')
      return project
    } catch (error: any) {
      const message = error.response?.data?.error?.message || error.response?.data?.message || 'Failed to create project'
      set({
        error: message,
        isLoading: false,
      })
      toast.error(message)
      throw error
    }
  },

  updateProject: async (workspaceId: string, projectId: string, data: any) => {
    try {
      set({ isLoading: true, error: null })
      const { data: responseData } = await projectAPI.update(workspaceId, projectId, data)
      const updated = responseData?.data
      set((state) => ({
        projects: state.projects.map((p) => (p.id === projectId ? updated : p)),
        currentProject: state.currentProject?.id === projectId ? updated : state.currentProject,
        isLoading: false,
      }))
      toast.success('Project updated')
    } catch (error: any) {
      const message = error.response?.data?.error?.message || error.response?.data?.message || 'Failed to update project'
      set({
        error: message,
        isLoading: false,
      })
      toast.error(message)
      throw error
    }
  },

  deleteProject: async (workspaceId: string, projectId: string) => {
    try {
      set({ isLoading: true, error: null })
      await projectAPI.delete(workspaceId, projectId)
      set((state) => ({
        projects: state.projects.filter((p) => p.id !== projectId),
        currentProject: state.currentProject?.id === projectId ? null : state.currentProject,
        isLoading: false,
      }))
      toast.success('Project deleted')
    } catch (error: any) {
      const message = error.response?.data?.error?.message || error.response?.data?.message || 'Failed to delete project'
      set({
        error: message,
        isLoading: false,
      })
      toast.error(message)
      throw error
    }
  },

  setCurrentProject: (project: Project | null) => {
    set({ currentProject: project })
  },
}))
