import { useEffect } from 'react'
import { Analytics } from "@vercel/analytics/react"
import { BrowserRouter, Routes, Route, Navigate, useLocation, Link } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import { AnimatePresence, motion } from 'framer-motion'
import { useAuthStore } from './stores/authStore'
import { ErrorBoundary } from './components/ErrorBoundary'

// Pages
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage'
import ResetPasswordPage from './pages/auth/ResetPasswordPage'
import DashboardPage from './pages/dashboard/DashboardPage'
import DiagramEditorPage from './pages/editor/DiagramEditorPage'
import DiagramNewPage from './pages/editor/DiagramNewPage'
import ProjectsPage from './pages/projects/ProjectsPage'
import ApiDocsPage from './pages/ApiDocsPage'
import DocsPage from './pages/DocsPage'
import DebugPage from './pages/DebugPage'
import PublicDiagramPage from './pages/PublicDiagramPage'
import SettingsPage from './pages/settings/SettingsPage'
import PaymentSuccessPage from './pages/billing/PaymentSuccessPage'
import AuthCallbackPage from './pages/auth/AuthCallbackPage'
import TemplatesPage from './pages/templates/TemplatesPage'
import WorkspacePage from './pages/workspace/WorkspacePage'
import WorkspaceSettingsPage from './pages/workspace/WorkspaceSettingsPage'
import InviteAcceptPage from './pages/workspace/InviteAcceptPage'

// Layouts
import AuthLayout from './layouts/AuthLayout'
import DashboardLayout from './layouts/DashboardLayout'
import { SmoothScrollProvider } from './components/SmoothScrollProvider'
import { MobileViewRestriction } from './components/ui/MobileViewRestriction'
import './index.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
})

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore()
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore()
  return !isAuthenticated ? <>{children}</> : <Navigate to="/dashboard" replace />
}

function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#09090b] p-4">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="text-center"
      >
        <div className="text-[80px] font-black text-white/[0.04] tracking-tight leading-none select-none mb-6">
          404
        </div>
        <h1 className="text-[22px] font-bold text-white tracking-[-0.02em] mb-2">Page not found</h1>
        <p className="text-[14px] text-[#52525b] mb-8 max-w-[280px] mx-auto">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-white text-[#09090b] text-[13px] font-bold hover:bg-[#e4e4e7] transition-colors"
        >
          Back to Dashboard
        </Link>
      </motion.div>
    </div>
  )
}

function AnimatedRoutes() {
  const location = useLocation()
  
  return (
    <Routes location={location}>
          {/* Debug Route */}
          <Route path="/debug" element={<DebugPage />} />
          
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/docs" element={<DocsPage />} />
          <Route path="/api-docs" element={<ApiDocsPage />} />
          <Route path="/payment/success" element={<PaymentSuccessPage />} />
          <Route path="/public/:token" element={<PublicDiagramPage />} />
          <Route path="/auth/callback" element={<AuthCallbackPage />} />
          
          {/* Auth Routes */}
          <Route element={<AuthLayout />}>
            <Route
              path="/login"
              element={
                <PublicRoute>
                  <LoginPage />
                </PublicRoute>
              }
            />
            <Route
              path="/register"
              element={
                <PublicRoute>
                  <RegisterPage />
                </PublicRoute>
              }
            />
            <Route
              path="/forgot-password"
              element={
                <PublicRoute>
                  <ForgotPasswordPage />
                </PublicRoute>
              }
            />
            <Route
              path="/reset-password"
              element={
                <PublicRoute>
                  <ResetPasswordPage />
                </PublicRoute>
              }
            />
          </Route>

          {/* Protected Routes */}
          <Route
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/projects" element={<ProjectsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/templates" element={<TemplatesPage />} />
            <Route path="/workspace" element={<WorkspacePage />} />
            <Route path="/workspace/settings" element={<WorkspaceSettingsPage />} />
          </Route>

          <Route
            path="/invite"
            element={
              <ProtectedRoute>
                <InviteAcceptPage />
              </ProtectedRoute>
            }
          />

          {/* Protected editor routes (full-screen, no dashboard sidebar) */}
          <Route
            path="/diagram/:diagramId"
            element={
              <ProtectedRoute>
                <DiagramEditorPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/diagram/new"
            element={
              <ProtectedRoute>
                <DiagramNewPage />
              </ProtectedRoute>
            }
          />

          {/* 404 */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
  )
}

function App() {
  const { fetchUser } = useAuthStore()

  useEffect(() => {
    localStorage.setItem('theme', 'dark')
    document.documentElement.classList.add('dark')
    document.body.classList.add('dark')
  }, [])

  useEffect(() => {
    // Validate / refresh session whenever the app loads (token in localStorage)
    void fetchUser()
  }, [fetchUser])

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 2500,
            style: {
              background: '#0d0d10',
              color: '#ffffff',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '10px',
              fontSize: '12px',
              fontWeight: '500',
              boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
            },
          }}
        />
        <BrowserRouter>
          <MobileViewRestriction />
          <SmoothScrollProvider>
            <AnimatedRoutes />
          </SmoothScrollProvider>
        </BrowserRouter>



        <Analytics />
      </QueryClientProvider>
    </ErrorBoundary>
  )
}

export default App
