import Razorpay from 'razorpay';
import crypto from 'crypto';
import { User } from '../models/user.model';
import { ApiError } from '../middleware/errorHandler';
import logger from '../utils/logger';

type AppPlanId = 'starter' | 'basic';

type PlanConfig = {
  id: AppPlanId;
  name: string;
  amountInPaise: number;
  description: string;
};

/**
 * §13 Billing & Subscription Service
 * Razorpay integration for subscription management
 */
class BillingService {
  private razorpay: Razorpay | null = null;
  private webhookSecret: string;
  private readonly planConfigs: Record<AppPlanId, PlanConfig> = {
    starter: {
      id: 'starter',
      name: 'Skemly Starter Monthly',
      amountInPaise: 2000,  // ₹20
      description: 'Skemly Starter plan billed monthly',
    },
    basic: {
      id: 'basic',
      name: 'Skemly Basic Monthly',
      amountInPaise: 4000,  // ₹40
      description: 'Skemly Basic plan billed monthly',
    },
  };

  constructor() {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    this.webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || '';

    if (keyId && keySecret && 
        keyId !== 'your-razorpay-key-id' && 
        keySecret !== 'your-razorpay-key-secret') {
      this.razorpay = new Razorpay({
        key_id: keyId,
        key_secret: keySecret,
      });
      logger.info('✅ Razorpay client initialized');
    } else {
      logger.warn('⚠️  Razorpay not configured - billing features disabled');
    }
  }

  private checkRazorpayAvailable(): void {
    if (!this.razorpay) {
      throw new ApiError(503, 'BILLING_UNAVAILABLE', 'Billing service is not configured. Please add Razorpay credentials to environment variables.');
    }
  }

  /**
   * §BILL-01 Create subscription
   */
  async createSubscription(
    userId: string,
    planId: AppPlanId
  ): Promise<{ subscriptionId: string; shortUrl: string; returnUrl: string }> {
    this.checkRazorpayAvailable();

    const user = await User.findById(userId);
    if (!user) {
      throw new ApiError(404, 'NOT_FOUND', 'User not found');
    }

    // Check if user already has an active subscription
    if (user.plan !== 'free' && user.planExpiresAt && user.planExpiresAt > new Date()) {
      throw new ApiError(400, 'ALREADY_SUBSCRIBED', `You already have an active ${user.plan} subscription. Please cancel it first before subscribing to a new plan.`);
    }

    let customerId = user.razorpayCustomerId;
    if (!customerId) {
      try {
        const customer = await this.razorpay!.customers.create({
          name: user.name || 'Skemly User', // Provide a fallback if name is empty
          email: user.email,
          fail_existing: '0',
        } as any);
        customerId = customer.id;
        user.razorpayCustomerId = customerId;
        await user.save();
      } catch (error: any) {
        const errorMessage = error?.error?.description || error?.message || 'Failed to create Razorpay customer';
        
        // If customer already exists and fail_existing didn't work, fetch manually via Axios
        if (errorMessage.toLowerCase().includes('already exists')) {
          logger.info(`Customer already exists for email ${user.email}, fetching via direct API...`);
          try {
            const keyId = process.env.RAZORPAY_KEY_ID;
            const keySecret = process.env.RAZORPAY_KEY_SECRET;
            
            const authHeader = 'Basic ' + Buffer.from(`${keyId!}:${keySecret!}`).toString('base64');
            const response = await fetch(`https://api.razorpay.com/v1/customers?email=${encodeURIComponent(user.email)}`, {
              headers: {
                'Authorization': authHeader
              }
            });
            
            const responseData = await response.json();
            
            if (responseData && responseData.items && responseData.items.length > 0) {
              customerId = responseData.items[0].id;
              user.razorpayCustomerId = customerId;
              await user.save();
              logger.info(`Recovered existing customer ID: ${customerId}`);
            } else {
              throw new ApiError(400, 'PAYMENT_ERROR', 'Customer exists but could not be retrieved.');
            }
          } catch (fetchError: any) {
            logger.error('Failed to fetch existing Razorpay customer:', fetchError?.message);
            throw new ApiError(400, 'PAYMENT_ERROR', 'Customer already exists, but recovery failed.');
          }
        } else {
          logger.error('Razorpay customer create error:', error);
          throw new ApiError(400, 'PAYMENT_ERROR', errorMessage);
        }
      }
    }

    const razorpayPlanId = await this.resolveRazorpayPlanId(planId);

    // Create subscription
    // Note: Razorpay doesn't allow callback_url in subscription.create
    // The redirect happens automatically when using subscription.short_url
    let subscription;
    try {
      subscription = await this.razorpay!.subscriptions.create({
        plan_id: razorpayPlanId,
        customer_id: customerId,
        total_count: 12, // 12 months
        quantity: 1,
        customer_notify: 1, // Send email/SMS notifications
        notes: {
          userId: userId,
          planId: planId,
          customerId,
        },
      } as any);
    } catch (error: any) {
      logger.error('Razorpay subscription create error:', error);
      const errorMessage = error?.error?.description || error?.message || 'Failed to create Razorpay subscription';
      throw new ApiError(400, 'PAYMENT_ERROR', errorMessage);
    }

    // Update user record
    user.razorpaySubscriptionId = subscription.id;
    await user.save();

    logger.info(`Subscription created for user ${userId}: ${subscription.id}`);

    const returnUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

    return {
      subscriptionId: subscription.id,
      shortUrl: subscription.short_url,
      returnUrl: `${returnUrl}/settings`,
    };
  }

