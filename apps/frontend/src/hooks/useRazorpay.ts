import { useEffect, useState, useCallback } from 'react';

export interface RazorpaySuccessResponse {
  razorpay_payment_id: string;
  razorpay_order_id?: string;
  razorpay_subscription_id: string;
  razorpay_signature: string;
}

interface RazorpayBaseOptions {
  key: string;
  name: string;
  description: string;
  handler: (response: RazorpaySuccessResponse) => void;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  theme?: {
    color?: string;
  };
  modal?: {
    ondismiss?: () => void;
    escape?: boolean;
    backdropclose?: boolean;
    handleback?: boolean;
    confirm_close?: boolean;
    animation?: boolean;
  };
  notes?: Record<string, string>;
  callback_url?: string;
  redirect?: boolean;
}

interface RazorpayOrderOptions extends RazorpayBaseOptions {
  amount: number;
  currency: string;
  order_id: string;
  subscription_id?: never;
}

interface RazorpaySubscriptionOptions extends RazorpayBaseOptions {
  subscription_id: string;
  amount?: never;
  currency?: never;
  order_id?: never;
  subscription_card_change?: 0 | 1;
}

type RazorpayOptions = RazorpayOrderOptions | RazorpaySubscriptionOptions;

interface RazorpayInstance {
  open: () => void;
  close: () => void;
  on: (event: string, callback: () => void) => void;
}

declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

export function useRazorpay() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load Razorpay script
  useEffect(() => {
    if (window.Razorpay) {
      setIsLoaded(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => {
      setIsLoaded(true);
      setError(null);
    };
    script.onerror = () => {
      setError('Failed to load Razorpay checkout');
      setIsLoaded(false);
    };

    document.body.appendChild(script);

    return () => {
      // Don't remove script on unmount to avoid re-loading
    };
  }, []);

  const openCheckout = useCallback((options: RazorpayOptions) => {
    if (!window.Razorpay) {
      setError('Razorpay not loaded');
      return null;
    }

    setIsLoading(true);
    
    const razorpay = new window.Razorpay({
      ...options,
      modal: {
        ...options.modal,
        ondismiss: () => {
          setIsLoading(false);
          options.modal?.ondismiss?.();
        },
      },
      handler: (response: any) => {
        setIsLoading(false);
        options.handler(response);
      },
    });

    razorpay.open();
    return razorpay;
  }, []);

  return {
    isLoaded,
    isLoading,
    error,
    openCheckout,
  };
}
