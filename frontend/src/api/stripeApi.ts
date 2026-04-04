import apiClient from './apiClient';

export const stripeApi = {
  /**
   * Create a checkout session and return the redirect URL
   */
  async createCheckoutSession(priceId: string, userId: string, email: string) {
    const response = await apiClient.post('/stripe/create-checkout-session', {
      priceId,
      userId,
      email,
    });
    return response.data;
  }
};
