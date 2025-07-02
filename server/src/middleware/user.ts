import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { JwtPayload } from 'jsonwebtoken';

const prisma = new PrismaClient();

/**
 * Extends the Express Request type to include the 'auth' property
 * that express-jwt adds after successful token validation.
 */
interface RequestWithAuth extends Request {
  auth?: JwtPayload;
}

/**
 * This middleware runs AFTER checkJwt. It takes the validated Auth0 user ID
 * from req.auth, finds or creates a user in our database, and attaches
 * their internal database ID to req.userId.
 */
export const attachUser = async (req: RequestWithAuth, res: Response, next: NextFunction) => {
  try {
    const auth0Id = req.auth?.sub;
    if (!auth0Id) {
      res.status(401).json({ message: 'Authorization error: User ID not found in token.' });
      return;
    }

    let user = await prisma.user.findUnique({ where: { auth0Id } });

    if (user) {
      user = await prisma.user.update({ where: { id: user.id }, data: { lastLogin: new Date() } });
    } else {
      user = await prisma.user.create({
        data: {
          auth0Id: auth0Id,
          displayName: (req.auth as any)?.name || `User-${auth0Id.substring(0, 8)}`,
        },
      });
    }

    req.userId = user.id;
    next();

  } catch (error) {
    next(error);
  }
};
