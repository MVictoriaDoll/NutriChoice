import { Request, Response, NextFunction } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const authenticateUser = async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.headers['x-user-id'] as string;

  if (!userId) {
    console.warn('Authentication failed: X-User-Id header is missing.');
    return res.status(401).json({
      message: 'User ID (X-User-Id header) is required.'
    });
  }

  try {
    const user = await prisma.user.upsert({
      where: {id: userId},
      update: {
        lastLogin: new Date()  // updates the last login timestamp on every interaction.
      },
      create: {
        id: userId,
        displayName: `Guest-${userId.substring(0, 8)}`,
        preferences: {},
      }
    });

    req.userId = user.id;
    console.debug(`User authenticated (or created): ${req.userId}`);

    next();
  } catch (error) {
    console.error('Error in authentication middleware (user upsert): ', error);

    next(error);
  }
};