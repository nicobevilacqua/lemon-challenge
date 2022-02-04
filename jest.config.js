const { pathsToModuleNameMapper } = require('ts-jest');

/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  rootDir: 'src',
  moduleNameMapper: pathsToModuleNameMapper({
    "@services/*": ["services/*"],
    "@routes/*": ["routes/*"],
    "@store/*": ["store/*"]
  }, { prefix: '<rootDir>/' }),
};
