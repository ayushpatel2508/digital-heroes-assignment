import { Router } from 'express';
import { scoreController } from '../controllers/scoreController';
import { subscriptionGuard } from '../middleware/subscriptionMiddleware';

const router = Router();

/**
 * GET /api/scores/:userId
 * Get rolling 5 scores for a user
 * Public-ish: used by dashboard after auth check on frontend
 */
router.get('/:userId', scoreController.getRollingScores);

/**
 * POST /api/scores
 * Add a new score — requires active subscription
 */
router.post('/', subscriptionGuard, scoreController.addScore);

/**
 * DELETE /api/scores/:id
 * Delete a score — subscription guard (only active member should delete their own scores)
 */
router.delete('/:id', scoreController.deleteScore);

export default router;
