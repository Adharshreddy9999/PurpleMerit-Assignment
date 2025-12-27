import { createClient } from 'redis';

const REDIS_URL = process.env.REDIS_URL || 'redis://redis:6379';
const redis = createClient({ url: REDIS_URL });
redis.connect();

export default redis;
