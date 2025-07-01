// this file is added for testing front back end connection
// src/routes/health.routes.ts
import { Router, Request, Response } from 'express'
import { checkJwt } from '../middleware/auth0'
import type { Auth0Request } from '../middleware/auth0'

const router = Router()

// GET /api/health/ping
// As long as the Token is valid, return {message: 'pong', userSub:... }
router.get('/ping', checkJwt, (req: Request, res: Response) => {
  const authReq = req as Auth0Request
  const userSub = authReq.user?.sub
  console.log('💓 Health-check ping from user:', userSub)
  res.json({ message: 'pong', userSub })
})

export default router
