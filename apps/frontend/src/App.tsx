import { useEffect } from 'react'
import { Analytics } from "@vercel/analytics/react"
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import { AnimatePresence, motion } from 'framer-motion'
import { useAuthStore } from './stores/authStore'
import { ErrorBoundary } from './components/ErrorBoundary'
import Lenis from 'lenis'

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

// Initialize Lenis for smooth scrolling - DISABLED FOR TESTING
// const lenis = new Lenis({
//   duration: 1.2,
// })

// function raf(time: number) {
//   lenis.raf(time)
//   requestAnimationFrame(raf)
// }
// requestAnimationFrame(raf)

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore()
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore()
  return !isAuthenticated ? <>{children}</> : <Navigate to="/dashboard" replace />
}

function AnimatedRoutes() {
  const location = useLocation()
  
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, scale: 0.99, filter: 'blur(10px)' }}
        animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
        exit={{ opacity: 0, scale: 1.01, filter: 'blur(10px)' }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      >
        <Routes location={location}>
          {/* Debug Route */}
          <Route path="/debug" element={<DebugPage />} />
          
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/docs" element={<DocsPage />} />
          <Route path="/api-docs" element={<ApiDocsPage />} />
          <Route path="/payment/success" element={<PaymentSuccessPage />} />
          <Route path="/public/:token" element={<PublicDiagramPage />} />
          
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
          </Route>

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

          {/* Catch all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </motion.div>
    </AnimatePresence>
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
        <MobileViewRestriction />
        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 2500,
            style: {
              background: '#18181b',
              color: '#ffffff',
              border: '1px solid #27272a',
              borderRadius: '9px',
              fontSize: '12px',
              fontWeight: '500',
              boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
            },
          }}
        />
        <BrowserRouter>
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
