import { Request, Response, NextFunction, RequestHandler } from 'express';
import { PrismaClient } from '@prisma/client';
// import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

export const authenticateUser: RequestHandler = async (req: Request, res: Response, next: NextFunction) => {
  try{
    const authHeader = req.headers['authorization'];
    const anonymousId = req.headers['x-user-id'] as string | undefined;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      // const token = authHeader.split(' ')[1];
      // const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as {id: string};
      // req.userId = decoded.id;
      // return next();
    }

    if (anonymousId) {

      // 1. Try to find an existing user by their anonymousId.
      let user = await prisma.user.findUnique({
        where: { anonymousId: anonymousId },
      });

      if (user) {
        // 2a. If the user exists, update their lastLogin time.
        user = await prisma.user.update({
          where: { id: user.id },
          data: { lastLogin: new Date() },
        });
      } else {
        // 2b. If the user does not exist, create a new one.
        user = await prisma.user.create({
          data: {
            anonymousId: anonymousId,
            displayName: `Guest-${anonymousId.substring(0, 8)}`,
          },
        });
      }

      req.userId = user.id;
      return next();
    }
    res.status(401).json({ message: 'Authentication failed: Missing Authorization token or X-User-Id header.' });
    return;
  } catch (error) {
    console.error('Error in authentication middleware: ', error);
    next(error);
  }

};
