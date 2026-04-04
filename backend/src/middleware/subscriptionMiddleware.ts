import { Request, Response, NextFunction } from 'express';
import { subscriptionService } from '../services/subscriptionService';

/**
 * Middleware to ensure the user has an ACTIVE subscription
 */
export const subscriptionGuard = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.body.userId || req.query.userId || req.params.userId;

    if (!userId) {
      return res.status(401).json({ error: 'User ID required for subscription check' });
    }

    const subscription = await subscriptionService.getSubscriptionByUserId(userId as string);

    if (!subscription || subscription.status !== 'active') {
      return res.status(403).json({ 
        error: 'Active subscription required',
        code: 'SUBSCRIPTION_REQUIRED'
      });
    }

    next();
  } catch (error: any) {
    console.error('❌ Subscription Guard Error:', error.message);
    res.status(500).json({ error: 'Internal server error checking subscription status' });
  }
};
