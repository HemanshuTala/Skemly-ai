import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuthStore } from '@/stores/authStore'
import { Mail, Lock, Sparkles, AlertCircle, ArrowRight, Eye, EyeOff } from 'lucide-react'
import { ThreeBackground } from '@/components/ui/ThreeBackground'
import skemlyLogo from '@/assets/Skemly.png'

const BG   = '#09090b'
const APP  = '#18181b'
const SURF = '#27272a'
const RAIS = '#3f3f46'
const STR  = '#52525b'
const TXT1 = '#ffffff'
const TXT2 = '#a1a1aa'
const TXT3 = '#71717a'

export default function LoginPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { login } = useAuthStore()
  const redirect = searchParams.get('redirect') || '/dashboard'
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [showPw,   setShowPw]   = useState(false)
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)

  const apiBase = import.meta.env.VITE_API_URL || 'http://ec2-13-60-224-91.eu-north-1.compute.amazonaws.com:5000/api/v1'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password)
      navigate(redirect)
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Invalid email or password.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{ background: BG }}
    >
      <ThreeBackground />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-[420px] relative z-10"
      >
        {/* Logo */}
        <div className="text-center mb-8 w-full px-2">
          <Link to="/" className="inline-flex flex-col items-center justify-center gap-4 mb-6 group">
            <img
              src={skemlyLogo}
              alt="Skemly"
              className="w-12 h-12 object-contain group-hover:scale-105 transition-transform duration-200"
            />
            <span className="font-display text-2xl font-bold tracking-tight text-white">
              Skemly
            </span>
          </Link>
          <h1 className="font-display font-bold mb-1.5 text-white text-[1.75rem] tracking-tight">
            Welcome back
          </h1>
          <p className="text-[#71717a] text-sm">Sign in to your account to continue</p>
        </div>

        {/* Card */}
        <div
          className="rounded-2xl overflow-hidden"
          style={{ background: APP, border: `1px solid ${SURF}` }}
        >
          <div className="p-7">
            <form onSubmit={handleSubmit} className="space-y-5">

              {/* Error */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-start gap-2.5 rounded-lg p-3"
                  style={{ background: 'rgba(248, 113, 113, 0.08)', border: '1px solid rgba(248, 113, 113, 0.25)' }}
                >
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: '#f87171' }} />
                  <span className="text-xs leading-relaxed" style={{ color: '#f87171' }}>{error}</span>
                </motion.div>
              )}

              {/* Email */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-semibold" style={{ color: STR, letterSpacing: '0.07em', textTransform: 'uppercase' }}>
                  Email address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: STR }} />
                  <input
                    type="email"
                    placeholder="you@company.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    className="w-full outline-none transition-all duration-150 font-medium"
                    style={{
                      background: SURF,
                      border: `1px solid ${RAIS}`,
                      borderRadius: '8px',
                      padding: '10px 12px 10px 40px',
                      fontSize: '0.875rem',
                      color: TXT1,
                    }}
                    onFocus={e => { e.target.style.borderColor = STR; e.target.style.boxShadow = `0 0 0 3px rgba(82,82,91,0.2)` }}
                    onBlur={e  => { e.target.style.borderColor = RAIS; e.target.style.boxShadow = 'none' }}
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-[11px] font-semibold" style={{ color: STR, letterSpacing: '0.07em', textTransform: 'uppercase' }}>
                    Password
                  </label>
                  <Link
                    to="/forgot-password"
                    className="text-[11px] font-medium transition-colors duration-150"
                    style={{ color: STR }}
                    onMouseEnter={e => (e.currentTarget.style.color = TXT2)}
                    onMouseLeave={e => (e.currentTarget.style.color = STR)}
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: STR }} />
                  <input
                    type={showPw ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    className="w-full outline-none transition-all duration-150 font-medium"
                    style={{
                      background: SURF,
                      border: `1px solid ${RAIS}`,
                      borderRadius: '8px',
                      padding: '10px 40px 10px 40px',
                      fontSize: '0.875rem',
                      color: TXT1,
                    }}
                    onFocus={e => { e.target.style.borderColor = STR; e.target.style.boxShadow = `0 0 0 3px rgba(82,82,91,0.2)` }}
                    onBlur={e  => { e.target.style.borderColor = RAIS; e.target.style.boxShadow = 'none' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(v => !v)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2"
                    style={{ color: STR }}
                  >
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl font-medium transition-all duration-150 disabled:opacity-60"
                style={{
                  background: TXT1,
                  color: APP,
                  padding: '11px',
                  fontSize: '0.875rem',
                }}
                onMouseEnter={e => { if (!loading) (e.currentTarget as HTMLButtonElement).style.opacity = '0.92' }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '1' }}
              >
                {loading ? (
                  <span className="inline-flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-black/20 border-t-black/70 rounded-full animate-spin" />
                    Signing in…
                  </span>
                ) : (
                  <span className="inline-flex items-center justify-center gap-2">
                    Sign in
                    <ArrowRight className="w-4 h-4" />
                  </span>
                )}
              </button>
            </form>

          </div>
        </div>

        {/* Footer link */}
        <p className="text-center mt-5 text-sm" style={{ color: STR }}>
          Don't have an account?{' '}
          <Link
            to="/register"
            className="font-medium transition-colors duration-150"
            style={{ color: TXT2 }}
            onMouseEnter={e => (e.currentTarget.style.color = TXT1)}
            onMouseLeave={e => (e.currentTarget.style.color = TXT2)}
          >
            Sign up free
          </Link>
        </p>
      </motion.div>
    </div>
  )
}
