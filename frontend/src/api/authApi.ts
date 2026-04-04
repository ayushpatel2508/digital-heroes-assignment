import apiClient from './apiClient';

export const authApi = {
  /**
   * Sync user profile to backend
   */
  async syncProfile(userId: string, fullName: string, email: string, isAdmin: boolean = false) {
    const response = await apiClient.post('/auth/sync-profile', {
      userId,
      fullName,
      email,
      isAdmin,
    });
    return response.data;
  }
};
