import { Router } from 'express';
import { authenticateJWT } from '../middleware/auth';
import prisma from '../lib/prisma';
import redis from '../lib/redis';

const router = Router();

/**
 * @swagger
 * /api/workspaces:
 *   post:
 *     summary: Create a workspace
 *     tags:
 *       - Workspaces
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               projectId:
 *                 type: string
 *     responses:
 *       201:
 *         description: Workspace created
 *       400:
 *         description: Could not create workspace
 */
// Create a workspace
router.post('/', authenticateJWT, async (req, res) => {
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
    res.status(400).json({ error: 'Could not create workspace', details: err });
  }
});

/**
 * @swagger
 * /api/workspaces/project/{projectId}:
 *   get:
 *     summary: Get all workspaces for a project
 *     tags:
 *       - Workspaces
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of workspaces
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Workspace'
 */
// Get all workspaces for a project
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

/**
 * @swagger
 * /api/workspaces/{id}:
 *   put:
 *     summary: Update a workspace
 *     tags:
 *       - Workspaces
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *     responses:
 *       200:
 *         description: Workspace updated
 *       400:
 *         description: Could not update workspace
 */
// Update a workspace
router.put('/:id', authenticateJWT, async (req, res) => {
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
    res.status(400).json({ error: 'Could not update workspace', details: err });
  }
});

/**
 * @swagger
 * /api/workspaces/{id}:
 *   delete:
 *     summary: Delete a workspace
 *     tags:
 *       - Workspaces
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Workspace deleted
 *       400:
 *         description: Could not delete workspace
 */
// Delete a workspace
router.delete('/:id', authenticateJWT, async (req, res) => {
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
    res.status(400).json({ error: 'Could not delete workspace', details: err });
  }
});

/**
 * @swagger
 * /api/workspaces/{id}/invite:
 *   post:
 *     summary: Invite collaborator to workspace
 *     tags:
 *       - Workspaces
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Collaborator invited
 *       400:
 *         description: Could not invite collaborator
 */
// Invite collaborator to workspace
router.post('/:id/invite', authenticateJWT, async (req, res) => {
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
    res.status(400).json({ error: 'Could not invite collaborator', details: err });
  }
});

/**
 * @swagger
 * /api/workspaces/{id}/collaborator/{userId}/role:
 *   put:
 *     summary: Update collaborator role in workspace (mocked)
 *     tags:
 *       - Workspaces
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       501:
 *         description: Role update not implemented. Add a join table for workspace roles.
 */

/**
 * @swagger
 * /api/workspaces/{id}/collaborator/{userId}/role:
 *   put:
 *     summary: Assign or update a user's role in a workspace
 *     tags:
 *       - Workspaces
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               role:
 *                 type: string
 *     responses:
 *       200:
 *         description: Role assigned/updated
 *       400:
 *         description: Could not assign/update role
 */
// Assign or update a user's role in a workspace
router.put('/:id/collaborator/:userId/role', authenticateJWT, async (req, res) => {
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
    res.status(400).json({ error: 'Could not assign/update role', details: err });
  }
});

export default router;
