// __mocks__/redis.js for Jest (CommonJS style)
module.exports = {
  createClient: jest.fn(() => ({
    connect: jest.fn().mockResolvedValue(undefined),
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue(undefined),
    del: jest.fn().mockResolvedValue(undefined),
    rPush: jest.fn().mockResolvedValue(undefined),
    blPop: jest.fn().mockResolvedValue(undefined),
  })),
};
