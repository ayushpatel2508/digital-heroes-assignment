import { Router } from 'express';
import { drawController } from '../controllers/drawController';
import { adminGuard } from '../middleware/adminMiddleware';

const router = Router();

/**
 * @route   GET /api/draws/results
 * @desc    Public: Get published draw results with winner statistics
 * @access  Public
 */
router.get('/results', drawController.getDrawResults);

/**
 * @route   POST /api/draws/generate
 * @desc    Admin: Generate a draft draw for a given month
 * @access  Private (Admin)
 */
router.post('/generate', adminGuard, drawController.generateDraw);

/**
 * @route   POST /api/draws/:id/publish
 * @desc    Admin: Finalize draw, calculate & record winners
 * @access  Private (Admin)
 */
router.post('/:id/publish', adminGuard, drawController.publishDraw);

/**
 * @route   GET /api/draws/latest
 * @desc    Public: Fetch latest published draw & prize pool
 * @access  Public
 */
router.get('/latest', drawController.getLatestDraw);

/**
 * @route   GET /api/draws/prize-pools
 * @desc    Public: Fetch all prize pools by month
 * @access  Public
 */
router.get('/prize-pools', drawController.getPrizePools);

/**
 * @route   POST /api/draws/simulate-win
 * @desc    Admin: Force a winning draw for a specific user
 * @access  Private (Admin)
 */
router.post('/simulate-win', adminGuard, drawController.simulateWin);

export default router;
