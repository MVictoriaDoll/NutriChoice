import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const userService = {
  /**
   * Retrieves a user's profile along with their aggregated nutrition summary and grocery list.
   * @param userId The internal database ID of the user.
   */
  getProfile: async (userId: string) => {
    try {
      const userProfile = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          nutritionSummary: true,
          groceryList: true,
        },
      });
      return userProfile;
    } catch (error) {
      console.error(`Error fetching profile for user ${userId}:`, error);
      throw error; // Re-throw the error to be handled by the controller
    }
  },

  /**
   * Updates a user's profile information.
   * @param userId The internal database ID of the user.
   * @param data The data to update (displayName, preferences).
   */
  updateProfile: async (userId: string, data: { displayName?: string; preferences?: any }) => {
    try {
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          displayName: data.displayName || undefined,
          preferences: data.preferences || undefined,
          lastLogin: new Date(), // Also update lastLogin on profile update
        },
      });
      return updatedUser;
    } catch (error) {
      console.error(`Error updating profile for user ${userId}:`, error);
      throw error;
    }
  },
};