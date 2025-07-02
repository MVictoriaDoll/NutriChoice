import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import jwksRsa from 'jwks-rsa';
import config from '../config';

const prisma = new PrismaClient();

const jwksClient = jwksRsa({
  cache: true,
  rateLimit: true,
  jwksUri: `https://${config.auth0Domain}/.well-known/jwks.json`,
});

// Helper function to get the signing key from JWKS client
function getSigningKey(header: jwt.JwtHeader, callback: jwt.SigningKeyCallback) {
  if (!header.kid) {
    return callback(new Error('No KID found in JWT header'));
  }
  jwksClient.getSigningKey(header.kid, (err, key) => {
    if (err) {
      return callback(err);
    }
    const signingKey = key?.getPublicKey();
    callback(null, signingKey);
  });
}

/**
 * A new helper function that wraps jwt.verify in a Promise.
 * This gives us explicit control over the async flow.
 */
function verifyToken(token: string): Promise<jwt.JwtPayload> {
  return new Promise((resolve, reject) => {
    jwt.verify(
      token,
      getSigningKey,
      {
        audience: config.auth0Audience,
        issuer: `https://${config.auth0Domain}/`,
        algorithms: ['RS256'],
      },
      (err, decoded) => {
        if (err) {
          reject(err);
          return;
        }
        if (!decoded || typeof decoded !== 'object' || !decoded.sub) {
          reject(new Error('Token is malformed or missing sub.'));
          return;
        }
        resolve(decoded as jwt.JwtPayload);
      }
    );
  });
}

/**
 * This single middleware handles both authenticated (JWT) and anonymous users.
 */
export const authenticateUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers['authorization'];
    const anonymousId = req.headers['x-user-id'] as string | undefined;

    // --- PRIORITY 1: Handle real, authenticated users (via Bearer Token) ---
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];

      // Now we await our own custom promise
      const decoded = await verifyToken(token);

      // This code is now GUARANTEED to run only AFTER the token is verified.
      if (decoded && decoded.sub){
        let user = await prisma.user.findUnique({ where: { auth0Id: decoded.sub } });
        if (user) {
          user = await prisma.user.update({ where: { id: user.id }, data: { lastLogin: new Date() } });
        } else {
          user = await prisma.user.create({ data: { auth0Id: decoded.sub, displayName: (decoded as any).name || `User-${decoded.sub.substring(0, 8)}` } });
        }

        req.userId = user.id;
        return next();
      } else {
        throw new Error('Decoded token is invalid');
      }
    }

    // --- PRIORITY 2: Handle anonymous users (if no Bearer token was found) ---
    if (anonymousId) {
      let user = await prisma.user.findUnique({ where: { anonymousId } });
      if (user) {
        user = await prisma.user.update({ where: { id: user.id }, data: { lastLogin: new Date() } });
      } else {
        user = await prisma.user.create({ data: { anonymousId, displayName: `Guest-${anonymousId.substring(0, 8)}` } });
      }
      req.userId = user.id;
      return next();
    }

    res.status(401).json({ message: 'Authentication failed: Missing Authorization token or X-User-Id header.' });
    return;

  } catch (error) {
    console.error('Error in authentication middleware:', error);
    // Handle specific JWT errors
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({ message: `Unauthorized: ${error.message}` });
      return;
    }
    next(error);
  }
};
