import apiClient from './apiClient';

export interface Charity {
  id: string;
  name: string;
  description: string | null;
  logo_url: string | null;
  website_url: string | null;
  is_featured: boolean;
  created_at: string;
}

export interface UserCharity {
  id: string;
  user_id: string;
  charity_id: string;
  donation_percentage: number;
  effective_from: string;
  effective_to: string | null;
  charities: Charity;
}

export const charityApi = {
  async getAllCharities() {
    const response = await apiClient.get('/charities');
    return response.data;
  },

  async getUserCharity(userId: string) {
    const response = await apiClient.get(`/charities/user/${userId}`);
    return response.data;
  },

  async selectCharity(userId: string, charityId: string, donationPercentage: number = 10) {
    const response = await apiClient.post('/charities/select', {
      userId,
      charityId,
      donationPercentage
    });
    return response.data;
  }
};
