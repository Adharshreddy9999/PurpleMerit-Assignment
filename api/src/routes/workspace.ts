import { Router } from 'express';
import { authenticateJWT } from '../middleware/auth';
import { requireRole } from '../middleware/roles';
import prisma from '../lib/prisma';
import redis from '../lib/redis';
import { validateBody } from '../middleware/validate';
import { createWorkspaceSchema, updateWorkspaceSchema } from '../validation/schemas';

const router = Router();

// List all collaborators for a workspace
router.get('/:id/collaborators', authenticateJWT, requireRole('admin', 'manager', 'owner', 'collaborator'), async (req, res) => {
  const { id } = req.params;
  try {
    const workspace = await prisma.workspace.findUnique({
      where: { id },
      include: { collaborators: true },
    });
    if (!workspace) {
      return res.status(404).json({ error: 'Workspace not found' });
    }
    res.json(workspace.collaborators);
  } catch (err) {
    res.status(400).json({ error: 'Could not fetch collaborators', details: err instanceof Error ? err.message : String(err) });
  }
});

// Remove a collaborator from a workspace
router.delete('/:id/collaborator/:userId', authenticateJWT, requireRole('admin', 'manager', 'owner'), async (req, res) => {
  const { id, userId } = req.params;
  try {
    const workspace = await prisma.workspace.update({
      where: { id },
      data: {
        collaborators: {
          disconnect: { id: userId },
        },
      },
    });
    res.json({ message: 'Collaborator removed', workspace });
  } catch (err) {
    res.status(400).json({ error: 'Could not remove collaborator', details: err instanceof Error ? err.message : String(err) });
  }
});

// Create a workspace
router.post('/', authenticateJWT, requireRole('admin', 'manager', 'owner'), validateBody(createWorkspaceSchema), async (req, res) => {
  const { name, projectId } = req.body;
  try {
    const workspace = await prisma.workspace.create({
      data: { name, projectId },
    });
    // Invalidate cache for this project's workspaces
    const cacheKey = `workspaces:project:${projectId}`;
    await redis.del(cacheKey);
    res.status(201).json(workspace);
  } catch (err) {
    res.status(400).json({ error: 'Could not create workspace', details: err instanceof Error ? err.message : String(err) });
  }
});

// Get all workspaces for a project
router.get('/project/:projectId', authenticateJWT, requireRole('admin', 'manager', 'owner', 'collaborator'), async (req, res) => {
  const { projectId } = req.params;
  const cacheKey = `workspaces:project:${projectId}`;
  const cached = await redis.get(cacheKey);
  if (cached) {
    return res.json(JSON.parse(cached));
  }
  const workspaces = await prisma.workspace.findMany({ where: { projectId } });
  await redis.set(cacheKey, JSON.stringify(workspaces), { EX: 60 }); // cache for 60s
  res.json(workspaces);
});

// Update a workspace
router.put('/:id', authenticateJWT, requireRole('admin', 'manager', 'owner'), validateBody(updateWorkspaceSchema), async (req, res) => {
  const { id } = req.params;
  const { name } = req.body;
  try {
    // Get projectId for cache invalidation
    const workspaceOld = await prisma.workspace.findUnique({ where: { id } });
    const workspace = await prisma.workspace.update({
      where: { id },
      data: { name },
    });
    if (workspaceOld?.projectId) {
      const cacheKey = `workspaces:project:${workspaceOld.projectId}`;
      await redis.del(cacheKey);
    }
    res.json(workspace);
  } catch (err) {
    res.status(400).json({ error: 'Could not update workspace', details: err instanceof Error ? err.message : String(err) });
  }
});

// Delete a workspace
router.delete('/:id', authenticateJWT, requireRole('admin', 'manager', 'owner'), async (req, res) => {
  const { id } = req.params;
  try {
    // Get projectId for cache invalidation
    const workspaceOld = await prisma.workspace.findUnique({ where: { id } });
    await prisma.workspace.delete({ where: { id } });
    if (workspaceOld?.projectId) {
      const cacheKey = `workspaces:project:${workspaceOld.projectId}`;
      await redis.del(cacheKey);
    }
    res.json({ message: 'Workspace deleted' });
  } catch (err) {
    res.status(400).json({ error: 'Could not delete workspace', details: err instanceof Error ? err.message : String(err) });
  }
});

// Invite collaborator to workspace
router.post('/:id/invite', authenticateJWT, requireRole('admin', 'manager', 'owner'), async (req, res) => {
  const { id } = req.params;
  const { userId } = req.body;
  try {
    const workspace = await prisma.workspace.update({
      where: { id },
      data: {
        collaborators: {
          connect: { id: userId },
        },
      },
    });
    res.json({ message: 'Collaborator invited', workspace });
  } catch (err) {
    res.status(400).json({ error: 'Could not invite collaborator', details: err instanceof Error ? err.message : String(err) });
  }
});

// Assign or update a user's role in a workspace
router.put('/:id/collaborator/:userId/role', authenticateJWT, requireRole('admin', 'manager', 'owner'), async (req, res) => {
  const { id: workspaceId, userId } = req.params;
  const { role } = req.body;
  if (!role) {
    return res.status(400).json({ error: 'Role is required' });
  }
  try {
    // Upsert the role assignment
    const workspaceUserRole = await prisma.workspaceUserRole.upsert({
      where: {
        userId_workspaceId: {
          userId,
          workspaceId,
        },
      },
      update: { role },
      create: { userId, workspaceId, role },
    });
    res.json({ message: 'Role assigned/updated', workspaceUserRole });
  } catch (err) {
    res.status(400).json({ error: 'Could not assign/update role', details: err instanceof Error ? err.message : String(err) });
  }
});

export default router;
