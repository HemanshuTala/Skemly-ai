import React from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

interface Props {
  children: React.ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#09090b] flex items-center justify-center p-4">
          <div className="bg-[#0d0d10] border border-white/[0.08] rounded-2xl p-10 max-w-md w-full text-center shadow-2xl">
            {/* Icon */}
            <div className="w-14 h-14 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="w-7 h-7 text-red-400" />
            </div>

            {/* Heading */}
            <h1 className="text-white text-xl font-bold mb-2 tracking-tight">
              Something went wrong
            </h1>

            {/* Message */}
            <p className="text-[#71717a] text-sm leading-relaxed mb-8">
              {this.state.error?.message || 'An unexpected error occurred. Please reload the page to continue.'}
            </p>

            {/* Actions */}
            <div className="flex flex-col gap-3">
              <button
                onClick={() => window.location.reload()}
                className="w-full flex items-center justify-center gap-2 h-10 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-sm font-semibold shadow-lg shadow-violet-600/20 transition-all hover:-translate-y-0.5 active:scale-[0.97]"
              >
                <RefreshCw className="w-4 h-4" />
                Reload Page
              </button>
              <button
                onClick={() => window.location.href = '/dashboard'}
                className="w-full h-10 rounded-xl bg-white/[0.04] border border-white/[0.08] text-[#a1a1aa] text-sm font-medium hover:bg-white/[0.08] hover:text-white transition-all"
              >
                Go to Dashboard
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
