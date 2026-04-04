import apiClient from './apiClient';

export interface Score {
  id: string;
  user_id: string;
  score_value: number;
  score_date: string;
  created_at: string;
}

export const scoreApi = {
  /**
   * Add a new golf score
   */
  async addScore(userId: string, scoreValue: number, scoreDate: string) {
    const response = await apiClient.post('/scores', {
      userId,
      scoreValue,
      scoreDate,
    });
    return response.data;
  },

  /**
   * Get user's rolling 5 scores
   */
  async getRollingScores(userId: string) {
    const response = await apiClient.get(`/scores/${userId}`);
    return response.data;
  },

  /**
   * Remove a score
   */
  async deleteScore(scoreId: string, userId: string) {
    const response = await apiClient.delete(`/scores/${scoreId}?userId=${userId}`);
    return response.data;
  }
};
