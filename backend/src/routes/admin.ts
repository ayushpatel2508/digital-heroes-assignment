import { Router, Request, Response } from 'express';
import { adminGuard } from '../middleware/adminMiddleware';
import supabase from '../lib/supabase';

const router = Router();

// All routes in this file require admin privileges
router.use(adminGuard);

// ── STATS ─────────────────────────────────────────────────────────────────────

/**
 * GET /api/admin/stats
 * Aggregated platform stats for admin command centre
 * Shows total, reserved (pending payouts), and available prize pool
 */
router.get('/stats', async (_req: Request, res: Response) => {
  console.log('📊 Fetching admin stats...');
  try {
    const [
      { count: totalUsers },
      { count: activeSubscribers },
      { data: prizePoolData },
      { count: pendingVerifications },
      { data: winnersData },
      { data: totalWinningsData },
      { data: pendingPayouts },
      { data: allWinners }
    ] = await Promise.all([
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('subscriptions').select('*', { count: 'exact', head: true }).eq('status', 'active'),
      supabase.from('prize_pools').select('total_pool'),
      supabase.from('winners').select('*', { count: 'exact', head: true }).eq('verification_status', 'pending'),
      supabase.from('winners').select('id, prize_amount, match_type, verification_status, payment_status, created_at, user_id, draw_id').order('created_at', { ascending: false }).limit(5),
      supabase.from('winners').select('prize_amount, payment_status'),
      supabase.from('winners').select('prize_amount').eq('payment_status', 'pending').eq('verification_status', 'approved'),
      supabase.from('winners').select('match_type')
    ]);

    // Sum all prize pools from prize_pools table
    const totalPrizePool = (prizePoolData || []).reduce((sum: number, p: any) => sum + (Number(p.total_pool) || 0), 0);
    
    // Calculate total winnings paid out
    const totalWinnings = (totalWinningsData || [])
      .filter((w: any) => w.payment_status === 'paid')
      .reduce((sum: number, w: any) => sum + (Number(w.prize_amount) || 0), 0);

    // Calculate pending winnings (all unpaid winners)
    const pendingWinnings = (totalWinningsData || [])
      .filter((w: any) => w.payment_status === 'pending')
      .reduce((sum: number, w: any) => sum + (Number(w.prize_amount) || 0), 0);

    // Calculate reserved amount (approved but not paid yet)
    const reservedAmount = (pendingPayouts || [])
      .reduce((sum: number, w: any) => sum + (Number(w.prize_amount) || 0), 0);

    // Available = Total Pool - Reserved
    const availablePrizePool = totalPrizePool - reservedAmount;

    // Count winners by match type
    const winnersByType: Record<string, number> = {
      '5-match': 0,
      '4-match': 0,
      '3-match': 0
    };
    
    (allWinners || []).forEach((w: any) => {
      if (w.match_type && winnersByType.hasOwnProperty(w.match_type)) {
        const count = winnersByType[w.match_type];
        if (typeof count === 'number') {
          winnersByType[w.match_type] = count + 1;
        }
      }
    });

    // Fetch profile and draw data for recent winners
    const recentWinners = await Promise.all((winnersData || []).map(async (winner) => {
      const [profileResult, drawResult] = await Promise.all([
        supabase.from('profiles').select('full_name').eq('id', winner.user_id).single(),
        supabase.from('monthly_draws').select('draw_month').eq('id', winner.draw_id).single()
      ]);

      return {
        ...winner,
        profiles: profileResult.data ? { full_name: profileResult.data.full_name } : null,
        monthly_draws: drawResult.data ? { draw_month: drawResult.data.draw_month } : null
      };
    }));

    console.log(`✅ Stats fetched: ${totalUsers} users, ${activeSubscribers} subs, £${totalPrizePool} total prize pool (£${reservedAmount} reserved)`);

    res.json({
      totalUsers: totalUsers || 0,
      activeSubscribers: activeSubscribers || 0,
      prizePool: Math.round(totalPrizePool * 100) / 100,
      availablePrizePool: Math.round(availablePrizePool * 100) / 100,
      reservedPrizePool: Math.round(reservedAmount * 100) / 100,
      pendingVerifications: pendingVerifications || 0,
      totalWinningsPaid: Math.round(totalWinnings * 100) / 100,
      pendingWinnings: Math.round(pendingWinnings * 100) / 100,
      recentWinners: recentWinners || [],
      fiveMatchWinners: winnersByType['5-match'] || 0,
      fourMatchWinners: winnersByType['4-match'] || 0,
      threeMatchWinners: winnersByType['3-match'] || 0
    });
  } catch (error: any) {
    console.error('❌ Stats error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/admin/prize-pools
 * Get prize pools for all months (for display)
 */
router.get('/prize-pools', async (_req: Request, res: Response) => {
  console.log('💰 Fetching prize pools by month...');
  try {
    const { data, error } = await supabase
      .from('prize_pools')
      .select('*')
      .order('draw_month', { ascending: false })
      .limit(12); // Last 12 months

    if (error) throw error;

    console.log(`✅ Fetched ${data?.length || 0} prize pools`);
    res.json(data || []);
  } catch (error: any) {
    console.error('❌ Prize pools error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// ── USER MANAGEMENT ───────────────────────────────────────────────────────────

/**
 * GET /api/admin/users
 * All users with their subscription and charity info, including emails from auth.users
 */
router.get('/users', async (req: Request, res: Response) => {
  const requesterId = req.headers['x-user-id'];
  console.log(`👥 Admin request for user list from: ${requesterId}`);

  try {
    // 1. Fetch profiles
    console.log('📡 Fetching profiles from public.profiles...');
    const { data: profiles, error: profileError, count } = await supabase
      .from('profiles')
      .select('id, full_name, is_admin, created_at', { count: 'exact' })
      .order('created_at', { ascending: false });

    if (profileError) {
      console.error('❌ Profile Query Error:', profileError.message, profileError.details);
      throw profileError;
    }

    console.log(`✅ Profiles found in DB: ${count || profiles?.length || 0}`);

    // 2. Fetch all auth users (emails)
    console.log('📡 Fetching emails from auth.users...');
    const { data: { users: authUsers }, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.warn('⚠️ Could not fetch auth users for emails:', authError.message);
    }

    // 3. Fetch all active subscriptions
    console.log('📡 Fetching active subscriptions...');
    const { data: allSubs, error: subError } = await supabase
      .from('subscriptions')
      .select('user_id, plan_type, status')
      .eq('status', 'active');

    if (subError) {
      console.warn('⚠️ Could not fetch subscriptions for list:', subError.message);
    }

    // 4. Merge data
    const enhancedProfiles = (profiles || []).map(profile => {
      const authUser = authUsers?.find(u => u.id === profile.id);
      const userSub = allSubs?.find(s => s.user_id === profile.id);
      
      return {
        ...profile,
        email: authUser?.email || 'N/A',
        subscriptions: userSub ? [userSub] : []
      };
    });

    console.log('✅ Final enhanced profiles count:', enhancedProfiles.length);
    res.json(enhancedProfiles);
  } catch (error: any) {
    console.error('❌ Admin Users Route Error:', error.message);
    res.status(500).json({ error: error.message || 'Internal server error fetching users' });
  }
});

/**
 * PATCH /api/admin/users/:id
 * Update a user's name or admin status
 */
router.patch('/users/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { full_name, is_admin } = req.body;
  const requesterId = req.headers['x-user-id'] as string;

  console.log(`👑 Admin ${requesterId} updating user ${id}:`, { full_name, is_admin });

  try {
    const updates: Record<string, any> = { updated_at: new Date().toISOString() };
    if (full_name !== undefined) updates.full_name = full_name;
    if (is_admin !== undefined) {
      updates.is_admin = is_admin;
      console.log(`🔄 ${is_admin ? 'Promoting' : 'Demoting'} user ${id} ${is_admin ? 'to' : 'from'} admin`);
    }

    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    
    console.log(`✅ User ${id} updated successfully`);
    res.json({ 
      message: `User updated successfully${is_admin !== undefined ? ` - ${is_admin ? 'promoted to admin' : 'admin privileges removed'}` : ''}`, 
      user: data 
    });
  } catch (error: any) {
    console.error(`❌ Error updating user ${id}:`, error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/admin/users/:id/promote
 * Promote a user to admin level
 */
router.post('/users/:id/promote', async (req: Request, res: Response) => {
  const { id } = req.params;
  const requesterId = req.headers['x-user-id'] as string;

  console.log(`👑 Admin ${requesterId} promoting user ${id} to admin`);

  try {
    // Check if user exists
    const { data: existingUser, error: fetchError } = await supabase
      .from('profiles')
      .select('id, full_name, is_admin')
      .eq('id', id)
      .single();

    if (fetchError || !existingUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (existingUser.is_admin) {
      return res.status(400).json({ error: 'User is already an admin' });
    }

    // Promote to admin
    const { data, error } = await supabase
      .from('profiles')
      .update({ 
        is_admin: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    console.log(`✅ User ${existingUser.full_name} (${id}) promoted to admin`);
    res.json({ 
      message: `${existingUser.full_name} has been promoted to admin`, 
      user: data 
    });
  } catch (error: any) {
    console.error(`❌ Error promoting user ${id}:`, error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/admin/users/:id/demote
 * Remove admin privileges from a user
 */
router.post('/users/:id/demote', async (req: Request, res: Response) => {
  const { id } = req.params;
  const requesterId = req.headers['x-user-id'] as string;

  console.log(`👑 Admin ${requesterId} demoting user ${id} from admin`);

  try {
    // Check if user exists and is admin
    const { data: existingUser, error: fetchError } = await supabase
      .from('profiles')
      .select('id, full_name, is_admin')
      .eq('id', id)
      .single();

    if (fetchError || !existingUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!existingUser.is_admin) {
      return res.status(400).json({ error: 'User is not an admin' });
    }

    // Prevent self-demotion
    if (id === requesterId) {
      return res.status(400).json({ error: 'You cannot demote yourself' });
    }

    // Remove admin privileges
    const { data, error } = await supabase
      .from('profiles')
      .update({ 
        is_admin: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    console.log(`✅ User ${existingUser.full_name} (${id}) demoted from admin`);
    res.json({ 
      message: `${existingUser.full_name} admin privileges have been removed`, 
      user: data 
    });
  } catch (error: any) {
    console.error(`❌ Error demoting user ${id}:`, error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/admin/users/:id
 * Soft-delete: deactivate subscription, keep profile
 */
router.delete('/users/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    await supabase
      .from('subscriptions')
      .update({ status: 'canceled', updated_at: new Date().toISOString() })
      .eq('user_id', id);

    res.json({ message: `User ${id} subscriptions canceled` });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ── SCORES (Admin view of ANY user's scores) ──────────────────────────────────

/**
 * GET /api/admin/users/:id/scores
 * Get rolling 5 scores for any user
 */
router.get('/users/:id/scores', async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const { data, error } = await supabase
      .from('scores')
      .select('*')
      .eq('user_id', id)
      .order('score_date', { ascending: false })
      .limit(5);

    if (error) throw error;
    res.json(data || []);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/admin/scores/:scoreId
 * Admin can delete any score
 */
router.delete('/scores/:scoreId', async (req: Request, res: Response) => {
  const { scoreId } = req.params;
  try {
    const { error } = await supabase.from('scores').delete().eq('id', scoreId);
    if (error) throw error;
    res.json({ message: 'Score deleted' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ── WINNER VERIFICATION ───────────────────────────────────────────────────────

/**
 * GET /api/admin/winners
 * All winners with user and draw info
 */
router.get('/winners', async (_req: Request, res: Response) => {
  try {
    const { data, error } = await supabase
      .from('winners')
      .select(`
        *,
        monthly_draws (draw_month, winning_numbers)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    // Get user names separately to avoid relationship issues
    const winnersWithUsers = await Promise.all((data || []).map(async (winner) => {
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', winner.user_id)
        .single();
      
      return {
        ...winner,
        profiles: profile ? { full_name: profile.full_name } : null
      };
    }));

    res.json(winnersWithUsers);
  } catch (error: any) {
    console.error('❌ Error fetching winners:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * PATCH /api/admin/winners/:id
 * Update payment_status or verification_status
 * When marking as paid, creates payout transaction and updates prize pool
 */
router.patch('/winners/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { verification_status, payment_status, admin_notes } = req.body;

  try {
    // Get winner details first
    const { data: winner, error: fetchError } = await supabase
      .from('winners')
      .select('*, monthly_draws(draw_month)')
      .eq('id', id)
      .single();

    if (fetchError || !winner) {
      return res.status(404).json({ error: 'Winner not found' });
    }

    const updates: Record<string, any> = { updated_at: new Date().toISOString() };
    if (verification_status) updates.verification_status = verification_status;
    if (payment_status) updates.payment_status = payment_status;
    if (admin_notes) updates.admin_notes = admin_notes;

    // If marking as paid, create payout transaction
    if (payment_status === 'paid' && winner.payment_status !== 'paid') {
      console.log(`💸 Processing payout for winner ${id}: £${winner.prize_amount}`);

      // Create payout transaction record
      const { error: txError } = await supabase
        .from('payment_transactions')
        .insert({
          user_id: winner.user_id,
          stripe_payment_intent_id: `payout_${id}_${Date.now()}`,
          amount: -winner.prize_amount, // Negative for payout
          prize_pool_contribution: -winner.prize_amount, // Deduct from pool
          billing_period_start: winner.monthly_draws?.draw_month || new Date().toISOString().split('T')[0],
          billing_period_end: winner.monthly_draws?.draw_month || new Date().toISOString().split('T')[0]
        });

      if (txError) {
        console.error('❌ Error creating payout transaction:', txError.message);
        return res.status(500).json({ error: 'Failed to create payout transaction' });
      }

      console.log(`✅ Payout transaction created for £${winner.prize_amount}`);
    }

    const { data, error } = await supabase
      .from('winners')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    res.json({ message: `Winner ${id} updated`, winner: data });
  } catch (error: any) {
    console.error('❌ Error updating winner:', error.message);
    res.status(500).json({ error: error.message });
  }
});
// ── DRAW MANAGEMENT ──────────────────────────────────────────────────────────

/**
 * GET /api/admin/draws
 * List past draws for the history log
 */
router.get('/draws', async (_req: Request, res: Response) => {
  try {
    const { data, error } = await supabase
      .from('monthly_draws')
      .select('*')
      .order('draw_month', { ascending: false })
      .limit(10);

    if (error) throw error;
    res.json(data || []);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/admin/draws/:id
 * Delete a draw (only if not published)
 */
router.delete('/draws/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const requesterId = req.headers['x-user-id'] as string;
  
  console.log(`🗑️ Admin ${requesterId} deleting draw ${id}`);

  try {
    // Check if draw exists and is not published
    const { data: draw, error: fetchError } = await supabase
      .from('monthly_draws')
      .select('id, status, draw_month')
      .eq('id', id)
      .single();

    if (fetchError || !draw) {
      return res.status(404).json({ error: 'Draw not found' });
    }

    if (draw.status === 'published') {
      return res.status(400).json({ error: 'Cannot delete published draw' });
    }

    // Delete the draw
    const { error: deleteError } = await supabase
      .from('monthly_draws')
      .delete()
      .eq('id', id);

    if (deleteError) throw deleteError;

    console.log(`✅ Draw ${id} deleted successfully`);
    res.json({ message: 'Draw deleted successfully', draw });

  } catch (error: any) {
    console.error(`❌ Error deleting draw ${id}:`, error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/admin/draws/month/:month
 * Delete all draws for a specific month (cleanup utility)
 */
router.delete('/draws/month/:month', async (req: Request, res: Response) => {
  const { month } = req.params; // Format: 2026-04-01
  const requesterId = req.headers['x-user-id'] as string;
  
  console.log(`🗑️ Admin ${requesterId} cleaning up draws for month ${month}`);

  try {
    // Delete all draws for the month (only drafts)
    const { data: deletedDraws, error } = await supabase
      .from('monthly_draws')
      .delete()
      .eq('draw_month', month)
      .neq('status', 'published')
      .select();

    if (error) throw error;

    console.log(`✅ Deleted ${deletedDraws?.length || 0} draft draws for ${month}`);
    res.json({ 
      message: `Deleted ${deletedDraws?.length || 0} draft draws for ${month}`,
      deletedDraws 
    });

  } catch (error: any) {
    console.error(`❌ Error cleaning up draws for ${month}:`, error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/admin/clear-test-data
 * Clear all test data for fresh testing
 */
router.post('/clear-test-data', async (req: Request, res: Response) => {
  const requesterId = req.headers['x-user-id'] as string;
  console.log(`🧹 Admin ${requesterId} clearing test data`);

  try {
    // Delete draft draws
    const { data: deletedDraws } = await supabase
      .from('monthly_draws')
      .delete()
      .eq('status', 'draft')
      .select();

    // Delete test transactions
    const { data: deletedTransactions } = await supabase
      .from('payment_transactions')
      .delete()
      .like('stripe_payment_intent_id', 'test_%')
      .select();

    // Delete test scores for the admin user
    const { data: deletedScores } = await supabase
      .from('scores')
      .delete()
      .eq('user_id', requesterId)
      .select();

    console.log(`✅ Cleared: ${deletedDraws?.length || 0} draws, ${deletedTransactions?.length || 0} transactions, ${deletedScores?.length || 0} scores`);

    res.json({
      message: 'Test data cleared successfully',
      cleared: {
        draws: deletedDraws?.length || 0,
        transactions: deletedTransactions?.length || 0,
        scores: deletedScores?.length || 0
      }
    });

  } catch (error: any) {
    console.error('❌ Error clearing test data:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/admin/test-draw
 * Create test data and run a sample draw for demonstration
 */
router.post('/test-draw', async (req: Request, res: Response) => {
  const requesterId = req.headers['x-user-id'] as string;
  console.log(`🧪 Admin ${requesterId} creating test draw`);

  try {
    // Use next month to avoid conflicts with existing draws
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    const dateStr = nextMonth.toISOString().split('T')[0];
    const currentMonth = dateStr ? dateStr.substring(0, 7) + '-01' : '2026-05-01';
    
    // Check if draw already exists for this month
    const { data: existingDraw, error: checkError } = await supabase
      .from('monthly_draws')
      .select('id, status')
      .eq('draw_month', currentMonth)
      .maybeSingle();

    if (checkError) {
      console.error('❌ Error checking existing draw:', checkError.message);
      return res.status(500).json({ error: checkError.message });
    }

    if (existingDraw) {
      return res.status(400).json({ 
        error: `Draw already exists for ${currentMonth}`,
        existingDraw,
        suggestion: 'Use the existing draw or delete it first'
      });
    }
    
    // 1. Create some test payment transactions to build prize pool
    const testTransactions = [
      {
        user_id: requesterId,
        stripe_payment_intent_id: `test_${Date.now()}_1`,
        amount: 10.00,
        charity_amount: 1.00,
        prize_pool_contribution: 4.50,
        platform_fee: 4.50,
        billing_period_start: currentMonth,
        billing_period_end: currentMonth
      },
      {
        user_id: requesterId,
        stripe_payment_intent_id: `test_${Date.now()}_2`,
        amount: 10.00,
        charity_amount: 1.00,
        prize_pool_contribution: 4.50,
        platform_fee: 4.50,
        billing_period_start: currentMonth,
        billing_period_end: currentMonth
      }
    ];

    await supabase.from('payment_transactions').insert(testTransactions);

    // 2. Ensure the admin has some test scores
    const testScores = [
      { user_id: requesterId, score_value: 42, score_date: new Date().toISOString().split('T')[0] },
      { user_id: requesterId, score_value: 38, score_date: new Date(Date.now() - 86400000).toISOString().split('T')[0] },
      { user_id: requesterId, score_value: 35, score_date: new Date(Date.now() - 172800000).toISOString().split('T')[0] },
      { user_id: requesterId, score_value: 30, score_date: new Date(Date.now() - 259200000).toISOString().split('T')[0] },
      { user_id: requesterId, score_value: 28, score_date: new Date(Date.now() - 345600000).toISOString().split('T')[0] }
    ];

    // Delete existing scores for clean test
    await supabase.from('scores').delete().eq('user_id', requesterId);
    await supabase.from('scores').insert(testScores);

    // 3. Create a winning draw (use admin's scores as winning numbers)
    const winningNumbers = [28, 30, 35, 38, 42]; // Admin's scores

    const { data: draw, error: drawError } = await supabase
      .from('monthly_draws')
      .insert({
        draw_month: currentMonth,
        winning_numbers: winningNumbers,
        draw_type: 'random',
        status: 'draft'
      })
      .select()
      .single();

    if (drawError) throw drawError;

    console.log(`🎯 Test draw created with ID: ${draw.id}`);

    res.json({
      message: 'Test draw setup completed',
      draw,
      testData: {
        transactions: testTransactions.length,
        scores: testScores.length,
        winningNumbers
      },
      nextStep: `Use POST /api/draws/${draw.id}/publish to finalize the draw`
    });

  } catch (error: any) {
    console.error('❌ Error creating test draw:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// ── CHARITY MANAGEMENT ────────────────────────────────────────────────────────

/**
 * GET /api/admin/charities
 * List all charities (admin view)
 */
router.get('/charities', async (_req: Request, res: Response) => {
  try {
    const { data, error } = await supabase
      .from('charities')
      .select('*')
      .order('name', { ascending: true });

    if (error) throw error;
    res.json(data || []);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/admin/charities
 * Add a new charity
 */
router.post('/charities', async (req: Request, res: Response) => {
  const { name, description, logo_url, website_url, is_featured } = req.body;

  if (!name) return res.status(400).json({ error: 'Charity name is required' });

  try {
    const { data, error } = await supabase
      .from('charities')
      .insert({ name, description, logo_url, website_url, is_featured: is_featured || false })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json({ message: 'Charity created', charity: data });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * PATCH /api/admin/charities/:id
 * Update charity details (name, description, featured status, etc.)
 */
router.patch('/charities/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const allowed = ['name', 'description', 'logo_url', 'website_url', 'is_featured'];
  const updates: Record<string, any> = {};

  allowed.forEach(key => {
    if (req.body[key] !== undefined) updates[key] = req.body[key];
  });

  try {
    const { data, error } = await supabase
      .from('charities')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    res.json({ message: 'Charity updated', charity: data });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/admin/charities/:id
 * Permanent deletion as per schemas.md (no is_active column)
 */
router.delete('/charities/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const { error } = await supabase
      .from('charities')
      .delete()
      .eq('id', id);

    if (error) throw error;
    res.json({ message: 'Charity deleted permanently' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/admin/charities/:id/feature
 * Toggle featured status — only one charity should be featured at a time
 */
router.post('/charities/:id/feature', async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    // Unset all featured
    await supabase.from('charities').update({ is_featured: false }).neq('id', '');
    // Set this one
    const { data, error } = await supabase
      .from('charities')
      .update({ is_featured: true })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    res.json({ message: 'Featured charity updated', charity: data });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
