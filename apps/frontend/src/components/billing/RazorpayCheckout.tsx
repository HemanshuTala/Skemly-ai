import { useEffect, useState } from 'react';
import { useRazorpay, RazorpaySuccessResponse } from '@/hooks/useRazorpay';
import { billingAPI } from '@/services/api.service';
import toast from 'react-hot-toast';
import { Loader2 } from 'lucide-react';

interface RazorpayCheckoutProps {
  planId: 'starter' | 'basic' | 'pro' | 'team';
  onSuccess?: () => void;
  onCancel?: () => void;
}

const RAZORPAY_KEY_ID = import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_SFzdvgFWIJjzUx';

export function RazorpayCheckoutButton({ 
  planId, 
  onSuccess, 
  onCancel 
}: RazorpayCheckoutProps) {
  const { isLoaded, isLoading, openCheckout } = useRazorpay();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubscribe = async () => {
    if (!isLoaded) {
      toast.error('Payment system not ready. Please try again.');
      return;
    }

    setIsProcessing(true);
    
    try {
      // Create subscription on backend
      const res = await billingAPI.subscribe({ planId });
      const { subscriptionId, shortUrl } = res.data?.data || {};

      if (!subscriptionId) {
        throw new Error('Failed to create subscription');
      }

      // Option 1: Redirect to Razorpay's hosted checkout
      if (shortUrl) {
        window.location.href = shortUrl;
        return;
      }

      // Option 2: Open inline Razorpay checkout (fallback)
      const checkout = openCheckout({
        key: RAZORPAY_KEY_ID,
        subscription_id: subscriptionId,
        name: 'Skemly',
        description: `Subscribe to ${planId.charAt(0).toUpperCase() + planId.slice(1)} Plan`,
        handler: async (response: RazorpaySuccessResponse) => {
          try {
            // Verify payment with backend
            const verifyRes = await billingAPI.verifyPayment({
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySubscriptionId: response.razorpay_subscription_id,
              razorpaySignature: response.razorpay_signature,
            });

            if (verifyRes.data?.success) {
              toast.success('Payment successful! Your subscription is now active.');
              onSuccess?.();
            } else {
              toast.error('Payment verification failed. Please contact support.');
            }
          } catch (verifyError: any) {
            const message = verifyError?.response?.data?.error?.message || 'Payment verification failed';
            toast.error(message);
          } finally {
            setIsProcessing(false);
          }
        },
        theme: {
          color: '#c99367',
        },
        modal: {
          ondismiss: () => {
            toast('Payment cancelled. You can try again anytime.');
            onCancel?.();
            setIsProcessing(false);
          },
        },
      });

      if (!checkout) {
        throw new Error('Failed to open checkout');
      }

    } catch (error: any) {
      setIsProcessing(false);
      const message = error?.response?.data?.error?.message || error.message || 'Subscription failed';
      toast.error(message);
    }
  };

  return (
    <button
      onClick={handleSubscribe}
      disabled={isProcessing || isLoading || !isLoaded}
      className="w-full h-12 rounded-2xl bg-primary text-primary-foreground text-xs font-black uppercase tracking-widest transition-all hover:shadow-xl hover:shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
    >
      {(isProcessing || isLoading) ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          Processing...
        </>
      ) : (
        `Upgrade to ${planId.charAt(0).toUpperCase() + planId.slice(1)}`
      )}
    </button>
  );
}

// Hook for programmatic checkout
export function useRazorpayCheckout() {
  const { isLoaded, openCheckout } = useRazorpay();

  const initiateCheckout = async (planId: 'starter' | 'basic' | 'pro' | 'team') => {
    if (!isLoaded) {
      toast.error('Payment system not ready');
      return null;
    }

    try {
      const res = await billingAPI.subscribe({ planId });
      const { subscriptionId, shortUrl } = res.data?.data || {};

      if (shortUrl) {
        window.location.href = shortUrl;
        return { type: 'redirect', url: shortUrl };
      }

      if (subscriptionId) {
        return new Promise((resolve, reject) => {
          const checkout = openCheckout({
            key: RAZORPAY_KEY_ID,
            subscription_id: subscriptionId,
            name: 'Skemly',
            description: `Subscribe to ${planId.charAt(0).toUpperCase() + planId.slice(1)} Plan`,
            handler: async (response: RazorpaySuccessResponse) => {
              try {
                // Verify payment with backend
                const verifyRes = await billingAPI.verifyPayment({
                  razorpayPaymentId: response.razorpay_payment_id,
                  razorpaySubscriptionId: response.razorpay_subscription_id,
                  razorpaySignature: response.razorpay_signature,
                });

                if (verifyRes.data?.success) {
                  resolve({ type: 'success', response, verified: true });
                } else {
                  reject(new Error('Payment verification failed'));
                }
              } catch (verifyError: any) {
                const message = verifyError?.response?.data?.error?.message || 'Payment verification failed';
                reject(new Error(message));
              }
            },
            theme: {
              color: '#c99367',
            },
            modal: {
              ondismiss: () => {
                reject(new Error('Payment cancelled'));
              },
            },
          });

          if (!checkout) {
            reject(new Error('Failed to open checkout'));
          }
        });
      }

      throw new Error('No subscription created');
    } catch (error: any) {
      const message = error?.response?.data?.error?.message || error.message || 'Subscription failed';
      toast.error(message);
      throw error;
    }
  };

  return {
    isReady: isLoaded,
    initiateCheckout,
  };
}
