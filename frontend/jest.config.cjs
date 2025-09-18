/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['./setupTests.js'],
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '^react-leaflet$': '<rootDir>/__mocks__/react-leaflet.js',
    '^leaflet$': '<rootDir>/__mocks__/leaflet.js'
  },
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      useESM: true,
      tsconfig: {
        esModuleInterop: true,
        allowSyntheticDefaultImports: true
      }
    }]
  },
  extensionsToTreatAsEsm: ['.ts', '.tsx'],
  transformIgnorePatterns: [
    'node_modules/(?!(.*\\.mjs$|@react-three/fiber|@react-three/drei))'
  ]
};
