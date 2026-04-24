import * as React from "react"
import { motion } from 'framer-motion'
import { cn } from "@/lib/utils"

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hover?: boolean
  glow?: boolean
  glass?: boolean
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, hover = false, glow = false, glass = false, children, ...props }, ref) => {
    const baseClasses = 'rounded-2xl border border-[#3f3f46] bg-[#27272a] text-white relative'
    const hoverClasses = hover
      ? 'transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:border-white/30 cursor-pointer'
      : ''
    const glowClasses = glow ? 'shadow-lg shadow-white/5' : ''
    const glassClasses = glass ? 'backdrop-blur-xl bg-[#27272a]/60' : ''

    return (
      <div
        ref={ref}
        className={cn(baseClasses, hoverClasses, glowClasses, glassClasses, className)}
        {...props}
      >
        {hover && (
          <div className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-700 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.05),transparent)] pointer-events-none rounded-2xl" />
        )}
        {children}
      </div>
    )
  }
)
Card.displayName = "Card"

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
))
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "text-xl font-bold tracking-tight leading-none",
      className
    )}
    {...props}
  />
))
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-[#a1a1aa] font-medium", className)}
    {...props}
  />
))
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
))
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
))
CardFooter.displayName = "CardFooter"

// Animated card variant
export const AnimatedCard = motion(Card)

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }
