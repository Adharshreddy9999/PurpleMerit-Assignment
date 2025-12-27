import { Router } from 'express';
import { authenticateJWT } from '../middleware/auth';
import { requireRole } from '../middleware/roles';

const router = Router();

// Example: Only owners can access
router.get('/owner', authenticateJWT, requireRole('owner'), (req, res) => {
  res.json({ message: 'Hello, owner!' });
});

// Example: Owners and collaborators can access
router.get('/collab', authenticateJWT, requireRole('owner', 'collaborator'), (req, res) => {
  res.json({ message: 'Hello, owner or collaborator!' });
});

// Example: Any authenticated user
router.get('/any', authenticateJWT, (req, res) => {
  res.json({ message: 'Hello, any authenticated user!' });
});

export default router;
