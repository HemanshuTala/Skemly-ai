import { motion } from 'framer-motion'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export function LoadingSpinner({ size = 'md', className }: { size?: 'sm' | 'md' | 'lg'; className?: string }) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  }

  return (
    <div className="relative">
      {/* Pulsing ring */}
      <motion.div
        className={cn('absolute inset-0 rounded-full border-2 border-primary/20', sizeClasses[size])}
        animate={{
          scale: [1, 1.4, 1],
          opacity: [0.5, 0, 0.5],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
      <Loader2 className={cn(`${sizeClasses[size]} animate-spin text-primary relative`, className)} />
    </div>
  )
}

export function LoadingPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-6">
        <LoadingSpinner size="lg" />
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-muted-foreground/60 font-medium"
        >
          Loading your workspace...
        </motion.p>
      </div>
    </div>
  )
}

export function LoadingOverlay() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-background/90 backdrop-blur-xl z-50 flex items-center justify-center"
    >
      <div className="text-center space-y-6">
        <LoadingSpinner size="lg" />
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-muted-foreground/60 font-medium"
        >
          Please wait...
        </motion.p>
      </div>
    </motion.div>
  )
}

export function LoadingCard() {
  return (
    <div className="border border-border/50 rounded-2xl p-6 bg-card/40 backdrop-blur-sm">
      <div className="space-y-4 animate-pulse">
        <div className="h-4 bg-muted/60 rounded-lg w-3/4"></div>
        <div className="h-3 bg-muted/40 rounded-lg w-1/2"></div>
        <div className="h-3 bg-muted/40 rounded-lg w-2/3"></div>
      </div>
    </div>
  )
}

export function LoadingButton() {
  return (
    <div className="flex items-center gap-2">
      <LoadingSpinner size="sm" />
      <span className="font-medium">Loading...</span>
    </div>
  )
}

// Skeleton loader for content
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'rounded-xl bg-gradient-to-r from-muted/30 via-muted/50 to-muted/30',
        'animate-[shimmer_2s_infinite]',
        className
      )}
    />
  )
}
