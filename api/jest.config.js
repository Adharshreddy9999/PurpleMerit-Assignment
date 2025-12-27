module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.ts'],
  setupFiles: ['dotenv/config'],
  moduleNameMapper: {
    '^redis$': '<rootDir>/__mocks__/redis.js',
    '^mongodb$': '<rootDir>/__mocks__/mongodb.js',
  },
};