  private async resolveRazorpayPlanId(planId: AppPlanId): Promise<string> {
    this.checkRazorpayAvailable();
    const cfg = this.planConfigs[planId];

    let existing;
    try {
      existing = await this.razorpay!.plans.all({ count: 100 });
    } catch (error: any) {
      logger.error('Razorpay plans fetch error:', error);
      const errorMessage = error?.error?.description || error?.message || 'Failed to fetch Razorpay plans';
      throw new ApiError(400, 'PAYMENT_ERROR', errorMessage);
    }
    const matched = existing.items?.find((plan: any) => {
      const notesPlanId = plan.notes?.appPlanId;
      return (
        notesPlanId === planId &&
        plan.period === 'monthly' &&
        plan.interval === 1 &&
        plan.item?.amount === cfg.amountInPaise
      );
    });

    if (matched?.id) {
      return matched.id;
    }

    // Create a plan automatically when none exists.
    let created;
    try {
      created = await this.razorpay!.plans.create({
        period: 'monthly',
        interval: 1,
        item: {
          name: cfg.name,
          amount: cfg.amountInPaise,
          currency: 'INR',
          description: cfg.description,
        },
        notes: {
          appPlanId: cfg.id,
        },
      } as any);
    } catch (error: any) {
      logger.error('Razorpay plan create error:', error);
      const errorMessage = error?.error?.description || error?.message || 'Failed to create Razorpay plan';
      throw new ApiError(400, 'PAYMENT_ERROR', errorMessage);
    }

    logger.info(`Created Razorpay plan for ${planId}: ${created.id}`);
    return created.id;
  }

  /**
   * §BILL-02 Cancel subscription
   */
  async cancelSubscription(userId: string): Promise<void> {
    this.checkRazorpayAvailable();

    const user = await User.findById(userId);
    if (!user) {
      throw new ApiError(404, 'NOT_FOUND', 'User not found');
    }

    if (!user.razorpaySubscriptionId) {
      throw new ApiError(400, 'NO_SUBSCRIPTION', 'No active subscription found');
    }

    // Cancel subscription at end of billing period
    await this.razorpay!.subscriptions.cancel(user.razorpaySubscriptionId, false);

    logger.info(`Subscription cancelled for user ${userId}`);
  }

