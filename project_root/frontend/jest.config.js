module.exports = {
  testEnvironment: 'jsdom', // Simulate browser environment
  setupFilesAfterEnv: ['<rootDir>/setupTests.js'], // Run setup file before tests
  moduleNameMapper: {
    // Handle module aliases (if configured in tsconfig.json)
    '^@/(.*)$': '<rootDir>/src/$1',
    // Handle CSS Modules (if used)
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    // Handle static assets
    '\\.(jpg|jpeg|png|gif|webp|svg)$': '<rootDir>/__mocks__/fileMock.js',
  },
  transform: {
    // Use ts-jest to transform TypeScript files
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      tsconfig: 'tsconfig.json', // Ensure it uses your tsconfig
    }],
    // Use babel-jest for JavaScript files (if any)
    '^.+\\.(js|jsx)$': 'babel-jest',
  },
  collectCoverage: true, // Enable coverage reporting
  coverageDirectory: 'coverage',
  coverageProvider: 'v8', // Or 'babel'
  coverageReporters: ['text', 'lcov'], // Output formats
  // Ignore patterns for coverage
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/build/',
    '/*.config.js',
    '/*.config.ts',
    '/src/main.tsx', // Often exclude main entry point
    '/src/store/index.ts', // Store setup might be excluded
    '/src/shared/types/', // Type definitions
    '/src/shared/utilities/constants.ts', // Constants
    '/__mocks__/'
  ],
};