import request from 'supertest';
const app = require('../src/index');

describe('Async Job API', () => {
  let token: string;
  const testUser = {
    email: 'jobuser@example.com',
    password: 'JobPass123!',
    role: 'admin',
  };

  beforeAll(async () => {
    await request(app).post('/api/auth/register').send(testUser);
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: testUser.email, password: testUser.password });
    token = res.body.token;
  });

  it('should submit a new job', async () => {
    const res = await request(app)
      .post('/api/jobs')
      .set('Authorization', `Bearer ${token}`)
      .send({ task: 'test', params: { foo: 'bar' } });
    expect(res.statusCode).toBe(202);
    expect(res.body.jobId).toBeDefined();
  });

  it('should return 404 for unknown job', async () => {
    const res = await request(app)
      .get('/api/jobs/unknown-id')
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(404);
    expect(res.body.error).toMatch(/not found/i);
  });

  it('should require auth for job endpoints', async () => {
    const res1 = await request(app).post('/api/jobs').send({});
    expect(res1.statusCode).toBe(401);
    const res2 = await request(app).get('/api/jobs/anyid');
    expect(res2.statusCode).toBe(401);
  });
});
