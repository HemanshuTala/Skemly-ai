import { useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, Mail, Loader2, CheckCircle } from 'lucide-react'
import { authService } from '@/services/auth.service'
import toast from 'react-hot-toast'
import SkemlyLogo from '../../assets/Skemly.png'

const T = {
  bg: '#09090b',
  surface: '#101014',
  surfaceHi: '#18181b',
  border: 'rgba(255,255,255,0.09)',
  text: '#ffffff',
  textSub: '#a1a1aa',
  textMuted: '#71717a',
  accent: '#a78bfa',
  font: '"Inter", -apple-system, sans-serif',
  fontSerif: '"Outfit", "Inter", sans-serif',
}

const SP_SOFT = { type: 'spring', stiffness: 100, damping: 20 }

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) {
      toast.error('Please enter your email')
      return
    }

    setLoading(true)
    try {
      await authService.forgotPassword(email)
      setSent(true)
      toast.success('Password reset link sent to your email!')
    } catch (error: any) {
      const message = error?.response?.data?.error?.message || 'Failed to send reset link'
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: `radial-gradient(ellipse at 50% 15%, rgba(124,58,237,0.12), transparent 36rem), ${T.bg}`, color: T.text, fontFamily: T.font, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={SP_SOFT} style={{ width: '100%', maxWidth: 400 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <motion.div whileHover={{ scale: 1.02 }} style={{ display: 'inline-flex', alignItems: 'center', gap: 12, cursor: 'pointer' }} onClick={() => window.location.href = '/'}>
            <img src={SkemlyLogo} alt="Schemely AI" style={{ width: 40, height: 40, borderRadius: 8, objectFit: 'cover' }} />
            <span style={{ fontSize: 22, fontWeight: 700, color: T.text }}>Schemely AI</span>
          </motion.div>
        </div>

        {/* Card */}
        <div style={{ background: T.surface, borderRadius: 20, border: `1px solid ${T.border}`, padding: 32, boxShadow: '0 24px 80px rgba(0,0,0,0.35)' }}>
          {!sent ? (
            <>
              <h1 style={{ fontSize: 24, fontWeight: 600, marginBottom: 8, textAlign: 'center' }}>Forgot Password?</h1>
              <p style={{ fontSize: 14, color: T.textSub, textAlign: 'center', marginBottom: 24 }}>
                Enter your email and we'll send you a link to reset your password.
              </p>

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6, color: T.textSub }}>Email</label>
                  <div style={{ position: 'relative' }}>
                    <Mail size={16} color={T.textMuted} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
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
                  disabled={loading}
                  style={{
                    padding: '12px 24px',
                    background: '#7c3aed',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: 8,
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: loading ? 'not-allowed' : 'pointer',
                    opacity: loading ? 0.7 : 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                  }}
                >
                  {loading ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Sending...</> : 'Send Reset Link'}
                </motion.button>
              </form>
            </>
          ) : (
            <div style={{ textAlign: 'center' }}>
              <CheckCircle size={48} color={T.accent} style={{ margin: '0 auto 16px' }} />
              <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 8 }}>Check Your Email</h2>
              <p style={{ fontSize: 14, color: T.textSub, marginBottom: 24 }}>
                We've sent a password reset link to <strong style={{ color: T.text }}>{email}</strong>
              </p>
              <motion.button
                whileHover={{ scale: 1.02 }}
                onClick={() => setSent(false)}
                style={{
                  padding: '10px 20px',
                  background: 'rgba(124,58,237,0.12)',
                  color: '#c4b5fd',
                  border: `1px solid ${T.border}`,
                  borderRadius: 10,
                  fontSize: 13,
                  cursor: 'pointer',
                }}
              >
                Send to different email
              </motion.button>
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
