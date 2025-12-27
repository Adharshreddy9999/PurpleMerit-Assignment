import request from 'supertest';
import app from '../src/index';
// @ts-ignore
import * as prismaMock from '../__mocks__/@prisma/client';

describe('Project & Workspace API', () => {
  let token: string;
  let projectId: string;
  let workspaceId: string;
  const testUser = {
    email: 'projuser@example.com',
    password: 'ProjPass123!',
    role: 'admin',
  };

  beforeAll(async () => {
    await request(app).post('/api/auth/register').send(testUser);
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: testUser.email, password: testUser.password });
    token = res.body.token;
    // Set acting user for Prisma mock
    const userRes = await request(app)
      .post('/api/auth/login')
      .send({ email: testUser.email, password: testUser.password });
    const decoded = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
    if (prismaMock.__setActingUserId) {
      prismaMock.__setActingUserId(decoded.id);
    }
  });

  it('should create a new project', async () => {
    const res = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Test Project', description: 'A test project' });
    expect(res.statusCode).toBe(201);
    expect(res.body.name).toBe('Test Project');
    projectId = res.body.id;
  });

  it('should get all projects for the user', async () => {
    const res = await request(app)
      .get('/api/projects')
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.some((p: any) => p.id === projectId)).toBe(true);
  });

  it('should update the project', async () => {
    const res = await request(app)
      .put(`/api/projects/${projectId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Updated Project', description: 'Updated desc' });
    expect(res.statusCode).toBe(200);
    expect(res.body.name).toBe('Updated Project');
  });

  it('should create a workspace in the project', async () => {
    const res = await request(app)
      .post('/api/workspaces')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Test Workspace', projectId });
    expect(res.statusCode).toBe(201);
    expect(res.body.name).toBe('Test Workspace');
    workspaceId = res.body.id;
  });

  it('should get all workspaces for the project', async () => {
    const res = await request(app)
      .get(`/api/workspaces/project/${projectId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.some((w: any) => w.id === workspaceId)).toBe(true);
  });

  it('should update the workspace', async () => {
    const res = await request(app)
      .put(`/api/workspaces/${workspaceId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Updated Workspace' });
    expect(res.statusCode).toBe(200);
    expect(res.body.name).toBe('Updated Workspace');
  });

  it('should delete the workspace', async () => {
    const res = await request(app)
      .delete(`/api/workspaces/${workspaceId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toMatch(/deleted/);
  });

  it('should delete the project', async () => {
    const res = await request(app)
      .delete(`/api/projects/${projectId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toMatch(/deleted/);
  });
});
