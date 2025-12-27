import { Router } from 'express';
import { authenticateJWT } from '../middleware/auth';
import { createClient } from 'redis';
import { MongoClient, Collection, Document } from 'mongodb';
const { v4: uuidv4 } = require('uuid');

const router = Router();
const REDIS_URL = process.env.REDIS_URL || 'redis://redis:6379';
const MONGO_URL = process.env.MONGO_URL || 'mongodb://mongo:27017';
const JOB_QUEUE = 'job-queue';

const redis = createClient({ url: REDIS_URL });
const mongo = new MongoClient(MONGO_URL);
let jobs: Collection<Document>;

(async () => {
  await redis.connect();
  await mongo.connect();
  jobs = mongo.db('purplemerit').collection('jobs');
})();

// Submit a new job
router.post('/', authenticateJWT, async (req, res) => {
/**
 * @swagger
 * /api/jobs:
 *   post:
 *     summary: Submit a new async job
 *     tags:
 *       - Jobs
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       202:
 *         description: Job accepted
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 jobId:
 *                   type: string
 */
  const job = {
    id: uuidv4(),
    payload: req.body,
    status: 'queued',
    createdAt: new Date(),
  };
  await jobs.insertOne(job);
  await redis.rPush(JOB_QUEUE, JSON.stringify(job));
  res.status(202).json({ jobId: job.id });
});

/**
 * @swagger
 * /api/jobs/{id}:
 *   get:
 *     summary: Get job status or result
 *     tags:
 *       - Jobs
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Job status/result
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       404:
 *         description: Job not found
 */
// Get job status/result
router.get('/:id', authenticateJWT, async (req, res) => {
  const job = await jobs.findOne({ id: req.params.id });
  if (!job) return res.status(404).json({ error: 'Job not found' });
  res.json(job);
});

export default router;
