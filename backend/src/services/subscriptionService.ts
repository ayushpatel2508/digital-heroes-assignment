import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_KEY || ''
);

export const subscriptionService = {
  /**
   * Create or update a subscription in the database
   */
  async upsertSubscription(data: {
    stripeCustomerId: string;
    stripeSubscriptionId: string;
    userId: string;
    status: string;
    planType: string;
    currentPeriodStart: Date;
    currentPeriodEnd: Date;
    cancelAtPeriodEnd: boolean;
  }) {
    const { 
      stripeCustomerId, 
      stripeSubscriptionId, 
      userId, 
      status, 
      planType, 
      currentPeriodStart,
      currentPeriodEnd, 
      cancelAtPeriodEnd 
    } = data;

    const { error } = await supabase
      .from('subscriptions')
      .upsert({
        user_id: userId,
        stripe_subscription_id: stripeSubscriptionId,
        stripe_customer_id: stripeCustomerId,
        status: status,
        plan_type: planType,
        current_period_start: currentPeriodStart.toISOString(),
        current_period_end: currentPeriodEnd.toISOString(),
        cancel_at_period_end: cancelAtPeriodEnd,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'stripe_subscription_id'
      });

    if (error) {
      console.error('❌ Error upserting subscription:', error.message);
      throw error;
    }

    console.log(`✅ Subscription ${stripeSubscriptionId} updated for user ${userId}`);
  },

  /**
   * Handle subscription deletion/cancellation
   */
  async deleteSubscription(stripeSubscriptionId: string) {
    const { error } = await supabase
      .from('subscriptions')
      .update({ status: 'canceled', updated_at: new Date().toISOString() })
      .eq('id', stripeSubscriptionId);

    if (error) {
      console.error('❌ Error canceling subscription:', error.message);
      throw error;
    }

    console.log(`✅ Subscription ${stripeSubscriptionId} marked as canceled`);
  },

  /**
   * Find user by Stripe Customer ID
   */
  async getUserIdByStripeCustomerId(stripeCustomerId: string): Promise<string | null> {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('user_id')
      .eq('stripe_customer_id', stripeCustomerId)
      .single();

    if (error || !data) return null;
    return data.user_id;
  },

  /**
   * Get active subscription for a specific user
   */
  async getSubscriptionByUserId(userId: string) {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('❌ Error fetching subscription:', error.message);
      throw error;
    }

    return data;
  },
  
  /**
   * Record a payment transaction and split the amounts
   * For yearly subscriptions, creates 12 monthly transactions
   * Also updates prize pools for affected months
   */
  async recordPaymentTransaction(data: {
    userId: string;
    amount: number;
    stripePaymentIntentId: string;
    billingPeriodStart: Date;
    billingPeriodEnd: Date;
    planType: 'monthly' | 'yearly';
  }) {
    const { userId, amount, stripePaymentIntentId, billingPeriodStart, billingPeriodEnd, planType } = data;

    // 1. Get user's active charity selection
    const { data: userCharity, error: charityErr } = await supabase
      .from('user_charities')
      .select('charity_id, donation_percentage')
      .eq('user_id', userId)
      .is('effective_to', null)
      .maybeSingle();

    if (charityErr) {
      console.error('❌ Error fetching user charity for transaction:', charityErr.message);
    }

    const donationPercentage = userCharity?.donation_percentage || 10;
    const charityId = userCharity?.charity_id || null;

    const affectedMonths: string[] = [];

    console.log(`📅 Processing subscription: dividing £${amount} into 12 monthly transactions`);
    
    const monthlyAmount = amount / 12;
    const monthlyCharityAmount = monthlyAmount * (donationPercentage / 100);
    const monthlyPrizePoolContribution = monthlyAmount - monthlyCharityAmount;

    const transactions = [];
    const startDate = new Date(billingPeriodStart);

    // Create 12 monthly transactions
    for (let i = 0; i < 12; i++) {
      const monthStart = new Date(startDate);
      monthStart.setMonth(startDate.getMonth() + i);
      
      const monthEnd = new Date(monthStart);
      monthEnd.setMonth(monthStart.getMonth() + 1);
      monthEnd.setDate(0); // Last day of the month

      const monthStartIso = monthStart.toISOString();
      const monthStartParts = monthStartIso.split('T');
      const monthKey = (monthStartParts[0] || '').substring(0, 7) + '-01';
      affectedMonths.push(monthKey);

      const monthEndIso = monthEnd.toISOString();
      const monthEndParts = monthEndIso.split('T');

      transactions.push({
        user_id: userId,
        stripe_payment_intent_id: `${stripePaymentIntentId}_month_${i + 1}`,
        amount: Math.round(monthlyAmount * 100) / 100,
        charity_id: charityId,
        charity_amount: Math.round(monthlyCharityAmount * 100) / 100,
        prize_pool_contribution: Math.round(monthlyPrizePoolContribution * 100) / 100,
        platform_fee: 0,
        billing_period_start: monthStartParts[0] || '',
        billing_period_end: monthEndParts[0] || '',
      });
    }

    const { error: txErr } = await supabase
      .from('payment_transactions')
      .insert(transactions);

    if (txErr) {
      console.error('❌ Error recording transactions:', txErr.message);
      throw txErr;
    }

    console.log(`✅ Subscription: 12 monthly transactions created (£${monthlyAmount.toFixed(2)} each, £${monthlyPrizePoolContribution.toFixed(2)} to pool per month)`);

    // 4. Update prize pools for affected months
    console.log(`💰 Updating prize pools for ${affectedMonths.length} month(s)...`);
    
    for (const month of affectedMonths) {
      await this.updatePrizePoolForMonth(month);
    }
  },

  /**
   * Update or create prize pool for a specific month based on transactions
   */
  async updatePrizePoolForMonth(month: string) {
    try {
      // Get all transactions for this month
      const { data: transactions, error: txError } = await supabase
        .from('payment_transactions')
        .select('prize_pool_contribution')
        .gte('billing_period_start', month)
        .lt('billing_period_start', new Date(new Date(month).setMonth(new Date(month).getMonth() + 1)).toISOString().split('T')[0]);

      if (txError) {
        console.error(`❌ Error fetching transactions for ${month}:`, txError.message);
        return;
      }

      const totalContributions = (transactions || []).reduce((sum, tx) => sum + Number(tx.prize_pool_contribution || 0), 0);

      // Calculate splits: 40% (5-match), 35% (4-match), 25% (3-match)
      const pool5 = Math.round((totalContributions * 0.40) * 100) / 100;
      const pool4 = Math.round((totalContributions * 0.35) * 100) / 100;
      const pool3 = Math.round((totalContributions * 0.25) * 100) / 100;
      const totalPool = Math.round(totalContributions * 100) / 100;

      // Upsert prize pool
      const { error: upsertError } = await supabase
        .from('prize_pools')
        .upsert({
          draw_month: month,
          total_pool: totalPool,
          pool_5_match: pool5,
          pool_4_match: pool4,
          pool_3_match: pool3,
          rollover_from_previous: 0
        }, {
          onConflict: 'draw_month'
        });

      if (upsertError) {
        console.error(`❌ Error updating prize pool for ${month}:`, upsertError.message);
      } else {
        console.log(`✅ Prize pool updated for ${month}: £${totalPool}`);
      }
    } catch (error: any) {
      console.error(`❌ Error in updatePrizePoolForMonth:`, error.message);
    }
  }
};
