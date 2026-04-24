import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import axios from 'axios'
import { authAPI, User } from '@/services/api.service'
import { useWorkspaceStore } from '@/stores/workspaceStore'
import { useDiagramStore } from '@/stores/diagramStore'
import { useProjectStore } from '@/stores/projectStore'
import toast from 'react-hot-toast'

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  fetchUser: () => Promise<void>
  updateProfile: (data: { name?: string; avatar?: string }) => Promise<void>
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (email: string, password: string) => {
        set({ isLoading: true })
        try {
          const { data } = await authAPI.login({ email, password })
          localStorage.setItem('accessToken', data.data.accessToken)
          set({ user: data.data.user, isAuthenticated: true })
          toast.success('Welcome back!')
        } catch (error: any) {
          const message = error.response?.data?.error?.message || error.response?.data?.message || 'Login failed'
          toast.error(message)
          throw error
        } finally {
          set({ isLoading: false })
        }
      },

      register: async (name: string, email: string, password: string) => {
        set({ isLoading: true })
        try {
          // Backend returns { data: { userId } } only — no session; user must log in
          await authAPI.register({ name, email, password })
          toast.success('Account created. You can sign in now (check your email to verify).')
        } catch (error: unknown) {
          let message = 'Registration failed'
          if (axios.isAxiosError(error)) {
            if (!error.response) {
              message =
                'Cannot reach the API. Is the backend running on port 5000?'
            } else {
              const d = error.response.data as { error?: { message?: string }; message?: string }
              message = d?.error?.message || d?.message || message
            }
          }
          toast.error(message)
          throw error
        } finally {
          set({ isLoading: false })
        }
      },

      logout: async () => {
        try {
          await authAPI.logout()
          toast.success('Logged out successfully')
        } catch (error) {
          console.error('Logout error:', error)
        } finally {
          localStorage.removeItem('accessToken')
          set({ user: null, isAuthenticated: false })
          useWorkspaceStore.setState({
            workspaces: [],
            currentWorkspace: null,
            currentWorkspaceId: null,
            members: [],
          })
          useDiagramStore.setState({ diagrams: [], currentDiagram: null })
          useProjectStore.setState({ projects: [], currentProject: null, error: null })
        }
      },

      fetchUser: async () => {
        const token = localStorage.getItem('accessToken')
        if (!token) {
          set({ user: null, isAuthenticated: false, isLoading: false })
          return
        }

        set({ isLoading: true })
        try {
          const { data } = await authAPI.getMe()
          set({ user: data.data, isAuthenticated: true })
        } catch (error) {
          localStorage.removeItem('accessToken')
          set({ user: null, isAuthenticated: false })
        } finally {
          set({ isLoading: false })
        }
      },

      updateProfile: async (updateData: { name?: string; avatar?: string }) => {
        try {
          const { data } = await authAPI.updateProfile(updateData)
          set({ user: data.data })
          toast.success('Profile updated successfully')
        } catch (error: any) {
          const message = error.response?.data?.error?.message || error.response?.data?.message || 'Update failed'
          toast.error(message)
          throw error
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
    }
  )
)
