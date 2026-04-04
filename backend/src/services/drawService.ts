import supabase from '../lib/supabase';

export const drawService = {
  /**
   * Calculate the total prize pool for a given month
   * Only includes contributions from transactions for THIS month
   * Adds rollover from previous month if no 5-match winners
   */
  async calculatePrizePool(month: string) {
    console.log(`💰 Calculating prize pool for ${month}`);
    
    // 1. Get rollover from the previous month (only if no 5-match winners)
    const prevMonthDate = new Date(month);
    prevMonthDate.setMonth(prevMonthDate.getMonth() - 1);
    const prevMonthIso = prevMonthDate.toISOString();
    const prevMonthParts = prevMonthIso.split('T');
    const prevMonthStr = (prevMonthParts[0] || '').substring(0, 7) + '-01';

    let rolloverAmount = 0;
    
    // Check previous month's prize pool for rollover
    const { data: prevPool, error: poolErr } = await supabase
      .from('prize_pools')
      .select('pool_5_match')
      .eq('draw_month', prevMonthStr)
      .maybeSingle();

    if (!poolErr && prevPool && prevPool.pool_5_match > 0) {
      rolloverAmount = Number(prevPool.pool_5_match) || 0;
      console.log(`🔄 Rollover from ${prevMonthStr}: £${rolloverAmount}`);
    }

    // 2. Sum ONLY current month's contributions from transactions
    // Use billing_period_start to match the draw month
    const nextMonthDate = new Date(month);
    nextMonthDate.setMonth(nextMonthDate.getMonth() + 1);
    const nextMonthIso = nextMonthDate.toISOString();
    const nextMonthParts = nextMonthIso.split('T');
    const nextMonthStr = nextMonthParts[0] || month;
    
    const { data: transactions, error: txErr } = await supabase
      .from('payment_transactions')
      .select('prize_pool_contribution')
      .gte('billing_period_start', month)
      .lt('billing_period_start', nextMonthStr);

    if (txErr) {
      console.error('❌ Error fetching transactions for pool:', txErr.message);
      throw txErr;
    }

    const currentContributions = transactions?.reduce((sum, tx) => sum + Number(tx.prize_pool_contribution || 0), 0) || 0;
    const totalPool = currentContributions + rolloverAmount;

    console.log(`📊 Prize pool breakdown:
    - Current month contributions: £${currentContributions}
    - Rollover from previous: £${rolloverAmount}
    - Total pool: £${totalPool}`);

    // Splits: 40% (5-match), 35% (4-match), 25% (3-match)
    const pool5 = Math.round((totalPool * 0.40) * 100) / 100;
    const pool4 = Math.round((totalPool * 0.35) * 100) / 100;
    const pool3 = Math.round((totalPool * 0.25) * 100) / 100;

    return {
      totalPool: Math.round(totalPool * 100) / 100,
      pool5,
      pool4,
      pool3,
      rolloverAmount
    };
  },

  /**
   * Generate winning numbers
   * random: 5 unique numbers 1-45
   * algorithmic: weighted by frequency of user scores
   */
  async generateWinningNumbers(type: 'random' | 'algorithmic' = 'random'): Promise<number[]> {
    if (type === 'random') {
      const numbers: number[] = [];
      while (numbers.length < 5) {
        const n = Math.floor(Math.random() * 45) + 1;
        if (!numbers.includes(n)) numbers.push(n);
      }
      return numbers.sort((a, b) => a - b);
    } else {
      // Algorithmic: Weighted by frequency
      const { data: scores, error } = await supabase
        .from('scores')
        .select('score_value');

      if (error || !scores || scores.length === 0) {
        return this.generateWinningNumbers('random'); // Fallback
      }

      const frequency: Record<number, number> = {};
      scores.forEach(s => {
        frequency[s.score_value] = (frequency[s.score_value] || 0) + 1;
      });

      // Simple weighted pick
      const pool: number[] = [];
      Object.entries(frequency).forEach(([num, freq]) => {
        const n = Number(num);
        for (let i = 0; i < freq; i++) pool.push(n);
      });

      // Ensure variety if the pool is small
      for (let i = 1; i <= 45; i++) pool.push(i);

      const numbers: number[] = [];
      while (numbers.length < 5) {
        const randomIndex = Math.floor(Math.random() * pool.length);
        const n = pool[randomIndex] as number;
        if (!numbers.includes(n)) numbers.push(n);
      }
      return numbers.sort((a, b) => a - b);
    }
  },

  /**
   * Identifies winners for a specific draw
   * Only includes users whose subscription is valid for the draw month
   */
  async findWinners(drawId: string, winningNumbers: number[], drawMonth: string) {
    console.log(`🔍 Finding winners for draw ${drawId} (${drawMonth}) with numbers: ${winningNumbers.join(', ')}`);
    
    // 1. Get all users with subscriptions valid for this draw month
    // Check: current_period_start <= drawMonth AND current_period_end >= drawMonth
    const drawDate = new Date(drawMonth);
    
    const { data: validSubscriptions, error: subError } = await supabase
      .from('subscriptions')
      .select('user_id, plan_type, current_period_start, current_period_end')
      .eq('status', 'active')
      .lte('current_period_start', drawDate.toISOString())
      .gte('current_period_end', drawDate.toISOString());

    if (subError) throw subError;
    
    if (!validSubscriptions || validSubscriptions.length === 0) {
      console.log('⚠️ No valid subscriptions found for this draw month');
      return [];
    }

    const validUserIds = validSubscriptions.map(s => s.user_id);
    console.log(`👥 Found ${validUserIds.length} users with valid subscriptions for ${drawMonth}`);

    const winners: any[] = [];

    // 2. For each valid user, get their latest 5 scores
    for (const userId of validUserIds) {
      const { data: userScores, error: scoreError } = await supabase
        .from('scores')
        .select('score_value, score_date')
        .eq('user_id', userId)
        .order('score_date', { ascending: false })
        .limit(5);

      if (scoreError) {
        console.error(`❌ Error fetching scores for user ${userId}:`, scoreError.message);
        continue;
      }

      // User must have exactly 5 scores to participate
      if (!userScores || userScores.length < 5) {
        console.log(`⚠️ User ${userId} has only ${userScores?.length || 0} scores, skipping`);
        continue;
      }

      // 3. Count matches with winning numbers
      const userNumbers = userScores.map(s => s.score_value);
      const matches = userNumbers.filter(score => winningNumbers.includes(score));
      const matchCount = matches.length;

      console.log(`🎯 User ${userId}: scores [${userNumbers.join(', ')}], matches: ${matchCount} (${matches.join(', ')})`);

      // 4. Record winner if 3+ matches
      if (matchCount >= 3) {
        winners.push({
          user_id: userId,
          draw_id: drawId,
          match_type: `${matchCount}-match` as '3-match' | '4-match' | '5-match',
          prize_amount: 0, // Calculated later
          verification_status: 'pending',
          payment_status: 'pending'
        });
        console.log(`🏆 Winner found: User ${userId} with ${matchCount}-match`);
      }
    }

    console.log(`✅ Total winners found: ${winners.length}`);
    return winners;
  },

  /**
   * Finalize the draw and record results
   */
  async finalizeDraw(drawId: string, month: string) {
    console.log(`🎯 Finalizing draw ${drawId} for ${month}`);
    
    // 1. Get the draw data
    const { data: draw, error: drawErr } = await supabase
      .from('monthly_draws')
      .select('*')
      .eq('id', drawId)
      .single();

    if (drawErr || !draw) {
      throw drawErr || new Error('Draw not found');
    }

    if (draw.status === 'published') {
      throw new Error('Draw has already been published');
    }

    console.log(`📋 Draw details: ${draw.draw_type} draw with numbers [${draw.winning_numbers.join(', ')}]`);

    // 2. Calculate Pool Splits
    const poolData = await this.calculatePrizePool(month);

    // 3. Find Winners (pass draw month for subscription validation)
    const winners = await this.findWinners(drawId, draw.winning_numbers, month);

    // 4. Calculate individual prizes
    const winners5 = winners.filter(w => w.match_type === '5-match');
    const winners4 = winners.filter(w => w.match_type === '4-match');
    const winners3 = winners.filter(w => w.match_type === '3-match');

    console.log(`🏆 Winners breakdown:
    - 5-match: ${winners5.length} winners
    - 4-match: ${winners4.length} winners  
    - 3-match: ${winners3.length} winners`);

    // Calculate prize per winner in each category
    const prize5 = winners5.length > 0 ? Math.round((poolData.pool5 / winners5.length) * 100) / 100 : 0;
    const prize4 = winners4.length > 0 ? Math.round((poolData.pool4 / winners4.length) * 100) / 100 : 0;
    const prize3 = winners3.length > 0 ? Math.round((poolData.pool3 / winners3.length) * 100) / 100 : 0;

    // Update winners with prize amounts
    const finalWinners = winners.map(w => {
      let amount = 0;
      if (w.match_type === '5-match') amount = prize5;
      else if (w.match_type === '4-match') amount = prize4;
      else if (w.match_type === '3-match') amount = prize3;
      return { ...w, prize_amount: amount };
    });

    console.log(`💰 Prize distribution:
    - 5-match: £${prize5} each (total: £${prize5 * winners5.length})
    - 4-match: £${prize4} each (total: £${prize4 * winners4.length})
    - 3-match: £${prize3} each (total: £${prize3 * winners3.length})`);

    // 5. Handle rollover for next month (if no 5-match winners)
    const rolloverForNext = winners5.length === 0 ? poolData.pool5 : 0;

    // 6. Save everything in database
    try {
      // Save Prize Pool Info
      const { error: poolError } = await supabase.from('prize_pools').upsert({
        draw_month: month,
        total_pool: poolData.totalPool,
        pool_5_match: rolloverForNext, // Store rollover amount for next month
        pool_4_match: poolData.pool4,
        pool_3_match: poolData.pool3,
        rollover_from_previous: poolData.rolloverAmount
      });

      if (poolError) throw poolError;

      // Save Winners if any
      if (finalWinners.length > 0) {
        const { error: winnerError } = await supabase.from('winners').insert(finalWinners);
        if (winnerError) throw winnerError;
      }

      // Mark draw as published
      const { error: updateError } = await supabase
        .from('monthly_draws')
        .update({ 
          status: 'published', 
          published_at: new Date().toISOString() 
        })
        .eq('id', drawId);

      if (updateError) throw updateError;

      console.log(`✅ Draw ${drawId} published successfully!`);

      return { 
        poolData, 
        winnersCount: finalWinners.length,
        winners: finalWinners,
        rolloverForNext
      };
    } catch (error: any) {
      console.error('❌ Error saving draw results:', error.message);
      throw new Error(`Failed to save draw results: ${error.message}`);
    }
  },

  /**
   * Forces a winning scenario for a specific user.
   * Useful for testing and verifying protocol integrity.
   */
  async simulateWinForUser(userId: string, month: string) {
    console.log(`🧪 Initiating Win Simulation for user: ${userId}`);

    // 1. Get user's current rolling 5 scores
    const { data: scores, error: scoreErr } = await supabase
      .from('scores')
      .select('score_value')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(5);

    if (scoreErr || !scores || scores.length < 5) {
      throw new Error(`User does not have 5 scores. (Found: ${scores?.length || 0})`);
    }

    const winningNumbers = scores.map(s => s.score_value).sort((a, b) => a - b);
    console.log(`🎯 Target Winning Numbers (from user scores): ${winningNumbers.join(', ')}`);

    // 2. Insert a mock transaction to ensure a prize pool exists
    await supabase.from('payment_transactions').insert({
      user_id: userId,
      stripe_payment_intent_id: `sim_${Date.now()}`,
      amount: 100,
      currency: 'gbp',
      prize_pool_contribution: 40, // 40.00 contribution
      billing_period_start: month,
      status: 'succeeded'
    });

    // 3. Create the draw
    const { data: draw, error: drawErr } = await supabase
      .from('monthly_draws')
      .insert({
        draw_month: month,
        winning_numbers: winningNumbers,
        draw_type: 'algorithmic',
        status: 'draft',
      })
      .select()
      .single();

    if (drawErr) throw drawErr;

    // 4. Finalize the draw
    return await this.finalizeDraw(draw.id, month);
  }
};
