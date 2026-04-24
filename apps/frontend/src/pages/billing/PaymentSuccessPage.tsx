import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { billingAPI } from '@/services/api.service';
import { useAuthStore } from '@/stores/authStore';
import toast from 'react-hot-toast';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';

/**
 * Payment Success Page
 * Handles redirect from Razorpay hosted checkout (short_url)
 * Verifies the payment and activates the subscription
 */
export function PaymentSuccessPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { fetchUser } = useAuthStore();
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const verifyPayment = async () => {
      const razorpayPaymentId = searchParams.get('razorpay_payment_id');
      const razorpaySubscriptionId = searchParams.get('razorpay_subscription_id');
      const razorpaySignature = searchParams.get('razorpay_signature');

      // If no payment params, check if user has active subscription (manual return)
      if (!razorpayPaymentId && !razorpaySubscriptionId) {
        try {
          // Check user's subscription status
          const subRes = await billingAPI.getSubscription();
          const subscription = subRes.data?.data;
          
          if (subscription?.plan && subscription.plan !== 'free') {
            // User has active subscription, show success
            setStatus('success');
            await fetchUser();
            toast.success('Subscription is active!');
            setTimeout(() => {
              navigate('/dashboard', { replace: true });
            }, 3000);
          } else {
            // No active subscription, redirect to settings
            navigate('/settings', { replace: true });
          }
        } catch (err) {
          // Error checking subscription, redirect to settings
          navigate('/settings', { replace: true });
        }
        return;
      }

      if (!razorpayPaymentId || !razorpaySubscriptionId) {
        setStatus('error');
        setErrorMessage('Missing payment information');
        return;
      }

      try {
        const response = await billingAPI.verifyPayment({
          razorpayPaymentId,
          razorpaySubscriptionId,
          razorpaySignature: razorpaySignature || undefined,
        });

        if (response.data?.success) {
          setStatus('success');
          // Refresh user data to update plan status
          await fetchUser();
          toast.success('Payment successful! Your subscription is now active.');
          // Auto-redirect to dashboard after 3 seconds
          setTimeout(() => {
            navigate('/dashboard', { replace: true });
          }, 3000);
        } else {
          setStatus('error');
          setErrorMessage('Payment verification failed');
        }
      } catch (error: any) {
        setStatus('error');
        const message = error?.response?.data?.error?.message || 'Payment verification failed';
        setErrorMessage(message);
        toast.error(message);
      }
    };

    verifyPayment();
  }, [searchParams, navigate, fetchUser]);

  const handleGoToDashboard = () => {
    navigate('/dashboard', { replace: true });
  };

  const handleGoToSettings = () => {
    navigate('/settings', { replace: true });
  };


  return (
    <div className="min-h-screen bg-[#09090b] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-[#18181b] border border-[#27272a] rounded-2xl p-8">
        {status === 'verifying' && (
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#27272a] flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-[#a1a1aa] animate-spin" />
            </div>
            <h1 className="text-xl font-semibold text-white mb-2">
              Verifying Payment...
            </h1>
            <p className="text-sm text-[#71717a]">
              Please wait while we confirm your payment with Razorpay.
            </p>
          </div>
        )}

        {status === 'success' && (
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/10 flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-green-500" />
            </div>
            <h1 className="text-xl font-semibold text-white mb-2">
              Payment Successful!
            </h1>
            <p className="text-sm text-[#71717a] mb-6">
              Your subscription has been activated. You now have access to all premium features.
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={handleGoToDashboard}
                className="w-full h-10 rounded-lg bg-white text-[#18181b] text-sm font-medium hover:bg-[#e4e4e7] transition-colors"
              >
                Go to Dashboard
              </button>
              <button
                onClick={handleGoToSettings}
                className="w-full h-10 rounded-lg bg-[#27272a] text-white text-sm font-medium hover:bg-[#3f3f46] transition-colors"
              >
                View Subscription
              </button>
            </div>
          </div>
        )}

        {/* Show if user manually returned from Razorpay without params */}
        {!searchParams.get('razorpay_payment_id') && !searchParams.get('razorpay_subscription_id') && status === 'verifying' && (
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#27272a] flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-[#a1a1aa] animate-spin" />
            </div>
            <h1 className="text-xl font-semibold text-white mb-2">
              Checking Subscription Status...
            </h1>
            <p className="text-sm text-[#71717a] mb-4">
              If you just completed payment on Razorpay, please wait while we verify it.
            </p>
            <button
              onClick={handleGoToSettings}
              className="w-full h-10 rounded-lg bg-white text-[#18181b] text-sm font-medium hover:bg-[#e4e4e7] transition-colors"
            >
              Go to Settings
            </button>
          </div>
        )}

        {status === 'error' && (
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/10 flex items-center justify-center">
              <XCircle className="w-8 h-8 text-red-500" />
            </div>
            <h1 className="text-xl font-semibold text-white mb-2">
              Payment Verification Failed
            </h1>
            <p className="text-sm text-[#71717a] mb-6">
              {errorMessage || 'We couldn\'t verify your payment. If you were charged, please contact support.'}
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={handleGoToDashboard}
                className="w-full h-10 rounded-lg bg-white text-[#18181b] text-sm font-medium hover:bg-[#e4e4e7] transition-colors"
              >
                Go to Dashboard
              </button>
              <button
                onClick={handleGoToSettings}
                className="w-full h-10 rounded-lg bg-[#27272a] text-white text-sm font-medium hover:bg-[#3f3f46] transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default PaymentSuccessPage;
