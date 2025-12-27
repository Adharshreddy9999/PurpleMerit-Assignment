import express from 'express';
import cors from 'cors';
import { rateLimit } from './middleware/rateLimit';
import dotenv from 'dotenv';

dotenv.config();

import authRoutes from './routes/auth';
import protectedRoutes from './routes/protected';
import projectRoutes from './routes/project';
import tokenRoutes from './routes/token';
import workspaceRoutes from './routes/workspace';

import jobRoutes from './routes/job';
import { setupSwagger } from './swagger';


const app = express();
app.use(cors());
app.use(express.json());
app.use(rateLimit);

app.use('/api/auth', authRoutes);

app.use('/api/protected', protectedRoutes);

app.use('/api/projects', projectRoutes);

app.use('/api/token', tokenRoutes);

app.use('/api/workspaces', workspaceRoutes);
app.use('/api/jobs', jobRoutes);
setupSwagger(app);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

const PORT = process.env.API_PORT || 4000;
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`API server running on port ${PORT}`);
  });
}

export default app;
