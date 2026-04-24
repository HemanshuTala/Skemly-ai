import { useState, useCallback } from 'react';
import { ToastProps } from '../components/ui/toast';

let toastId = 0;

export function useToast() {
  const [toasts, setToasts] = useState<ToastProps[]>([]);

  const addToast = useCallback((
    message: string,
    type: ToastProps['type'] = 'info',
    duration = 3000
  ) => {
    const id = `toast-${toastId++}`;
    const toast: ToastProps = {
      id,
      message,
      type,
      duration,
      onClose: (id) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      },
    };

    setToasts((prev) => [...prev, toast]);
  }, []);

  const success = useCallback((message: string, duration?: number) => {
    addToast(message, 'success', duration);
  }, [addToast]);

  const error = useCallback((message: string, duration?: number) => {
    addToast(message, 'error', duration);
  }, [addToast]);

  const warning = useCallback((message: string, duration?: number) => {
    addToast(message, 'warning', duration);
  }, [addToast]);

  const info = useCallback((message: string, duration?: number) => {
    addToast(message, 'info', duration);
  }, [addToast]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return {
    toasts,
    success,
    error,
    warning,
    info,
    removeToast,
  };
}
