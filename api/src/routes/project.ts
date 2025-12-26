import { Router } from 'express';
import { authenticateJWT } from '../middleware/auth';
import prisma from '../lib/prisma';
import { requireRole } from '../middleware/roles';
import redis from '../lib/redis';

const router = Router();

// Create a new project
router.post('/', authenticateJWT, requireRole('admin', 'manager'), async (req, res) => {
/**
 * @swagger
 * /api/projects:
 *   post:
 *     summary: Create a new project
 *     tags:
 *       - Projects
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Project created
 *       400:
 *         description: Could not create project
 */
  const { name, description } = req.body;
  const user = (req as any).user;
  try {
    const project = await prisma.project.create({
      data: {
        name,
        description,
        ownerId: user.id,
      },
    });
    // Invalidate cache
    const cacheKey = `projects:${user.id}`;
    await redis.del(cacheKey);
    res.status(201).json(project);
  } catch (err) {
    res.status(400).json({ error: 'Could not create project', details: err });
  }
});

// Get all projects for the authenticated user
router.get('/', authenticateJWT, async (req, res) => {
/**
 * @swagger
 * /api/projects:
 *   get:
 *     summary: Get all projects for the authenticated user
 *     tags:
 *       - Projects
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of projects
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Project'
 */
  const user = (req as any).user;
  const cacheKey = `projects:${user.id}`;
  const cached = await redis.get(cacheKey);
  if (cached) {
    return res.json(JSON.parse(cached));
  }
  const projects = await prisma.project.findMany({ where: { ownerId: user.id } });
  await redis.set(cacheKey, JSON.stringify(projects), { EX: 60 }); // cache for 60s
  res.json(projects);
});

// Update a project
router.put('/:id', authenticateJWT, requireRole('admin', 'manager'), async (req, res) => {
/**
 * @swagger
 * /api/projects/{id}:
 *   put:
 *     summary: Update a project
 *     tags:
 *       - Projects
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
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Project updated
 *       400:
 *         description: Could not update project
 *       403:
 *         description: Forbidden
 */
  const { id } = req.params;
  const { name, description } = req.body;
  const user = (req as any).user;
  try {
    const project = await prisma.project.update({
      where: { id },
      data: { name, description },
    });
    if (project.ownerId !== user.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    // Invalidate cache
    const cacheKey = `projects:${user.id}`;
    await redis.del(cacheKey);
    res.json(project);
  } catch (err) {
    res.status(400).json({ error: 'Could not update project', details: err });
  }
});

// Delete a project
router.delete('/:id', authenticateJWT, requireRole('admin', 'manager'), async (req, res) => {
/**
 * @swagger
 * /api/projects/{id}:
 *   delete:
 *     summary: Delete a project
 *     tags:
 *       - Projects
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
 *         description: Project deleted
 *       400:
 *         description: Could not delete project
 *       403:
 *         description: Forbidden
 */
  const { id } = req.params;
  const user = (req as any).user;
  try {
    const project = await prisma.project.findUnique({ where: { id } });
    if (!project || project.ownerId !== user.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    await prisma.project.delete({ where: { id } });
    // Invalidate cache
    const cacheKey = `projects:${user.id}`;
    await redis.del(cacheKey);
    res.json({ message: 'Project deleted' });
  } catch (err) {
    res.status(400).json({ error: 'Could not delete project', details: err });
  }
});

export default router;
