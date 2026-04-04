import { Router } from 'express';
import { charityController } from '../controllers/charityController';

const router = Router();

/**
 * GET /api/charities
 * Get all active charities — public
 */
router.get('/', charityController.getAllCharities);

/**
 * GET /api/charities/user/:userId
 * Get user's selected charity
 */
router.get('/user/:userId', charityController.getUserCharity);

/**
 * POST /api/charities/select
 * User selects a charity (updates user_charities table)
 */
router.post('/select', charityController.selectCharity);

export default router;
