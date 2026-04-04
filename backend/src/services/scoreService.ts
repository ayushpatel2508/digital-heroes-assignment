import supabase from '../lib/supabase';

export const scoreService = {
  /**
   * Add a new score for a user (strict Rolling 5)
   * If user already has 5 scores, the oldest one is auto-deleted.
   */
  async addScore(userId: string, scoreValue: number, scoreDate: string) {
    // 1. Get all existing scores ordered oldest-first
    const { data: existing, error: fetchErr } = await supabase
      .from('scores')
      .select('id, score_date')
      .eq('user_id', userId)
      .order('score_date', { ascending: true });

    if (fetchErr) {
      console.error('❌ Error checking existing scores:', fetchErr.message);
      throw fetchErr;
    }

    // 2. If already at 5, delete the oldest before inserting
    if (existing && existing.length >= 5) {
      const oldest = existing[0];
      if (oldest) {
        console.log(`🔄 Rolling: Removing oldest score ${oldest.id} (date: ${oldest.score_date})`);
        const { error: delErr } = await supabase
          .from('scores')
          .delete()
          .eq('id', oldest.id);

        if (delErr) {
          console.error('❌ Error deleting oldest score:', delErr.message);
          throw delErr;
        }
      }
    }

    // 3. Insert the new score
    const { data, error } = await supabase
      .from('scores')
      .insert({
        user_id: userId,
        score_value: scoreValue,
        score_date: scoreDate
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Error saving score:', error.message);
      throw error;
    }

    console.log(`✅ Score ${scoreValue} added for ${scoreDate}`);
    return data;
  },

  /**
   * Fetch the 5 most recent scores (Rolling 5)
   */
  async getRollingScores(userId: string) {
    const { data, error } = await supabase
      .from('scores')
      .select('*')
      .eq('user_id', userId)
      .order('score_date', { ascending: false })
      .limit(5);

    if (error) {
      console.error('❌ Error fetching rolling scores:', error.message);
      throw error;
    }

    return data;
  },

  /**
   * Delete a score (useful for corrections)
   */
  async deleteScore(scoreId: string, userId: string) {
    const { error } = await supabase
      .from('scores')
      .delete()
      .eq('id', scoreId)
      .eq('user_id', userId);

    if (error) {
      console.error('❌ Error deleting score:', error.message);
      throw error;
    }
  }
};
