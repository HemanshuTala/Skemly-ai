import { billingAPI } from '@/services/api.service';
import toast from 'react-hot-toast';

interface RazorpayInlineCheckoutOptions {
  planId: string;
  fetchUser: () => Promise<void>;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

let checkoutInstance: any = null;

function loadRazorpayScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.Razorpay) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Razorpay SDK'));
    document.body.appendChild(script);
  });
}

export async function openRazorpayCheckout({
  planId,
  fetchUser,
  onSuccess,
  onError,
}: RazorpayInlineCheckoutOptions) {
  try {
    toast.loading('Setting up payment...', { id: 'razorpay-setup' });
    
    await loadRazorpayScript();
    
    const { data } = await billingAPI.subscribe({ planId });
    const subscriptionId = data?.data?.subscriptionId;
    
    if (!subscriptionId) {
      throw new Error('Failed to create subscription');
    }

    toast.dismiss('razorpay-setup');
    toast.loading('Opening payment window...', { id: 'razorpay-open' });

    const KEY = import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_SFzdvgFWIJjzUx';

    checkoutInstance = new window.Razorpay({
      key: KEY,
      subscription_id: subscriptionId,
      name: 'Skemly',
      description: `${planId.charAt(0).toUpperCase() + planId.slice(1)} Plan Subscription`,
      handler: async (response: any) => {
        toast.loading('Verifying payment...', { id: 'razorpay-verify' });
        
        try {
          await billingAPI.verifyPayment({
            razorpayPaymentId: response.razorpay_payment_id,
            razorpaySubscriptionId: response.razorpay_subscription_id,
            razorpaySignature: response.razorpay_signature,
          });

          await fetchUser();
          
          toast.dismiss('razorpay-verify');
          toast.success('Payment successful! Your subscription is now active.');
          
          onSuccess?.();
        } catch (error: any) {
          toast.dismiss('razorpay-verify');
          const message = error?.response?.data?.error?.message || 'Payment verification failed';
          toast.error(message);
          onError?.(message);
        }
      },
      theme: {
        color: '#18181b',
      },
      modal: {
        ondismiss: () => {
          toast.dismiss('razorpay-open');
          toast('Payment cancelled', { id: 'razorpay-cancel' });
        },
      },
    });

    checkoutInstance.open();
    toast.dismiss('razorpay-open');

  } catch (error: any) {
    toast.dismiss('razorpay-setup');
    toast.dismiss('razorpay-open');
    const message = error?.response?.data?.error?.message || error.message || 'Failed to setup payment';
    toast.error(message);
    onError?.(message);
  }
}

// Cleanup function for component unmount
export function closeRazorpayCheckout() {
  if (checkoutInstance) {
    checkoutInstance.close();
    checkoutInstance = null;
  }
}

export default openRazorpayCheckout;
