import { Router } from 'express';
import { stripeController } from '../controllers/stripeController';
import express from 'express';

const router = Router();

// Create checkout session
router.post('/create-checkout-session', stripeController.createCheckoutSession);

// Get user subscription status
router.get('/subscription/:userId', stripeController.getUserSubscription);

export default router;