  /**
   * §BILL-03 Handle Razorpay webhooks
   */
  async handleWebhook(payload: any, signature: string): Promise<void> {
    // Verify webhook signature
    if (this.webhookSecret) {
      const expectedSignature = crypto
        .createHmac('sha256', this.webhookSecret)
        .update(JSON.stringify(payload))
        .digest('hex');

      if (signature !== expectedSignature) {
        throw new ApiError(401, 'INVALID_SIGNATURE', 'Invalid webhook signature');
      }
    }

    const event = payload.event;
    const subscriptionData = payload.payload?.subscription?.entity;
    const paymentData = payload.payload?.payment?.entity;

    logger.info(`Razorpay webhook received: ${event}`);

    switch (event) {
      case 'subscription.activated':
        await this.handleSubscriptionActivated(subscriptionData);
        break;

      case 'subscription.charged':
        await this.handleSubscriptionCharged(subscriptionData, paymentData);
        break;

      case 'subscription.cancelled':
        await this.handleSubscriptionCancelled(subscriptionData);
        break;

      case 'subscription.completed':
        await this.handleSubscriptionCompleted(subscriptionData);
        break;

      case 'subscription.paused':
      case 'subscription.resumed':
        logger.info(`Subscription ${event}: ${subscriptionData?.id}`);
        break;

      default:
        logger.warn(`Unhandled webhook event: ${event}`);
    }
  }

  /**
   * Handle subscription.activated event
   */
  private async handleSubscriptionActivated(subscription: any): Promise<void> {
    const userId = subscription.notes?.userId;
    const planId = subscription.notes?.planId;

    if (!userId || !planId) {
      logger.error('Missing userId or planId in subscription notes');
      return;
    }

    const user = await User.findById(userId);
    if (!user) {
      logger.error(`User not found: ${userId}`);
      return;
    }

    // Upgrade user plan
    user.plan = planId;
    user.planExpiresAt = new Date(subscription.current_end * 1000);
    user.isTrial = false;
    await user.save();

    logger.info(`User ${userId} upgraded to ${planId}`);
  }

  /**
   * Handle subscription.charged event
   */
  private async handleSubscriptionCharged(subscription: any, payment: any): Promise<void> {
    const userId = subscription.notes?.userId;

    if (!userId) {
      logger.error('Missing userId in subscription notes');
      return;
    }

    const user = await User.findById(userId);
    if (!user) {
      logger.error(`User not found: ${userId}`);
      return;
    }

    // Extend subscription period
    user.planExpiresAt = new Date(subscription.current_end * 1000);
    await user.save();

    logger.info(`Subscription charged for user ${userId}: ${payment?.id}`);
  }

  /**
   * Handle subscription.cancelled event
   */
  private async handleSubscriptionCancelled(subscription: any): Promise<void> {
    const userId = subscription.notes?.userId;

    if (!userId) {
      logger.error('Missing userId in subscription notes');
      return;
    }

    const user = await User.findById(userId);
    if (!user) {
      logger.error(`User not found: ${userId}`);
      return;
    }

    // Downgrade to free plan at end of billing period
    // Keep current plan active until planExpiresAt
    logger.info(`Subscription will end for user ${userId} at ${user.planExpiresAt}`);
  }

  /**
   * Handle subscription.completed event
   */
  private async handleSubscriptionCompleted(subscription: any): Promise<void> {
    const userId = subscription.notes?.userId;

    if (!userId) {
      logger.error('Missing userId in subscription notes');
      return;
    }

    const user = await User.findById(userId);
    if (!user) {
      logger.error(`User not found: ${userId}`);
      return;
    }

    // Downgrade to free plan
    user.plan = 'free';
    user.razorpaySubscriptionId = null;
    await user.save();

    logger.info(`User ${userId} downgraded to free plan`);
  }

