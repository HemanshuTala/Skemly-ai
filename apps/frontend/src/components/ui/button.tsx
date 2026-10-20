import { ButtonHTMLAttributes, forwardRef } from 'react';
import { Slot } from '@radix-ui/react-slot';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'success' | 'outline' | 'gradient' | 'glow';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  isLoading?: boolean;
  loadingText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  /** Render as child element (e.g. `Link`) instead of `button` to avoid nested interactive nodes. */
  asChild?: boolean;
  /** Enable magnetic hover effect */
  magnetic?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      loadingText,
      leftIcon,
      rightIcon,
      children,
      disabled,
      asChild = false,
      magnetic = false,
      ...props
    },
    ref
  ) => {
    const baseStyles = 'inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-all duration-200 ease-out active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:opacity-50 disabled:pointer-events-none disabled:active:scale-100 relative overflow-hidden';
    
    const variants = {
      primary: 'bg-violet-600 text-white shadow-[0_6px_20px_rgba(124,58,237,0.2)] hover:bg-violet-500 hover:shadow-[0_8px_24px_rgba(124,58,237,0.28)]',
      secondary: 'border border-white/[0.08] bg-white/[0.04] text-zinc-100 hover:border-white/[0.14] hover:bg-white/[0.08]',
      ghost: 'text-zinc-400 hover:bg-white/[0.05] hover:text-white',
      danger: 'bg-rose-500 text-white shadow-sm hover:bg-rose-400',
      success: 'bg-emerald-400 text-emerald-950 shadow-sm hover:bg-emerald-300',
      outline: 'border border-white/[0.1] bg-transparent text-zinc-200 hover:border-white/[0.2] hover:bg-white/[0.04]',
      gradient: 'border border-violet-400/20 bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-950/30 hover:from-violet-500 hover:to-indigo-500',
      glow: 'bg-violet-500 text-white shadow-[0_0_20px_rgba(139,92,246,0.3)] hover:bg-violet-400 hover:shadow-[0_0_28px_rgba(139,92,246,0.42)]',
    };
    
    const sizes = {
      sm: 'h-8 px-3 text-xs',
      md: 'h-10 px-5 text-sm',
      lg: 'h-12 px-7 text-base',
      xl: 'h-14 px-9 text-lg',
    };

    const Comp = asChild ? Slot : 'button';

    // Slot (asChild) must receive exactly one element and no sibling icons/spinner.
    if (asChild) {
      return (
        <Slot
          ref={ref}
          className={cn(baseStyles, variants[variant], sizes[size], className)}
          {...props}
        >
          {children}
        </Slot>
      );
    }

    const ButtonContent = (
      <>
        {/* Glow/Shimmer effect overlay */}
        {(variant === 'gradient' || variant === 'glow') && (
          <div className={cn(
            "absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%]",
            variant === 'gradient' ? "animate-[shimmer_3s_infinite]" : "animate-[shimmer_2s_infinite] opacity-30"
          )} />
        )}
        
        {isLoading && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            aria-hidden="true"
            className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"
          />
        )}
        {!isLoading && leftIcon && <span className="transition-transform group-hover:scale-110 shrink-0">{leftIcon}</span>}
        <span className="relative z-10 flex items-center gap-2">{isLoading && loadingText ? loadingText : children}</span>
        {!isLoading && rightIcon && <span className="transition-transform group-hover:translate-x-0.5 shrink-0">{rightIcon}</span>}
      </>
    );

    if (magnetic) {
      const motionProps = props as unknown as Record<string, unknown>;
      return (
        <motion.button
          ref={ref}
          className={cn(baseStyles, variants[variant], sizes[size], 'group', className)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          {...motionProps}
          type={props.type ?? 'button'}
          disabled={disabled || isLoading}
          aria-busy={isLoading || undefined}
        >
          {ButtonContent}
        </motion.button>
      );
    }

    return (
      <button
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], 'group', className)}
        {...props}
        type={props.type ?? 'button'}
        disabled={disabled || isLoading}
        aria-busy={isLoading || undefined}
      >
        {ButtonContent}
      </button>
    );
  }
);

Button.displayName = 'Button';

export { Button };
