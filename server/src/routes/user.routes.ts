import { Router } from "express";
import { getUserProfile, updateUserProfile } from "src/controllers/user.controller";

const router = Router();

router.get('/me', getUserProfile);

router.put('/me/profile', updateUserProfile);

export default router;