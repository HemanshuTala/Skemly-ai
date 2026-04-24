import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.middleware';
import * as BillingController from '../controllers/billing.controller';

const router = Router();

/**
 * §13 Billing & Subscription routes
 */
router.get('/plans', BillingController.getPlans);
router.get('/subscription', authenticateToken, BillingController.getSubscription);
router.post('/subscribe', authenticateToken, BillingController.subscribe);
router.post('/verify-payment', authenticateToken, BillingController.verifyPayment);
router.post('/cancel', authenticateToken, BillingController.cancelSubscription);
router.post('/portal', authenticateToken, BillingController.getPortalLink);
router.post('/webhook', BillingController.handleWebhook); // No auth - uses signature verification

export default router;
