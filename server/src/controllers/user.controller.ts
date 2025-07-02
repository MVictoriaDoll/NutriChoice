import { Request, Response, NextFunction } from 'express';
import { userService } from '../services/user.service';

/**
 * Fetches the profile for the currently authenticated user.
 */
export const getUserProfile = async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.userId;

  if (!userId) {
    res.status(401).json({ message: 'Authentication error: User ID not found.' });
    return;
  }

  try {
    const userProfile = await userService.getProfile(userId);

    if (!userProfile) {
      res.status(404).json({ message: 'User profile not found.' });
      return;
    }

    res.status(200).json(userProfile);
  } catch (error) {
    console.error('Error in getUserProfile controller:', error);
    next(error); // Pass errors to the global error handler
  }
};

/**
 * Updates the profile for the currently authenticated user.
 */
export const updateUserProfile = async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.userId;
    const { displayName, preferences } = req.body;

    if (!userId) {
        res.status(401).json({ message: 'Authentication error: User ID not found.' });
        return;
    }

    try {
        const updatedUser = await userService.updateProfile(userId, { displayName, preferences });
        res.status(200).json(updatedUser);
    } catch (error) {
        console.error('Error in updateUserProfile controller:', error);
        next(error);
    }
};