export default {
  testEnvironment: "node",
  testMatch: ["**/__tests__/**/*.test.js"],
  moduleFileExtensions: ["js", "json"],
  verbose: true,
  testTimeout: 30000,
  transform: {},
  moduleNameMapper: {
    "^sanitize-html$": "<rootDir>/__mocks__/sanitize-html.cjs"
  }
};