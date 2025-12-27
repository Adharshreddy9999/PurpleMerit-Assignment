import request from 'supertest';
const app = require('../src/index');

describe('Auth & Role-based Access', () => {
  let token: string;
  let refreshToken: string;
  const testUser = {
    email: 'testuser@example.com',
    password: 'TestPass123!',
    role: 'owner',
  };

  it('should register a new user', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send(testUser);
    expect(res.statusCode).toBe(201);
    expect(res.body.email).toBe(testUser.email);
    expect(res.body.role).toBe(testUser.role);
  });

  it('should login and return a JWT', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: testUser.email, password: testUser.password });
    expect(res.statusCode).toBe(200);
    expect(res.body.token).toBeDefined();
    token = res.body.token;
  });

  it('should access a protected route with valid JWT', async () => {
    const res = await request(app)
      .get('/api/protected/any')
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toMatch(/Hello/);
  });

  it('should not access protected route with invalid JWT', async () => {
    const res = await request(app)
      .get('/api/protected/any')
      .set('Authorization', 'Bearer invalidtoken');
    expect(res.statusCode).toBe(401);
  });

  it('should refresh token', async () => {
    const res = await request(app)
      .post('/api/token/refresh')
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.token).toBeDefined();
    refreshToken = res.body.token;
  });

  it('should rate limit after too many requests', async () => {
    let lastStatus = 200;
    for (let i = 0; i < 35; i++) {
      const res = await request(app)
        .get('/api/protected/any')
        .set('Authorization', `Bearer ${token}`);
      lastStatus = res.statusCode;
      if (lastStatus === 429) break;
    }
    expect(lastStatus).toBe(429);
  });
});
