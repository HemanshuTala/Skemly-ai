import { InputHTMLAttributes, forwardRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Eye, EyeOff } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      type = 'text',
      label,
      error,
      helperText,
      leftIcon,
      rightIcon,
      disabled,
      ...props
    },
    ref
  ) => {
    const [showPassword, setShowPassword] = useState(false);
    const [isFocused, setIsFocused] = useState(false);
    const inputType = type === 'password' && showPassword ? 'text' : type;

    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-[#a1a1aa] mb-2 tracking-tight">
            {label}
          </label>
        )}
        <div className="relative group">
          {/* Focus ring animation */}
          {isFocused && (
            <motion.div
              layoutId="input-focus"
              className="absolute -inset-0.5 bg-white/10 rounded-xl blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />
          )}

          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#71717a] group-focus-within:text-white transition-colors z-10">
              {leftIcon}
            </div>
          )}

          <input
            ref={ref}
            type={inputType}
            className={cn(
              'relative w-full h-11 px-4 text-sm font-medium rounded-xl border transition-all duration-300 ease-out',
              'bg-white/[0.02] text-white',
              'placeholder:text-[#52525b] placeholder:font-normal',
              'focus:outline-none focus:border-white/[0.20] focus:ring-0 focus:bg-white/[0.03]',
              'hover:border-white/[0.20] hover:bg-white/[0.03]',
              error
                ? 'border-red-500/50 bg-red-500/5 focus:border-red-500/50'
                : 'border-white/[0.08]',
              disabled && 'opacity-50 cursor-not-allowed hover:border-white/[0.08]',
              leftIcon && 'pl-11',
              (rightIcon || type === 'password') && 'pr-11',
              className
            )}
            disabled={disabled}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            {...props}
          />

          {type === 'password' && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#71717a] hover:text-white transition-colors z-10 p-1 rounded-lg hover:bg-[#3f3f46]"
            >
              {showPassword ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          )}

          {rightIcon && !type.includes('password') && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[#71717a] z-10">
              {rightIcon}
            </div>
          )}
        </div>

        {error && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-2 text-xs font-bold text-[#f87171] flex items-center gap-1.5"
          >
            <span className="w-1 h-1 rounded-full bg-[#f87171]" />
            {error}
          </motion.p>
        )}

        {helperText && !error && (
          <p className="mt-2 text-xs text-[#71717a]">{helperText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export { Input };
