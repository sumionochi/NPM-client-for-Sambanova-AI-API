module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: [
    '**/tests/**/*.test.ts', 
    '**/__tests__/**/*.test.ts' 
  ],
  moduleFileExtensions: ['ts', 'js', 'json', 'node'],
  rootDir: './', 
  transform: {
    '^.+\\.ts?$': 'ts-jest'
  }
};
