import { Request, Response, NextFunction } from 'express';
import supabase from '../lib/supabase';

/**
 * Middleware to verify the Supabase JWT from the Authorization header.
 * Sets req.userId for downstream handlers.
 */
export const authGuard = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authorization header required' });
    }

    const token = authHeader.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    // Attach userId to the request for downstream use
    (req as any).userId = user.id;
    next();
  } catch (error: any) {
    console.error('❌ Auth Guard Error:', error.message);
    res.status(500).json({ error: 'Internal server error during authentication' });
  }
};
