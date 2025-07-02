import { expressjwt, GetVerificationKey } from 'express-jwt';
import jwksRsa from 'jwks-rsa';
import config from '../config';
import { Request } from 'express';
import { JwtPayload } from 'jsonwebtoken';

export interface Auth0Request extends Request {
  auth?: JwtPayload;
}
/**
 * This middleware uses the standard express-jwt library to validate an
 * Auth0-issued JWT token from the Authorization header.
 * If the token is valid, it attaches the decoded payload to `req.auth`.
 */
export const checkJwt = expressjwt({
  secret: jwksRsa.expressJwtSecret({
    cache: true,
    rateLimit: true,
    jwksUri: `https://${config.auth0Domain}/.well-known/jwks.json`,
  }) as GetVerificationKey,

  audience: config.auth0Audience,
  issuer: `https://${config.auth0Domain}/`,
  algorithms: ['RS256'],
});