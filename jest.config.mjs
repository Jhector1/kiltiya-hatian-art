// jest.config.mjs
import nextJest from 'next/jest.js';

const createJestConfig = nextJest({ dir: './' });
export default createJestConfig({
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  moduleNameMapper: { '^@/(.*)$': '<rootDir>/src/$1' },
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  testMatch: [
    '**/__tests__/**/*.(test|spec).[tj]s?(x)',
    '**/?(*.)+(test|spec).[tj]s?(x)',
  ],
  testPathIgnorePatterns: ['/node_modules/', '/.next/'],
  clearMocks: true,
  restoreMocks: true,
});
