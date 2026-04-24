import { Outlet } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import { easeOutExpo } from '@/lib/motion-presets'

export default function AuthLayout() {
  const reduceMotion = useReducedMotion()

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ background: '#09090b' }}>
      <motion.div
        initial={reduceMotion ? false : { opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: easeOutExpo }}
        className="relative z-10 min-h-screen"
      >
        <Outlet />
      </motion.div>
    </div>
  )
}
