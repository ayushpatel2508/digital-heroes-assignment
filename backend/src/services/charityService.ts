import supabase from '../lib/supabase';

export const charityService = {
  /**
   * Get all charities, featured ones first
   */
  async getAllCharities() {
    const { data, error } = await supabase
      .from('charities')
      .select('*')
      .order('is_featured', { ascending: false })
      .order('name', { ascending: true });

    if (error) {
      console.error('❌ Error fetching charities:', error.message);
      throw error;
    }

    return data;
  },

  /**
   * Get user's currently selected charity
   */
  async getUserCharity(userId: string) {
    const { data, error } = await supabase
      .from('user_charities')
      .select('*, charities(*)')
      .eq('user_id', userId)
      .is('effective_to', null)
      .order('created_at', { ascending: false })
      .maybeSingle();

    if (error) {
      console.error('❌ Error fetching user charity:', error.message);
      throw error;
    }

    return data;
  },

  /**
   * Select or change a charity for the user.
   * Ends the previous selection and creates a new one.
   */
  async selectCharity(userId: string, charityId: string, donationPercentage: number = 10) {
    // 1. End current selection (if any)
    const { error: endErr } = await supabase
      .from('user_charities')
      .update({ effective_to: new Date().toISOString() })
      .eq('user_id', userId)
      .is('effective_to', null);

    if (endErr) {
      console.error('❌ Error ending previous charity:', endErr.message);
      throw endErr;
    }

    // 2. Create new selection
    const { data, error } = await supabase
      .from('user_charities')
      .insert({
        user_id: userId,
        charity_id: charityId,
        donation_percentage: donationPercentage,
        effective_from: new Date().toISOString()
      })
      .select('*, charities(*)')
      .single();

    if (error) {
      console.error('❌ Error selecting charity:', error.message);
      throw error;
    }

    return data;
  }
};
