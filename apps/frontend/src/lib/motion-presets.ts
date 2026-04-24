import type { Transition } from 'framer-motion'

export const springSnappy: Transition = {
  type: 'spring',
  stiffness: 420,
  damping: 34,
  mass: 0.85,
}

export const springSoft: Transition = {
  type: 'spring',
  stiffness: 280,
  damping: 28,
}

export const easeOutExpo: [number, number, number, number] = [0.22, 1, 0.36, 1]
