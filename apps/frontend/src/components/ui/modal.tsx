import { Fragment, ReactNode, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '../../lib/utils';
import { X } from 'lucide-react';

/** Must sit above React Flow (z~100), Monaco widgets, and Radix menus. */
const Z_BACKDROP = 10_000;
const Z_PANEL = 10_001;

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  showCloseButton?: boolean;
  className?: string;
}

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  size = 'md',
  showCloseButton = true,
  className,
}: ModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    const body = document.body;
    const prev = body.style.overflow;
    const prevPadding = body.style.paddingRight;
    
    // Only hide overflow if not already hidden
    if (body.style.overflow !== 'hidden') {
      body.style.overflow = 'hidden';
    }
    
    return () => {
      body.style.overflow = prev;
      body.style.paddingRight = prevPadding;
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizes = {
    sm: 'max-w-[min(calc(100vw-1.25rem),24rem)]',
    md: 'max-w-[min(calc(100vw-1.5rem),28rem)]',
    lg: 'max-w-[min(calc(100vw-1.5rem),34rem)]',
    xl: 'max-w-[min(calc(100vw-1.5rem),42rem)]',
    full: 'max-w-[min(96vw,72rem)] max-h-[min(92vh,52rem)]',
  };

  return createPortal(
    <div className="fixed inset-0 flex items-center justify-center p-3 animate-in fade-in duration-300" style={{ zIndex: Z_BACKDROP }}>
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-[#09090b]/80 backdrop-blur-[6px] transition-opacity cursor-pointer"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        className={cn(
          'group/modal relative flex max-h-[min(88vh,48rem)] w-full flex-col overflow-hidden rounded-2xl border border-[#3f3f46] bg-[#27272a]/98 backdrop-blur-3xl text-white shadow-[0_32px_80px_-16px_rgba(0,0,0,0.7)] pointer-events-auto outline-none animate-in zoom-in-95 slide-in-from-bottom-6 duration-500 ease-out',
          sizes[size],
          size === 'full' && 'max-h-[min(94vh,56rem)]',
          className
        )}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'modal-title' : undefined}
      >
        {/* Decorative elements */}
        <div className="pointer-events-none absolute -right-24 -top-24 h-48 w-48 rounded-full bg-white/10 blur-[80px]" />
        <div className="pointer-events-none absolute -left-20 -bottom-20 h-40 w-40 rounded-full bg-[#3f3f46]/20 blur-[60px]" />

        {(title || showCloseButton) && (
          <div className="relative shrink-0 border-b border-[#3f3f46] px-6 py-5 sm:px-8">
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0 space-y-1">
                {title && (
                  <h2
                    id="modal-title"
                    className="font-display text-lg font-bold tracking-tight text-white sm:text-xl drop-shadow-sm"
                  >
                    {title}
                  </h2>
                )}
                {description && (
                  <p className="text-[12px] font-medium leading-relaxed text-[#a1a1aa] sm:text-[13px] line-clamp-2">
                    {description}
                  </p>
                )}
              </div>
              {showCloseButton && (
                <button
                  type="button"
                  onClick={onClose}
                  className="shrink-0 flex h-10 w-10 items-center justify-center rounded-xl border border-[#3f3f46] bg-[#18181b] text-[#a1a1aa] transition-all hover:bg-[#27272a] hover:text-white hover:scale-110 active:scale-90"
                  aria-label="Close"
                >
                  <X className="h-5 w-5" strokeWidth={2.5} />
                </button>
              )}
            </div>
          </div>
        )}

        <div className="relative min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 py-5 sm:px-8 sm:py-7 custom-scrollbar touch-auto pointer-events-auto">
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
}
