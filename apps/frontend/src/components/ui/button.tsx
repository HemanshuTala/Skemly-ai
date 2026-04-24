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
    const baseStyles = 'inline-flex items-center justify-center gap-2 font-bold rounded-xl transition-all duration-300 ease-out active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:opacity-50 disabled:pointer-events-none disabled:active:scale-100 relative overflow-hidden';
    
    const variants = {
      primary: 'bg-white text-[#18181b] shadow-[0_0_20px_rgba(255,255,255,0.15)] hover:shadow-[0_0_25px_rgba(255,255,255,0.25)] hover:bg-[#e4e4e7] hover:-translate-y-0.5 transition-all',
      secondary: 'bg-[#27272a] text-white hover:bg-[#3f3f46] shadow-sm border border-[#3f3f46]',
      ghost: 'text-[#a1a1aa] hover:bg-[#27272a] hover:text-white',
      danger: 'bg-[#f87171] text-white shadow-md hover:opacity-90 hover:-translate-y-0.5',
      success: 'bg-[#4ade80] text-[#14532d] shadow-md hover:opacity-90 hover:-translate-y-0.5',
      outline: 'border border-[#3f3f46] bg-transparent text-white hover:bg-[#27272a] hover:border-[#52525b]',
      gradient: 'bg-gradient-to-r from-[#27272a] via-[#3f3f46] to-[#27272a] bg-[length:200%_auto] text-white shadow-lg shadow-white/5 hover:shadow-white/10 hover:-translate-y-0.5',
      glow: 'bg-white text-[#18181b] shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:shadow-[0_0_30px_rgba(255,255,255,0.5)] hover:bg-[#e4e4e7] hover:-translate-y-1 transition-all duration-500',
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
