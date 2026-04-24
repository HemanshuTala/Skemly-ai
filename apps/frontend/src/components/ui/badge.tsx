import { HTMLAttributes } from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'error' | 'info' | 'gradient';
  size?: 'sm' | 'md' | 'lg';
  pulse?: boolean;
  glow?: boolean;
}

export function Badge({
  className,
  variant = 'default',
  size = 'md',
  pulse = false,
  glow = false,
  children,
  ...props
}: BadgeProps) {
  const variants = {
    default: 'bg-[#27272a] text-[#a1a1aa] border border-[#3f3f46]',
    primary: 'bg-white text-[#18181b] border border-white',
    success: 'bg-[#14532d]/30 text-[#4ade80] border border-[#4ade80]/30',
    warning: 'bg-[#78350f]/30 text-[#fbbf24] border border-[#fbbf24]/30',
    error: 'bg-[#7f1d1d]/30 text-[#f87171] border border-[#f87171]/30',
    info: 'bg-[#1e3a5f]/30 text-[#60a5fa] border border-[#60a5fa]/30',
    gradient: 'bg-gradient-to-r from-[#27272a] to-[#3f3f46] text-white border border-[#3f3f46]',
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.15em]',
    md: 'px-2.5 py-1 text-xs font-bold uppercase tracking-wider',
    lg: 'px-3 py-1.5 text-sm font-bold uppercase tracking-wide',
  };

  const glowStyles = glow ? 'shadow-lg shadow-current/20' : '';

  const BadgeContent = (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-lg backdrop-blur-sm transition-all duration-300',
        variants[variant],
        sizes[size],
        glowStyles,
        className
      )}
      {...props}
    >
      {pulse && (
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-current opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-current"></span>
        </span>
      )}
      {children}
    </span>
  );

  if (pulse) {
    return (
      <motion.span
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      >
        {BadgeContent}
      </motion.span>
    );
  }

  return BadgeContent;
}
