import { Request, Response } from 'express';
import { scoreService } from '../services/scoreService';

export const scoreController = {
  /**
   * Add a new score
   */
  async addScore(req: Request, res: Response) {
    try {
      const { userId, scoreValue, scoreDate } = req.body;

      if (!userId || scoreValue === undefined || !scoreDate) {
        return res.status(400).json({ error: 'Missing required parameters' });
      }

      // Validating score value (1-45 as per project requirements)
      if (scoreValue < 1 || scoreValue > 45) {
        return res.status(400).json({ error: 'Score must be between 1 and 45' });
      }

      const data = await scoreService.addScore(userId, scoreValue, scoreDate);

      res.status(201).json({
        message: 'Score added successfully',
        score: data
      });
    } catch (error: any) {
      console.error('❌ Error in addScore controller:', error.message);
      res.status(500).json({ error: 'Internal server error while adding score' });
    }
  },

  /**
   * Get user's rolling 5 scores
   */
  async getRollingScores(req: Request, res: Response) {
    try {
      const { userId } = req.params;

      if (!userId) {
        return res.status(400).json({ error: 'User ID is required' });
      }

      const data = await scoreService.getRollingScores(userId as string);

      res.status(200).json({
        message: 'Recent scores fetched successfully',
        scores: data
      });
    } catch (error: any) {
      console.error('❌ Error in getRollingScores controller:', error.message);
      res.status(500).json({ error: 'Internal server error while fetching scores' });
    }
  },

  /**
   * Delete a score
   */
  async deleteScore(req: Request, res: Response) {
    try {
      const { id } = req.params; // Score ID
      const { userId } = req.query; // User ID from query

      if (!id || !userId) {
        return res.status(400).json({ error: 'Missing required parameters' });
      }

      await scoreService.deleteScore(id as string, userId as string);

      res.status(200).json({ message: 'Score deleted successfully' });
    } catch (error: any) {
      console.error('❌ Error in deleteScore controller:', error.message);
      res.status(500).json({ error: 'Internal server error while deleting score' });
    }
  }
};