  /**
   * §BILL-05 Verify and activate subscription after payment
   * Called by frontend after successful Razorpay checkout
   */
  async verifyAndActivateSubscription(
    userId: string,
    razorpayPaymentId: string,
    razorpaySubscriptionId: string,
    razorpaySignature?: string
  ): Promise<{ success: boolean; plan: string; message: string }> {
    this.checkRazorpayAvailable();

    const user = await User.findById(userId);
    if (!user) {
      throw new ApiError(404, 'NOT_FOUND', 'User not found');
    }

    // Verify the payment belongs to this user
    if (user.razorpaySubscriptionId !== razorpaySubscriptionId) {
      throw new ApiError(403, 'FORBIDDEN', 'Subscription does not belong to user');
    }

    try {
      // Fetch payment details from Razorpay
      logger.info(`[Billing] Fetching payment ${razorpayPaymentId} for user ${userId}`);
      const payment = await this.razorpay!.payments.fetch(razorpayPaymentId);
      logger.info(`[Billing] Payment status: ${payment.status}`);
      
      // For Razorpay hosted checkout, payment might already be captured
      // We accept both 'captured' and 'authorized' statuses
      if (payment.status !== 'captured' && payment.status !== 'authorized') {
        throw new ApiError(400, 'PAYMENT_NOT_CAPTURED', `Payment status is ${payment.status}`);
      }

      // Fetch subscription details from Razorpay
      logger.info(`[Billing] Fetching subscription ${razorpaySubscriptionId}`);
      const subscription = await this.razorpay!.subscriptions.fetch(razorpaySubscriptionId);
      logger.info(`[Billing] Subscription status: ${subscription.status}, notes:`, subscription.notes);
      
      // Verify signature if provided (for inline checkout)
      if (razorpaySignature && this.webhookSecret) {
        const body = razorpayPaymentId + '|' + razorpaySubscriptionId;
        const expectedSignature = crypto
          .createHmac('sha256', this.webhookSecret)
          .update(body)
          .digest('hex');
        
        if (razorpaySignature !== expectedSignature) {
          logger.warn(`[Billing] Invalid payment signature for user ${userId}`);
        } else {
          logger.info(`[Billing] Payment signature verified for user ${userId}`);
        }
      }

      // Extract plan from subscription notes
      let planId = subscription.notes?.planId as AppPlanId;
      logger.info(`[Billing] Plan ID from subscription notes: ${planId}`);
      
      if (!planId || !['starter', 'basic'].includes(planId)) {
        // Fallback: try to get plan from user's pending subscription
        const userPlan = user.plan !== 'free' ? user.plan : null;
        if (userPlan && ['starter', 'basic'].includes(userPlan)) {
          logger.info(`[Billing] Using user's current plan as fallback: ${userPlan}`);
          planId = userPlan as AppPlanId;
        } else {
          throw new ApiError(400, 'INVALID_PLAN', `Invalid plan in subscription: ${planId}`);
        }
      }

      const finalPlanId = planId;

      // Activate the subscription
      user.plan = finalPlanId;
      user.planExpiresAt = subscription.current_end 
        ? new Date(subscription.current_end * 1000) 
        : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // Default 30 days
      user.isTrial = false;
      await user.save();

      logger.info(`[Billing] Subscription activated for user ${userId}: ${finalPlanId}`);

      return {
        success: true,
        plan: finalPlanId,
        message: 'Subscription activated successfully',
      };
    } catch (error: any) {
      if (error instanceof ApiError) throw error;
      
      logger.error(`[Billing] Payment verification failed for user ${userId}: ${error.message}`);
      logger.error(`[Billing] Error stack:`, error.stack);
      throw new ApiError(500, 'VERIFICATION_FAILED', `Failed to verify payment: ${error.message}`);
    }
  }

  /**
   * Check and downgrade expired subscriptions (cron job)
   */
  async checkExpiredSubscriptions(): Promise<void> {
    const expiredUsers = await User.find({
      plan: { $in: ['starter', 'basic'] },
      planExpiresAt: { $lt: new Date() },
    });

    for (const user of expiredUsers) {
      user.plan = 'free';
      user.razorpaySubscriptionId = null;
      await user.save();
      logger.info(`User ${user._id} downgraded to free plan (expired)`);
    }
  }
}

export const billingService = new BillingService();
