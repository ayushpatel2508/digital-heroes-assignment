import { Request, Response } from 'express';
import { charityService } from '../services/charityService';

export const charityController = {
  /**
   * Get all charities
   */
  async getAllCharities(_req: Request, res: Response) {
    try {
      const charities = await charityService.getAllCharities();
      res.status(200).json({ charities });
    } catch (error: any) {
      console.error('❌ Error in getAllCharities:', error.message);
      res.status(500).json({ error: 'Failed to fetch charities' });
    }
  },

  /**
   * Get user's selected charity
   */
  async getUserCharity(req: Request, res: Response) {
    try {
      const { userId } = req.params;
      const data = await charityService.getUserCharity(userId as string);
      res.status(200).json(data);
    } catch (error: any) {
      console.error('❌ Error in getUserCharity:', error.message);
      res.status(500).json({ error: 'Failed to fetch user charity' });
    }
  },

  /**
   * Select a charity for the user
   */
  async selectCharity(req: Request, res: Response) {
    try {
      const { userId, charityId, donationPercentage } = req.body;

      if (!userId || !charityId) {
        return res.status(400).json({ error: 'userId and charityId are required' });
      }

      // Validate donation percentage
      const percentage = donationPercentage || 10;
      if (percentage < 10 || percentage > 100) {
        return res.status(400).json({ error: 'Donation percentage must be between 10% and 100%' });
      }

      const data = await charityService.selectCharity(userId, charityId, percentage);
      res.status(200).json({ message: 'Charity selected successfully', data });
    } catch (error: any) {
      console.error('❌ Error in selectCharity:', error.message);
      res.status(500).json({ error: 'Failed to select charity' });
    }
  }
};
