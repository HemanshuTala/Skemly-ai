import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { motion } from 'framer-motion'
import { useAuthStore } from '@/stores/authStore'
import { Mail, Lock, User, AlertCircle, ArrowRight, Eye, EyeOff } from 'lucide-react'
import skemlyLogo from '@/assets/Skemly.png'
import { cn } from '@/lib/utils'

export default function RegisterPage() {
  const navigate = useNavigate()
  const { register } = useAuthStore()
  const [name,     setName]     = useState('')
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [showPw,   setShowPw]   = useState(false)
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)

  const pwStrength = password.length >= 8 ? 'strong' : password.length >= 6 ? 'medium' : password.length > 0 ? 'weak' : null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await register(name, email, password)
      navigate('/login', { replace: true })
    } catch (err: unknown) {
      let message = 'Registration failed. Please try again.'
      if (axios.isAxiosError(err)) {
        message = err.response?.data?.error?.message || err.response?.data?.message || 'Request failed'
      }
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#09090b] relative overflow-hidden">
      {/* Ambient glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/2 h-[400px] w-[600px] -translate-x-1/2 rounded-full bg-violet-500/[0.08] blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-[400px] relative z-10"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex flex-col items-center gap-3 mb-5 group">
            <img
              src={skemlyLogo}
              alt="Schemely AI"
              className="w-10 h-10 object-contain group-hover:scale-105 transition-transform duration-200"
            />
            <span className="text-[15px] font-semibold text-white tracking-[-0.01em]">Schemely AI</span>
          </Link>
          <h1 className="font-display mb-1.5 text-2xl font-semibold tracking-tight text-white">Create your account</h1>
          <p className="text-sm text-zinc-400">Start designing smarter with AI assistance.</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-white/[0.09] bg-[#101014]/95 p-6 shadow-2xl shadow-black/50 sm:p-7">
          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Error */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-start gap-2.5 rounded-lg p-3 bg-[#f87171]/[0.07] border border-[#f87171]/20"
              >
                <AlertCircle className="w-4 h-4 text-[#f87171] shrink-0 mt-px" />
                <span className="text-[12px] text-[#f87171] leading-relaxed">{error}</span>
              </motion.div>
            )}

            {/* Name */}
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-zinc-300">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input
                  type="text"
                  placeholder="Your full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  autoComplete="name"
                  className="w-full pl-10 pr-3 py-2.5 rounded-lg border border-white/[0.07] bg-white/[0.03] text-[13px] text-white placeholder:text-[#3f3f46] outline-none focus:border-white/[0.20] focus:bg-white/[0.05] transition-all font-[inherit]"
                />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-zinc-300">
                Email address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input
                  type="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  className="w-full pl-10 pr-3 py-2.5 rounded-lg border border-white/[0.07] bg-white/[0.03] text-[13px] text-white placeholder:text-[#3f3f46] outline-none focus:border-white/[0.20] focus:bg-white/[0.05] transition-all font-[inherit]"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-zinc-300">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input
                  type={showPw ? 'text' : 'password'}
                  placeholder="At least 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                  minLength={6}
                  className="w-full pl-10 pr-10 py-2.5 rounded-lg border border-white/[0.07] bg-white/[0.03] text-[13px] text-white placeholder:text-[#3f3f46] outline-none focus:border-white/[0.20] focus:bg-white/[0.05] transition-all font-[inherit]"
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-zinc-500 transition-colors hover:text-zinc-200"
                  aria-label={showPw ? 'Hide password' : 'Show password'}
                >
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Password strength bar */}
              {pwStrength && (
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex gap-1 flex-1">
                    {['weak', 'medium', 'strong'].map((level) => (
                      <div
                        key={level}
                        className={cn(
                          'h-1 flex-1 rounded-full transition-all duration-300',
                          pwStrength === 'strong' ? 'bg-[#4ade80]' :
                          pwStrength === 'medium' && level !== 'strong' ? 'bg-[#fbbf24]' :
                          pwStrength === 'weak' && level === 'weak' ? 'bg-[#f87171]' :
                          'bg-white/[0.06]'
                        )}
                      />
                    ))}
                  </div>
                  <span className={cn(
                    'text-[10px] font-semibold uppercase tracking-wider',
                    pwStrength === 'strong' ? 'text-[#4ade80]' :
                    pwStrength === 'medium' ? 'text-[#fbbf24]' : 'text-[#f87171]'
                  )}>
                    {pwStrength}
                  </span>
                </div>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="mt-2 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-950/40 transition-all hover:-translate-y-0.5 hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-[#09090b]/20 border-t-[#09090b]/70 rounded-full animate-spin" />
                  Creating account…
                </>
              ) : (
                <>
                  Create account
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <p className="text-center text-xs leading-relaxed text-zinc-400">
              By creating an account you agree to our{' '}
              <span className="text-zinc-300">Terms of Service</span> and{' '}
              <span className="text-zinc-300">Privacy Policy</span>
            </p>
          </form>
        </div>

        {/* Footer */}
        <p className="mt-5 text-center text-sm text-zinc-400">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-violet-300 transition-colors hover:text-violet-200">
            Sign in
          </Link>
        </p>
      </motion.div>
    </div>
  )
}
