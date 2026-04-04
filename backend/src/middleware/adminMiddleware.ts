import { Request, Response, NextFunction } from 'express';
import supabase from '../lib/supabase';

/**
 * Middleware to ensure the user is an ADMIN
 */
export const adminGuard = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.headers['x-user-id'] || req.body.userId || req.query.userId;

    if (!userId) {
      return res.status(401).json({ error: 'User registration ID required for admin check' });
    }

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', userId)
      .single();

    if (error || !profile || !profile.is_admin) {
      return res.status(403).json({ error: 'Access denied. Administrator privileges required.' });
    }

    next();
  } catch (error: any) {
    console.error('❌ Admin Guard Error:', error.message);
    res.status(500).json({ error: 'Internal server error checking admin privileges' });
  }
};
