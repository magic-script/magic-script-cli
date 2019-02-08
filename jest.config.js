// For a detailed explanation regarding each configuration property, visit:
// https://jestjs.io/docs/en/configuration.html

module.exports = {
  clearMocks: true,
  collectCoverage: true,
  coverageDirectory: "coverage",
  collectCoverageFrom: [
    "commands/*.js",
    "lib/*.js",
  ],
  testEnvironment: "node",
  testMatch: ["**/__tests__/*.js"],
  testPathIgnorePatterns: ["/node_modules/", ".eslintrc.js"],
};
