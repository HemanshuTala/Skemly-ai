import type { Variants } from 'framer-motion'

// Fade in from bottom with stagger support
export const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.05,
      duration: 0.5,
      ease: [0.22, 1, 0.36, 1],
    },
  }),
}

// Scale and fade in
export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.4,
      ease: [0.22, 1, 0.36, 1],
    },
  },
}

// Slide in from left
export const slideInLeft: Variants = {
  hidden: { opacity: 0, x: -40 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.5,
      ease: [0.22, 1, 0.36, 1],
    },
  },
}

// Slide in from right
export const slideInRight: Variants = {
  hidden: { opacity: 0, x: 40 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.5,
      ease: [0.22, 1, 0.36, 1],
    },
  },
}

// Stagger children animation
export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
}

// Card hover animation
export const cardHover = {
  rest: { scale: 1, y: 0 },
  hover: {
    scale: 1.02,
    y: -8,
    transition: {
      duration: 0.3,
      ease: [0.22, 1, 0.36, 1],
    },
  },
}

// Magnetic button effect
export const magneticHover = {
  scale: 1.05,
  transition: {
    type: 'spring',
    stiffness: 400,
    damping: 25,
  },
}

// Smooth spring transition
export const smoothSpring = {
  type: 'spring' as const,
  stiffness: 300,
  damping: 30,
}

// Snappy spring transition
export const snappySpring = {
  type: 'spring' as const,
  stiffness: 420,
  damping: 34,
  mass: 0.85,
}

// Ease out expo curve
export const easeOutExpo = [0.22, 1, 0.36, 1] as const
