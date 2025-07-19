import { supabase } from './client';
import type { UserProfile, FinancialProfileData } from './client';

export class ProfileService {
  /**
   * Get current user profile
   */
  static async getCurrentUserProfile(): Promise<UserProfile | null> {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        // PGRST116 is "not found" error
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
  }

  /**
   * Create a new user profile for current user
   */
  static async createUserProfile(
    profileData: FinancialProfileData = {}
  ): Promise<UserProfile | null> {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      const { data, error } = await supabase
        .from('user_profiles')
        .insert({
          user_id: user.id,
          profile_data: profileData,
          is_complete: false,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating user profile:', error);
      return null;
    }
  }

  /**
   * Update current user profile data
   */
  static async updateUserProfile(
    profileData: Partial<FinancialProfileData>,
    isComplete = false
  ): Promise<UserProfile | null> {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      // First get the existing profile
      const existingProfile = await this.getCurrentUserProfile();

      if (!existingProfile) {
        // Create new profile if it doesn't exist
        return await this.createUserProfile(profileData);
      }

      // Merge the new data with existing data
      const updatedProfileData = {
        ...existingProfile.profile_data,
        ...profileData,
      };

      const { data, error } = await supabase
        .from('user_profiles')
        .update({
          profile_data: updatedProfileData,
          is_complete: isComplete,
        })
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating user profile:', error);
      return null;
    }
  }

  /**
   * Get or create user profile for current user
   */
  static async getOrCreateUserProfile(): Promise<UserProfile | null> {
    try {
      let profile = await this.getCurrentUserProfile();

      if (!profile) {
        profile = await this.createUserProfile();
      }

      return profile;
    } catch (error) {
      console.error('Error getting or creating user profile:', error);
      return null;
    }
  }

  /**
   * Mark current user profile as complete
   */
  static async markProfileComplete(): Promise<boolean> {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      const { error } = await supabase
        .from('user_profiles')
        .update({ is_complete: true })
        .eq('user_id', user.id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error marking profile as complete:', error);
      return false;
    }
  }

  /**
   * Delete current user profile
   */
  static async deleteUserProfile(): Promise<boolean> {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      const { error } = await supabase
        .from('user_profiles')
        .delete()
        .eq('user_id', user.id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting user profile:', error);
      return false;
    }
  }
}
