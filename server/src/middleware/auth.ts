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

    if(anonymousId) {
      const user = await prisma.user.upsert({
        where: {
          anonymousId: anonymousId,
        },
        update: {
          lastLogin: new Date(),
        },
        create: {
          anonymousId: anonymousId,
          displayName: `Guest-${anonymousId.substring(0,8)}`,
        }
      });

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
