import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { authenticateJWT } from '../middleware/auth';

const router = Router();

router.post('/refresh', authenticateJWT, (req, res) => {
  const user = (req as any).user;
  // Issue a new token with a fresh expiry
  const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET || 'secret', { expiresIn: '1h' });
  res.json({ token });
});

export default router;
