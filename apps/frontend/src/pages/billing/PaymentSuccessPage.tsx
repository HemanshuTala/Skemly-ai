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
    <div className="min-h-screen bg-[#09090b] flex items-center justify-center p-4 overflow-hidden relative">
      {status === 'success' && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-3 h-3 bg-violet-500 rounded-full animate-[bounce_3s_ease-in-out_infinite]" />
          <div className="absolute top-1/3 right-1/4 w-2 h-2 bg-emerald-500 rounded-full animate-[bounce_2.5s_ease-in-out_infinite_0.5s]" />
          <div className="absolute bottom-1/3 left-1/3 w-4 h-4 bg-indigo-500 rounded-full animate-[bounce_4s_ease-in-out_infinite_1s]" />
          <div className="absolute top-1/2 right-1/3 w-2.5 h-2.5 bg-yellow-500 rounded-full animate-[bounce_3.5s_ease-in-out_infinite_0.2s]" />
        </div>
      )}
      
      <div className="bg-[#0d0d10] border border-white/[0.08] rounded-2xl p-10 max-w-md w-full mx-4 text-center shadow-2xl relative z-10">
        {status === 'verifying' && (
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 rounded-full border border-white/[0.08] flex items-center justify-center relative mb-6">
              <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-violet-500 animate-spin" />
              <Loader2 className="w-8 h-8 text-[#a1a1aa] animate-spin" />
            </div>
            <h1 className="text-white text-2xl font-bold mb-2">
              Verifying Payment
            </h1>
            <p className="text-[#71717a] text-sm leading-relaxed">
              Please wait while we confirm your payment with Razorpay.
            </p>
          </div>
        )}

        {status === 'success' && (
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-8 h-8 text-emerald-400" />
            </div>
            <h1 className="text-white text-2xl font-bold mb-2">
              Payment Successful!
            </h1>
            <p className="text-[#71717a] text-sm leading-relaxed mb-4">
              Your subscription has been activated. You now have access to all premium features.
            </p>
            <div className="bg-violet-500/10 border border-violet-500/20 text-violet-400 text-sm font-semibold px-4 py-1.5 rounded-full inline-block mb-6">
              Premium Plan Active
            </div>
            <div className="w-full flex flex-col gap-3 mt-2">
              <button
                onClick={handleGoToDashboard}
                className="w-full h-11 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-sm font-bold hover:opacity-90 transition-opacity"
              >
                Go to Dashboard
              </button>
              <button
                onClick={handleGoToSettings}
                className="w-full h-11 rounded-xl bg-transparent border border-white/[0.08] text-white text-sm font-bold hover:bg-white/[0.02] transition-colors"
              >
                View Subscription
              </button>
            </div>
            <p className="text-[#52525b] text-xs mt-6">
              You will be redirected automatically in a few seconds...
            </p>
          </div>
        )}

        {!searchParams.get('razorpay_payment_id') && !searchParams.get('razorpay_subscription_id') && status === 'verifying' && (
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 rounded-full border border-white/[0.08] flex items-center justify-center relative mb-6">
              <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-violet-500 animate-spin" />
              <Loader2 className="w-8 h-8 text-[#a1a1aa] animate-spin" />
            </div>
            <h1 className="text-white text-2xl font-bold mb-2">
              Checking Status
            </h1>
            <p className="text-[#71717a] text-sm leading-relaxed mb-6">
              If you just completed payment on Razorpay, please wait while we verify it.
            </p>
            <button
              onClick={handleGoToSettings}
              className="w-full h-11 rounded-xl bg-white text-[#18181b] text-sm font-bold hover:bg-[#e4e4e7] transition-colors"
            >
              Go to Settings
            </button>
          </div>
        )}

        {status === 'error' && (
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-6">
              <XCircle className="w-8 h-8 text-red-400" />
            </div>
            <h1 className="text-white text-2xl font-bold mb-2">
              Payment Failed
            </h1>
            <p className="text-[#71717a] text-sm leading-relaxed mb-8">
              {errorMessage || 'We couldn\'t verify your payment. If you were charged, please contact support.'}
            </p>
            <div className="w-full flex flex-col gap-3">
              <button
                onClick={handleGoToDashboard}
                className="w-full h-11 rounded-xl bg-white text-[#18181b] text-sm font-bold hover:bg-[#e4e4e7] transition-colors"
              >
                Go to Dashboard
              </button>
              <button
                onClick={handleGoToSettings}
                className="w-full h-11 rounded-xl bg-transparent border border-white/[0.08] text-white text-sm font-bold hover:bg-white/[0.02] transition-colors"
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
