import { Variants } from 'framer-motion'

// Button tap animation
export const buttonTap = {
  scale: 0.97,
  transition: { duration: 0.1 },
}

// Icon bounce on hover
export const iconBounce: Variants = {
  rest: { scale: 1, rotate: 0 },
  hover: {
    scale: 1.1,
    rotate: [0, -10, 10, -10, 0],
    transition: {
      duration: 0.5,
      ease: 'easeInOut',
    },
  },
}

// Notification badge pulse
export const badgePulse: Variants = {
  initial: { scale: 0.8, opacity: 0 },
  animate: {
    scale: [0.8, 1.1, 1],
    opacity: 1,
    transition: {
      duration: 0.4,
      ease: [0.22, 1, 0.36, 1],
    },
  },
}

// Card lift on hover
export const cardLift = {
  rest: { y: 0, scale: 1 },
  hover: {
    y: -8,
    scale: 1.01,
    transition: {
      duration: 0.3,
      ease: [0.22, 1, 0.36, 1],
    },
  },
}

// Smooth fade in
export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.4 },
  },
}

// Slide up fade in
export const slideUpFadeIn: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.22, 1, 0.36, 1],
    },
  },
}

// Stagger children with delay
export const staggerChildren = (staggerDelay = 0.1): Variants => ({
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: staggerDelay,
      delayChildren: 0.1,
    },
  },
})

// Rotate and scale on hover (for icons)
export const rotateScale: Variants = {
  rest: { rotate: 0, scale: 1 },
  hover: {
    rotate: 180,
    scale: 1.15,
    transition: {
      duration: 0.4,
      ease: [0.22, 1, 0.36, 1],
    },
  },
}

// Shimmer effect for loading states
export const shimmer = {
  animate: {
    backgroundPosition: ['200% 0', '-200% 0'],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: 'linear',
    },
  },
}

// Tooltip appear animation
export const tooltipAppear: Variants = {
  hidden: { opacity: 0, scale: 0.9, y: 5 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      duration: 0.2,
      ease: [0.22, 1, 0.36, 1],
    },
  },
}

// Modal backdrop animation
export const modalBackdrop: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.3 },
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.2 },
  },
}

// Modal content animation
export const modalContent: Variants = {
  hidden: { opacity: 0, scale: 0.95, y: 20 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      duration: 0.3,
      ease: [0.22, 1, 0.36, 1],
    },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: 20,
    transition: { duration: 0.2 },
  },
}

// Number counter animation
export const counterAnimation = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
}

// Magnetic button effect
export const magneticButton = {
  whileHover: {
    scale: 1.05,
    transition: {
      type: 'spring',
      stiffness: 400,
      damping: 25,
    },
  },
  whileTap: {
    scale: 0.95,
  },
}

// Glow effect on hover
export const glowOnHover = {
  rest: { boxShadow: '0 0 0 rgba(185, 125, 82, 0)' },
  hover: {
    boxShadow: '0 0 30px rgba(185, 125, 82, 0.3)',
    transition: { duration: 0.3 },
  },
}
