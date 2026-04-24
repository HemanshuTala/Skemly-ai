import { Request, Response, NextFunction } from 'express';
import { User } from '../models/user.model';
import { billingService } from '../services/billing.service';
import { ApiError } from '../middleware/errorHandler';

/**
 * §13 Billing & Subscription Controller
 * Razorpay integration for subscription management
 */

export const getPlans = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const plans = [
      {
        id: 'free',
        name: 'Free',
        price: 0,
        currency: 'INR',
        interval: 'month',
        features: [
          '10 diagrams',
          '5 AI generations',
          '5 version history',
          'Export with watermark',
          'No custom templates',
          '50 MB storage',
        ],
      },
      {
        id: 'starter',
        name: 'Starter',
        price: 20,
        currency: 'INR',
        interval: 'month',
        popular: false,
        features: [
          '25 diagrams',
          '20 AI generations',
          '10 version history',
          'Export with watermark',
          '2 custom templates',
          '200 MB storage',
        ],
      },
      {
        id: 'basic',
        name: 'Basic',
        price: 40,
        currency: 'INR',
        interval: 'month',
        popular: true,
        features: [
          '50 diagrams',
          '50 AI generations',
          '15 version history',
          'Export without watermark',
          '5 custom templates',
          '500 MB storage',
        ],
      },
    ];

    res.json({ success: true, data: plans });
  } catch (err) {
    next(err);
  }
};

export const getSubscription = async (req: any, res: Response, next: NextFunction) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      throw new ApiError(404, 'NOT_FOUND', 'User not found');
    }
    
    res.json({
      success: true,
      data: {
        plan: user.plan,
        planExpiresAt: user.planExpiresAt,
        isTrial: user.isTrial,
        trialEndsAt: user.trialEndsAt,
        razorpaySubscriptionId: user.razorpaySubscriptionId,
        razorpayCustomerId: user.razorpayCustomerId,
      },
    });
  } catch (err) {
    next(err);
  }
};

export const subscribe = async (req: any, res: Response, next: NextFunction) => {
  try {
    const { planId } = req.body;
    console.log('[Billing] Subscribe request for user:', req.userId, 'plan:', planId);
    
    // Valid paid plans: starter (₹20), basic (₹40)
    if (!['starter', 'basic'].includes(planId)) {
      throw new ApiError(400, 'VALIDATION_ERROR', 'Invalid plan ID');
    }

    const subscription = await billingService.createSubscription(req.userId, planId);
    console.log('[Billing] Subscription created:', subscription.subscriptionId);
    
    res.json({
      success: true,
      data: subscription,
    });
  } catch (err: any) {
    console.error('[Billing] Subscribe error:', err?.message || err);
    next(err);
  }
};

export const cancelSubscription = async (req: any, res: Response, next: NextFunction) => {
  try {
    await billingService.cancelSubscription(req.userId);
    
    res.json({
      success: true,
      message: 'Subscription cancelled successfully',
    });
  } catch (err) {
    next(err);
  }
};

export const getPortalLink = async (req: any, res: Response, next: NextFunction) => {
  try {
    // Razorpay doesn't have a built-in customer portal
    // Return subscription management URL from frontend
    res.json({
      success: true,
      data: {
        portalUrl: `${process.env.FRONTEND_URL}/settings/billing`,
      },
    });
  } catch (err) {
    next(err);
  }
};

export const handleWebhook = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const signature = req.headers['x-razorpay-signature'] as string;
    const payload = req.body;

    await billingService.handleWebhook(payload, signature);
    
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};

/**
 * §BILL-05 Verify payment after checkout
 * Called by frontend after successful Razorpay payment to confirm and activate subscription
 */
export const verifyPayment = async (req: any, res: Response, next: NextFunction) => {
  try {
    const { razorpayPaymentId, razorpaySubscriptionId, razorpaySignature } = req.body;
    
    console.log('[Billing] Verify payment request:', {
      userId: req.userId,
      razorpayPaymentId,
      razorpaySubscriptionId,
      hasSignature: !!razorpaySignature
    });
    
    if (!razorpayPaymentId || !razorpaySubscriptionId) {
      throw new ApiError(400, 'VALIDATION_ERROR', 'Missing payment or subscription ID');
    }

    const result = await billingService.verifyAndActivateSubscription(
      req.userId,
      razorpayPaymentId,
      razorpaySubscriptionId,
      razorpaySignature
    );
    
    console.log('[Billing] Payment verified successfully:', result);
    
    res.json({
      success: true,
      data: result,
    });
  } catch (err) {
    console.error('[Billing] Verify payment error:', err);
    next(err);
  }
};
