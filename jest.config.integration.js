module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/?(*.)+(test-int).[jt]s?(x)'],
  setupFiles: ['<rootDir>/jest.setup-int.js'],
};
