// this file is added for testing front back end connection
// src/routes/health.routes.ts
import { Router, Request, Response } from 'express'


const router = Router()

// GET /api/health/ping
// As long as the Token is valid, return {message: 'pong', userSub:... }
router.get('/ping', (req: Request, res: Response) => {
  const userId = req.userId;
  console.log('💓 Health-check ping from user with DB ID:', userId)
  res.json({ message: 'pong', userId: userId })
})

export default router
