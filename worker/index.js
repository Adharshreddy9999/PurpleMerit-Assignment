import { createClient } from 'redis';
import { MongoClient } from 'mongodb';
import { v4 as uuidv4 } from 'uuid';

const REDIS_URL = process.env.REDIS_URL || 'redis://redis:6379';
const MONGO_URL = process.env.MONGO_URL || 'mongodb://mongo:27017';
const JOB_QUEUE = 'job-queue';

const redis = createClient({ url: REDIS_URL });
await redis.connect();

const mongo = new MongoClient(MONGO_URL);
await mongo.connect();
const db = mongo.db('purplemerit');
const jobs = db.collection('jobs');

console.log('Worker started, waiting for jobs...');

const MAX_RETRIES = 3;
while (true) {
  const jobData = await redis.blPop(JOB_QUEUE, 0);
  if (!jobData) continue;
  const [, jobStr] = jobData;
  let job;
  try {
    job = JSON.parse(jobStr);
  } catch (e) {
    console.error('Invalid job:', jobStr);
    continue;
  }
  const jobId = job.id;
  // Idempotency: skip if already completed
  const existing = await jobs.findOne({ id: jobId });
  if (existing && existing.status === 'completed') {
    console.log('Job already completed, skipping:', jobId);
    continue;
  }
  let attempts = (existing && existing.attempts) || 0;
  try {
    await jobs.updateOne({ id: jobId }, { $set: { status: 'processing' }, $inc: { attempts: 1 } });
    // Simulate job processing
    await new Promise(r => setTimeout(r, 2000));
    const result = { output: `Result for job ${jobId}` };
    await jobs.updateOne({ id: jobId }, { $set: { status: 'completed', result } });
    console.log('Job completed:', jobId);
  } catch (err) {
    attempts++;
    if (attempts < MAX_RETRIES) {
      // Retry by re-queueing the job
      await jobs.updateOne({ id: jobId }, { $set: { status: 'retrying', error: err.message, attempts } });
      await redis.rPush(JOB_QUEUE, JSON.stringify(job));
      console.warn(`Job ${jobId} failed (attempt ${attempts}), retrying...`);
    } else {
      await jobs.updateOne({ id: jobId }, { $set: { status: 'failed', error: err.message, attempts } });
      console.error('Job failed after max retries:', jobId, err);
    }
  }
}
