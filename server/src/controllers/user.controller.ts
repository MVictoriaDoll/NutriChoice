import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import config from '../config';

const prisma = new PrismaClient();

export const getUserProfile = async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.userId;

  if (!userId) {
    console.error('Error in getUserProfile: userId is missing after authentication middleware.');
    // 401 unauthorized
    return res.status(401).json({ message: 'Unauthenticated user.' });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        nutritionSummary: true,
        groceryList: true,
      },
    });

    if (user) {
      res.json(user);
    } else {
      console.warn(`User profile not found for ID: ${userId}`);
      // 404 Not found
      res.status(404).json({ message: 'User profile not found.' });
    }
  } catch (error) {
    console.error('Error fetching user profile: ', error);
    next(error);
  }
};

export const updateUserProfile = async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.userId;
  const { displayName, preferences } = req.body;

  if (!userId) {
    console.error('Error in updateUserProfile: userId is missing after authentication middleware.');
    // 401 unauthorized
    return res.status(401).json({ message: 'Unauthenticated user.' });
  }

  try {
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        displayName: displayName || undefined,
        preferences: preferences || undefined,
        lastLogin: new Date(),
      },
    });

    res.json(updatedUser);
  } catch (error) {
    console.error('Error updating user profile: ', error);
    next(error);
  }
};
