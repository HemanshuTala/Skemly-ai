import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import toast from 'react-hot-toast'

import { useAuthStore } from '@/stores/authStore'

export default function AuthCallbackPage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const token = params.get('token')

  const { fetchUser } = useAuthStore()

  useEffect(() => {
    const run = async () => {
      if (!token) {
        toast.error('Missing auth token from OAuth callback')
        navigate('/login', { replace: true })
        return
      }

      localStorage.setItem('accessToken', token)

      try {
        await fetchUser()
        navigate('/dashboard', { replace: true })
      } catch {
        toast.error('Authentication failed')
        navigate('/login', { replace: true })
      }
    }

    void run()
  }, [fetchUser, navigate, token])

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-muted-foreground mt-3">Signing you in...</p>
      </div>
    </div>
  )
}

