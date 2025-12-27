import { Router } from 'express';
import { register, login } from '../controllers/authController';
import { bruteForceProtection } from '../middleware/bruteForce';

const router = Router();

router.post('/register', bruteForceProtection, register);
router.post('/login', bruteForceProtection, login);

export default router;
