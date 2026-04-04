import apiClient from './apiClient';

export interface Subscription {
  id: string;
  user_id: string;
  status: string;
  plan_type: 'monthly' | 'yearly';
  current_period_end: string;
}

export const subscriptionApi = {
  /**
   * Get the active subscription for a user
   */
  async getUserSubscription(userId: string) {
    const response = await apiClient.get(`/stripe/subscription/${userId}`);
    return response.data;
  }
};
