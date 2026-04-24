import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { workspaceAPI, Workspace, WorkspaceMember } from '@/services/api.service'
import toast from 'react-hot-toast'

interface WorkspaceState {
  workspaces: Workspace[]
  currentWorkspace: Workspace | null
  currentWorkspaceId: string | null
  members: WorkspaceMember[]
  isLoading: boolean
  fetchWorkspaces: () => Promise<void>
  setCurrentWorkspace: (workspace: Workspace | null) => void
  createWorkspace: (data: { name: string; type: 'personal' | 'team' }) => Promise<Workspace>
  updateWorkspace: (id: string, data: { name?: string; icon?: string }) => Promise<void>
  deleteWorkspace: (id: string) => Promise<void>
  fetchMembers: (id: string) => Promise<void>
  inviteMember: (id: string, email: string, role: string) => Promise<void>
  removeMember: (id: string, userId: string) => Promise<void>
  updateMemberRole: (id: string, userId: string, role: string) => Promise<void>
}

export const useWorkspaceStore = create<WorkspaceState>()(
  persist(
    (set, get) => ({
      workspaces: [],
      currentWorkspace: null,
      currentWorkspaceId: null,
      members: [],
      isLoading: false,

      fetchWorkspaces: async () => {
        set({ isLoading: true })
        try {
          const { data } = await workspaceAPI.list()
          const workspaces = data.data as Workspace[]
          const preferredId = get().currentWorkspaceId
          const selected =
            (preferredId ? workspaces.find((ws) => ws.id === preferredId) : null) ||
            (get().currentWorkspace ? workspaces.find((ws) => ws.id === get().currentWorkspace?.id) : null) ||
            workspaces[0] ||
            null
          set({
            workspaces,
            currentWorkspace: selected,
            currentWorkspaceId: selected?.id || null,
          })
        } catch (error: any) {
          const message = error.response?.data?.error?.message || error.response?.data?.message || 'Failed to load workspaces'
          toast.error(message)
        } finally {
          set({ isLoading: false })
        }
      },

      setCurrentWorkspace: (workspace) => {
        set({ currentWorkspace: workspace, currentWorkspaceId: workspace?.id || null })
      },

      createWorkspace: async (data) => {
        try {
          const response = await workspaceAPI.create(data)
          const newWorkspace = response.data.data
          set((state) => ({ workspaces: [...state.workspaces, newWorkspace] }))
          toast.success('Workspace created successfully')
          return newWorkspace
        } catch (error: any) {
          const message = error.response?.data?.error?.message || error.response?.data?.message || 'Failed to create workspace'
          toast.error(message)
          throw error
        }
      },

      updateWorkspace: async (id, data) => {
        try {
          await workspaceAPI.update(id, data)
          set((state) => ({
            workspaces: state.workspaces.map((w) => (w.id === id ? { ...w, ...data } : w)),
            currentWorkspace: state.currentWorkspace?.id === id ? { ...state.currentWorkspace, ...data } : state.currentWorkspace,
          }))
          toast.success('Workspace updated')
        } catch (error: any) {
          const message = error.response?.data?.error?.message || error.response?.data?.message || 'Failed to update workspace'
          toast.error(message)
          throw error
        }
      },

      deleteWorkspace: async (id) => {
        try {
          await workspaceAPI.delete(id)
          set((state) => {
            const remaining = state.workspaces.filter((w) => w.id !== id)
            const nextCurrent =
              state.currentWorkspace?.id === id
                ? remaining[0] || null
                : state.currentWorkspace
            return {
              workspaces: remaining,
              currentWorkspace: nextCurrent,
              currentWorkspaceId: nextCurrent?.id || null,
            }
          })
          toast.success('Workspace deleted')
        } catch (error: any) {
          const message = error.response?.data?.error?.message || error.response?.data?.message || 'Failed to delete workspace'
          toast.error(message)
          throw error
        }
      },

      fetchMembers: async (id) => {
        try {
          const { data } = await workspaceAPI.getMembers(id)
          set({ members: data.data })
        } catch (error: any) {
          const message = error.response?.data?.error?.message || error.response?.data?.message || 'Failed to load members'
          toast.error(message)
        }
      },

      inviteMember: async (id, email, role) => {
        try {
          await workspaceAPI.invite(id, { email, role })
          get().fetchMembers(id)
        } catch (error: any) {
          throw error
        }
      },

      removeMember: async (id, userId) => {
        try {
          await workspaceAPI.removeMember(id, userId)
          set((state) => ({
            members: state.members.filter((m) => m.userId !== userId),
          }))
          toast.success('Member removed')
        } catch (error: any) {
          const message = error.response?.data?.error?.message || error.response?.data?.message || 'Failed to remove member'
          toast.error(message)
          throw error
        }
      },

      updateMemberRole: async (id, userId, role) => {
        try {
          await workspaceAPI.updateMemberRole(id, userId, role)
          set((state) => ({
            members: state.members.map((m) => (m.userId === userId ? { ...m, role: role as any } : m)),
          }))
          toast.success('Role updated')
        } catch (error: any) {
          const message = error.response?.data?.error?.message || error.response?.data?.message || 'Failed to update role'
          toast.error(message)
          throw error
        }
      },
    }),
    {
      name: 'workspace-storage',
      partialize: (state) => ({ currentWorkspaceId: state.currentWorkspaceId }),
    }
  )
)
