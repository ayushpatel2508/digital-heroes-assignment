import { Request, Response } from 'express';
import { drawService } from '../services/drawService';
import supabase from '../lib/supabase';

export const drawController = {
  /**
   * Get draw results with winner statistics (public)
   */
  async getDrawResults(req: Request, res: Response) {
    try {
      // Fetch published draws with winners
      const { data: draws, error } = await supabase
        .from('monthly_draws')
        .select('id, draw_month, winning_numbers, status, created_at')
        .eq('status', 'published')
        .order('draw_month', { ascending: false })
        .limit(12);

      if (error) throw error;

      // For each draw, get winner statistics
      const drawsWithStats = await Promise.all((draws || []).map(async (draw) => {
        const { data: winners } = await supabase
          .from('winners')
          .select('match_type, prize_amount')
          .eq('draw_id', draw.id);

        // Group by match type
        const stats: Record<string, { count: number; total_prize: number }> = {};
        
        (winners || []).forEach(w => {
          if (!stats[w.match_type]) {
            stats[w.match_type] = { count: 0, total_prize: 0 };
          }
          const matchStats = stats[w.match_type];
          if (matchStats) {
            matchStats.count++;
            matchStats.total_prize += w.prize_amount;
          }
        });

        // Convert to array
        const winnersArray = Object.entries(stats).map(([match_type, data]) => ({
          match_type,
          count: data.count,
          total_prize: data.total_prize
        }));

        return {
          ...draw,
          winners: winnersArray
        };
      }));

      res.json(drawsWithStats);
    } catch (error: any) {
      console.error('❌ Error fetching draw results:', error.message);
      res.status(500).json({ error: 'Failed to fetch draw results' });
    }
  },

  /**
   * Admin-only: Generate a draft draw
   */
  async generateDraw(req: Request, res: Response) {
    try {
      const { month, type } = req.body; // e.g., '2026-04-01', 'random'

      if (!month) {
        return res.status(400).json({ error: 'Month is required' });
      }

      // 1. Generate winning numbers
      const winningNumbers = await drawService.generateWinningNumbers(type || 'random');

      // 2. Save as draft
      const { data, error } = await supabase
        .from('monthly_draws')
        .insert({
          draw_month: month,
          winning_numbers: winningNumbers,
          draw_type: type || 'random',
          status: 'draft',
        })
        .select()
        .single();

      if (error) {
        console.error('❌ Error generating draw:', error.message);
        return res.status(500).json({ error: 'Failed to generate draw' });
      }

      res.status(201).json({
        message: 'Draft draw generated successfully',
        draw: data,
      });
    } catch (error: any) {
      console.error('❌ Error in generateDraw controller:', error.message);
      res.status(500).json({ error: 'Internal server error while generating draw' });
    }
  },

  /**
   * Admin-only: Publish and match winners
   */
  async publishDraw(req: Request, res: Response) {
    try {
      const id = req.params.id as string;
      const { month } = req.body;

      if (!id || !month) {
        return res.status(400).json({ error: 'Draw ID and Month are required' });
      }

      const results = await drawService.finalizeDraw(id, month);

      res.status(200).json({
        message: 'Draw published successfully',
        results,
      });
    } catch (error: any) {
      console.error('❌ Error in publishDraw controller:', error.message);
      res.status(500).json({ error: 'Internal server error while publishing draw' });
    }
  },

  /**
   * Public: Get latest published draw
   */
  async getLatestDraw(req: Request, res: Response) {
    try {
      const { data, error } = await supabase
        .from('monthly_draws')
        .select('*')
        .eq('status', 'published')
        .order('published_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        throw error;
      }

      if (!data) {
        return res.status(404).json({ message: 'No published draws found' });
      }

      // Also fetch prize pool info for this month
      const { data: poolData } = await supabase
        .from('prize_pools')
        .select('*')
        .eq('draw_month', data.draw_month)
        .maybeSingle();

      res.status(200).json({
        draw: data,
        prizePool: poolData
      });
    } catch (error: any) {
      console.error('❌ Error fetching latest draw:', error.message);
      res.status(500).json({ error: 'Internal server error while fetching latest draw' });
    }
  },

  /**
   * Public: Get all prize pools by month
   */
  async getPrizePools(req: Request, res: Response) {
    try {
      const { data, error } = await supabase
        .from('prize_pools')
        .select('*')
        .order('draw_month', { ascending: false })
        .limit(12); // Last 12 months

      if (error) {
        throw error;
      }

      res.status(200).json(data || []);
    } catch (error: any) {
      console.error('❌ Error fetching prize pools:', error.message);
      res.status(500).json({ error: 'Internal server error while fetching prize pools' });
    }
  },

  /**
   * Admin-only: Simulate a winning draw for a specific user
   */
  async simulateWin(req: Request, res: Response) {
    try {
      const { userId, month } = req.body;

      if (!userId || !month) {
        return res.status(400).json({ error: 'User ID and Month are required' });
      }

      const results = await drawService.simulateWinForUser(userId, month);

      res.status(200).json({
        message: 'Win simulated successfully',
        results,
      });
    } catch (error: any) {
      console.error('❌ Error in simulateWin controller:', error.message);
      res.status(500).json({ error: error.message || 'Failed to simulate win' });
    }
  }
};
