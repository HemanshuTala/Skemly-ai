import { create } from 'zustand'
import { diagramAPI, Diagram } from '@/services/api.service'
import toast from 'react-hot-toast'

interface DiagramState {
  diagrams: Diagram[]
  currentDiagram: Diagram | null
  isLoading: boolean
  fetchDiagrams: (params?: { workspaceId?: string; projectId?: string; starred?: boolean; trashed?: boolean }) => Promise<void>
  createDiagram: (data: { title: string; type: string; workspaceId: string; projectId?: string }) => Promise<Diagram>
  getDiagram: (id: string) => Promise<void>
  loadDiagram: (id: string) => Promise<void>
  updateDiagram: (id: string, data: { title?: string; syntax?: string; nodes?: any[]; edges?: any[] }) => Promise<void>
  deleteDiagram: (id: string) => Promise<void>
  duplicateDiagram: (id: string) => Promise<void>
  starDiagram: (id: string) => Promise<void>
  unstarDiagram: (id: string) => Promise<void>
  trashDiagram: (id: string) => Promise<void>
  restoreDiagram: (id: string) => Promise<void>
  setCurrentDiagram: (diagram: Diagram | null) => void
}

export const useDiagramStore = create<DiagramState>((set, get) => ({
  diagrams: [],
  currentDiagram: null,
  isLoading: false,

  fetchDiagrams: async (params) => {
    if (!params?.workspaceId) {
      set({ diagrams: [], isLoading: false })
      return
    }
    set({ isLoading: true })
    try {
      const { data } = await diagramAPI.list(params)
      set({ diagrams: data.data })
    } catch (error: any) {
      const message = error.response?.data?.error?.message || error.response?.data?.message || 'Failed to load diagrams'
      toast.error(message)
    } finally {
      set({ isLoading: false })
    }
  },

  createDiagram: async (data) => {
    try {
      const response = await diagramAPI.create(data)
      const newDiagram = response.data.data
      set((state) => ({ diagrams: [newDiagram, ...state.diagrams] }))
      toast.success('Diagram created')
      return newDiagram
    } catch (error: any) {
      const message = error.response?.data?.error?.message || error.response?.data?.message || 'Failed to create diagram'
      toast.error(message)
      throw error
    }
  },

  getDiagram: async (id) => {
    set({ isLoading: true })
    try {
      const { data } = await diagramAPI.get(id)
      set({ currentDiagram: data.data })
    } catch (error: any) {
      const message = error.response?.data?.error?.message || error.response?.data?.message || 'Failed to load diagram'
      toast.error(message)
    } finally {
      set({ isLoading: false })
    }
  },
  loadDiagram: async (id) => {
    await get().getDiagram(id)
  },

  updateDiagram: async (id, data) => {
    try {
      await diagramAPI.update(id, data)
      set((state) => ({
        diagrams: state.diagrams.map((d) => (d.id === id ? { ...d, ...data } : d)),
        currentDiagram: state.currentDiagram?.id === id ? { ...state.currentDiagram, ...data } : state.currentDiagram,
      }))
    } catch (error: any) {
      const message = error.response?.data?.error?.message || error.response?.data?.message || 'Failed to update diagram'
      toast.error(message)
      throw error
    }
  },

  deleteDiagram: async (id) => {
    try {
      await diagramAPI.delete(id)
      set((state) => ({
        diagrams: state.diagrams.filter((d) => d.id !== id),
        currentDiagram: state.currentDiagram?.id === id ? null : state.currentDiagram,
      }))
      toast.success('Diagram deleted')
    } catch (error: any) {
      const message = error.response?.data?.error?.message || error.response?.data?.message || 'Failed to delete diagram'
      toast.error(message)
      throw error
    }
  },

  duplicateDiagram: async (id) => {
    try {
      const response = await diagramAPI.duplicate(id)
      const duplicated = response.data.data
      set((state) => ({ diagrams: [duplicated, ...state.diagrams] }))
      toast.success('Diagram duplicated')
    } catch (error: any) {
      const message = error.response?.data?.error?.message || error.response?.data?.message || 'Failed to duplicate diagram'
      toast.error(message)
      throw error
    }
  },

  starDiagram: async (id) => {
    try {
      await diagramAPI.star(id)
      set((state) => ({
        diagrams: state.diagrams.map((d) => (d.id === id ? { ...d, starred: true } : d)),
        currentDiagram: state.currentDiagram?.id === id ? { ...state.currentDiagram, starred: true } : state.currentDiagram,
      }))
      toast.success('Added to favorites')
    } catch (error: any) {
      const message = error.response?.data?.error?.message || error.response?.data?.message || 'Failed to star diagram'
      toast.error(message)
      throw error
    }
  },

  unstarDiagram: async (id) => {
    try {
      await diagramAPI.unstar(id)
      set((state) => ({
        diagrams: state.diagrams.map((d) => (d.id === id ? { ...d, starred: false } : d)),
        currentDiagram: state.currentDiagram?.id === id ? { ...state.currentDiagram, starred: false } : state.currentDiagram,
      }))
      toast.success('Removed from favorites')
    } catch (error: any) {
      const message = error.response?.data?.error?.message || error.response?.data?.message || 'Failed to unstar diagram'
      toast.error(message)
      throw error
    }
  },

  trashDiagram: async (id) => {
    try {
      await diagramAPI.trash(id)
      set((state) => ({
        diagrams: state.diagrams.map((d) => (d.id === id ? { ...d, trashed: true } : d)),
      }))
      toast.success('Moved to trash')
    } catch (error: any) {
      const message = error.response?.data?.error?.message || error.response?.data?.message || 'Failed to trash diagram'
      toast.error(message)
      throw error
    }
  },

  restoreDiagram: async (id) => {
    try {
      await diagramAPI.restore(id)
      set((state) => ({
        diagrams: state.diagrams.map((d) => (d.id === id ? { ...d, trashed: false } : d)),
      }))
      toast.success('Diagram restored')
    } catch (error: any) {
      const message = error.response?.data?.error?.message || error.response?.data?.message || 'Failed to restore diagram'
      toast.error(message)
      throw error
    }
  },

  setCurrentDiagram: (diagram) => {
    set({ currentDiagram: diagram })
  },
}))
