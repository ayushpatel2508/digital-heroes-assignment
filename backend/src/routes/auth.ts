import { Router, Request, Response } from 'express';
import supabase from '../lib/supabase';

const router = Router();

/**
 * @route POST /api/auth/sync-profile
 * @desc Create or update user profile after Supabase signup
 */
router.post('/sync-profile', async (req: Request, res: Response) => {
  const { userId, fullName, email, isAdmin } = req.body;

  if (!userId) {
    return res.status(400).json({ error: 'User ID is required' });
  }

  try {
    // Upsert the profile in the public.profiles table
    // Using service_role key (initialized in lib/supabase.ts) to bypass RLS
    const { data, error } = await supabase
      .from('profiles')
      .upsert({
        id: userId,
        full_name: fullName,
        is_admin: isAdmin || false,
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error(' Supabase Sync Error:', error.message);
      return res.status(500).json({ error: error.message });
    }

    console.log(` Profile synced for user: ${userId}`);
    res.status(200).json({
      message: 'Profile synced successfully',
      profile: data
    });
  } catch (error: any) {
    console.error('Sync Profile Catch Error:', error.message);
    res.status(500).json({ error: 'Internal server error during profile sync' });
  }
});

export default router;
