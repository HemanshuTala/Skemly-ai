import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Lock, Eye, EyeOff, CheckCircle, Loader2, ArrowLeft } from 'lucide-react'
import { authService } from '@/services/auth.service'
import toast from 'react-hot-toast'

const T = {
  bg: '#080808',
  surface: '#111111',
  surfaceHi: '#161616',
  border: '#1f1f1f',
  text: '#f2f0eb',
  textSub: '#8a8680',
  textMuted: '#3d3d3b',
  accent: '#c9b89a',
  font: "'DM Sans', -apple-system, sans-serif",
}

const SP_SOFT = { type: 'spring', stiffness: 100, damping: 20 }

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const token = searchParams.get('token')

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [reset, setReset] = useState(false)

  useEffect(() => {
    if (!token) {
      toast.error('Invalid or expired reset link')
    }
  }, [token])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!token) {
      toast.error('Invalid reset token')
      return
    }

    if (password.length < 8) {
      toast.error('Password must be at least 8 characters')
      return
    }

    if (password !== confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    setLoading(true)
    try {
      await authService.resetPassword(token, password)
      setReset(true)
      toast.success('Password reset successfully!')
      setTimeout(() => navigate('/login'), 2000)
    } catch (error: any) {
      const message = error?.response?.data?.error?.message || 'Failed to reset password'
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: T.bg, color: T.text, fontFamily: T.font, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={SP_SOFT} style={{ width: '100%', maxWidth: 400 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <motion.div whileHover={{ scale: 1.02 }} style={{ display: 'inline-flex', alignItems: 'center', gap: 10, cursor: 'pointer' }} onClick={() => window.location.href = '/'}>
            <div style={{ width: 36, height: 36, borderRadius: 8, background: T.surface, border: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: 18, color: T.accent, fontWeight: 700 }}>S</span>
            </div>
            <span style={{ fontSize: 20, fontWeight: 700, color: T.text }}>Skemly</span>
          </motion.div>
        </div>

        {/* Card */}
        <div style={{ background: T.surface, borderRadius: 16, border: `1px solid ${T.border}`, padding: 32 }}>
          {!reset ? (
            <>
              <h1 style={{ fontSize: 24, fontWeight: 600, marginBottom: 8, textAlign: 'center' }}>Reset Password</h1>
              <p style={{ fontSize: 14, color: T.textSub, textAlign: 'center', marginBottom: 24 }}>
                Enter your new password below.
              </p>

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6, color: T.textSub }}>New Password</label>
                  <div style={{ position: 'relative' }}>
                    <Lock size={16} color={T.textMuted} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter new password"
                      style={{
                        width: '100%',
                        padding: '12px 40px 12px 40px',
                        background: T.bg,
                        border: `1px solid ${T.border}`,
                        borderRadius: 8,
                        color: T.text,
                        fontSize: 14,
                        fontFamily: T.font,
                        outline: 'none',
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{
                        position: 'absolute',
                        right: 12,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: 0,
                      }}
                    >
                      {showPassword ? <EyeOff size={16} color={T.textMuted} /> : <Eye size={16} color={T.textMuted} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6, color: T.textSub }}>Confirm Password</label>
                  <div style={{ position: 'relative' }}>
                    <Lock size={16} color={T.textMuted} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm new password"
                      style={{
                        width: '100%',
                        padding: '12px 12px 12px 40px',
                        background: T.bg,
                        border: `1px solid ${T.border}`,
                        borderRadius: 8,
                        color: T.text,
                        fontSize: 14,
                        fontFamily: T.font,
                        outline: 'none',
                      }}
                    />
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={loading || !token}
                  style={{
                    padding: '12px 24px',
                    background: T.text,
                    color: T.bg,
                    border: 'none',
                    borderRadius: 8,
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: loading || !token ? 'not-allowed' : 'pointer',
                    opacity: loading || !token ? 0.7 : 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    marginTop: 8,
                  }}
                >
                  {loading ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Resetting...</> : 'Reset Password'}
                </motion.button>
              </form>
            </>
          ) : (
            <div style={{ textAlign: 'center' }}>
              <CheckCircle size={48} color={T.accent} style={{ margin: '0 auto 16px' }} />
              <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 8 }}>Password Reset!</h2>
              <p style={{ fontSize: 14, color: T.textSub, marginBottom: 16 }}>
                Your password has been reset successfully.
              </p>
              <p style={{ fontSize: 13, color: T.textMuted }}>Redirecting to login...</p>
            </div>
          )}

          <div style={{ marginTop: 24, paddingTop: 24, borderTop: `1px solid ${T.border}`, textAlign: 'center' }}>
            <a href="/login" style={{ fontSize: 14, color: T.textSub, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <ArrowLeft size={14} /> Back to login
            </a>
          </div>
        </div>
      </motion.div>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
