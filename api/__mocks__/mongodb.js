// __mocks__/mongodb.js for Jest (CommonJS style)
module.exports = {
  MongoClient: jest.fn(() => ({
    connect: jest.fn().mockResolvedValue(undefined),
    db: jest.fn(() => ({
      collection: jest.fn(() => ({
        insertOne: jest.fn().mockResolvedValue(undefined),
        updateOne: jest.fn().mockResolvedValue(undefined),
        findOne: jest.fn().mockResolvedValue(null),
      })),
    })),
  })),
};
