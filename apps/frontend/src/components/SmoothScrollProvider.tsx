import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import Lenis from 'lenis'

const LenisContext = createContext<Lenis | null>(null)

/** Lenis instance when smooth scroll is active (null on diagram routes or before init). */
export function useLenis() {
  return useContext(LenisContext)
}

/**
 * Smooth scrolling via Lenis. Disabled on diagram editor routes so canvas pan/zoom stays natural.
 * Exposes the Lenis instance for programmatic scroll (e.g. landing in-page nav).
 */
export function SmoothScrollProvider({ children }: { children: ReactNode }) {
  const { pathname } = useLocation()
  const disabled = pathname.startsWith('/diagram/') || pathname.startsWith('/dashboard')
  const [lenis, setLenis] = useState<Lenis | null>(null)

  useEffect(() => {
    if (disabled) {
      setLenis(null)
      return
    }

    const instance = new Lenis({
      duration: 1.05,
      smoothWheel: true,
      wheelMultiplier: 0.85,
      touchMultiplier: 1.2,
    })

    setLenis(instance)

    let rafId = 0
    const raf = (time: number) => {
      instance.raf(time)
      rafId = requestAnimationFrame(raf)
    }
    rafId = requestAnimationFrame(raf)

    return () => {
      cancelAnimationFrame(rafId)
      instance.destroy()
      setLenis(null)
    }
  }, [disabled])

  return <LenisContext.Provider value={lenis}>{children}</LenisContext.Provider>
}
