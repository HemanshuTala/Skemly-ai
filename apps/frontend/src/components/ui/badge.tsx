import { HTMLAttributes } from 'react';
import { cn } from '../../lib/utils';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'error' | 'info' | 'gradient';
  size?: 'sm' | 'md' | 'lg';
  pulse?: boolean;
  dot?: boolean;
}

const variantStyles: Record<string, string> = {
  default:  'bg-white/[0.06] text-[#a1a1aa] border border-white/[0.08]',
  primary:  'bg-white text-[#09090b] border border-white/80',
  success:  'bg-[#4ade80]/10 text-[#4ade80] border border-[#4ade80]/20',
  warning:  'bg-[#fbbf24]/10 text-[#fbbf24] border border-[#fbbf24]/20',
  error:    'bg-[#f87171]/10 text-[#f87171] border border-[#f87171]/20',
  info:     'bg-[#60a5fa]/10 text-[#60a5fa] border border-[#60a5fa]/20',
  gradient: 'bg-gradient-to-r from-white/[0.08] to-white/[0.04] text-white border border-white/[0.10]',
};

const dotColors: Record<string, string> = {
  default: 'bg-[#a1a1aa]',
  primary: 'bg-[#09090b]',
  success: 'bg-[#4ade80]',
  warning: 'bg-[#fbbf24]',
  error:   'bg-[#f87171]',
  info:    'bg-[#60a5fa]',
  gradient:'bg-white',
};

const sizeStyles: Record<string, string> = {
  sm: 'px-1.5 py-0.5 text-[10px] font-semibold tracking-[0.08em] uppercase gap-1',
  md: 'px-2 py-0.5 text-[11px] font-semibold tracking-[0.06em] uppercase gap-1.5',
  lg: 'px-2.5 py-1 text-xs font-semibold tracking-[0.05em] uppercase gap-1.5',
};

export function Badge({
  className,
  variant = 'default',
  size = 'md',
  pulse = false,
  dot = false,
  children,
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md transition-colors duration-200',
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      {...props}
    >
      {(dot || pulse) && (
        <span className="relative flex shrink-0 h-1.5 w-1.5">
          {pulse && (
            <span
              className={cn(
                'absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping',
                dotColors[variant]
              )}
            />
          )}
          <span
            className={cn(
              'relative inline-flex rounded-full h-1.5 w-1.5',
              dotColors[variant]
            )}
          />
        </span>
      )}
      {children}
    </span>
  );
}
