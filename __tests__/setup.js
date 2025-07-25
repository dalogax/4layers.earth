// Jest setup file
// This file runs before each test file

// Setup any global test utilities or mocks here
global.console = {
  ...console,
  // Suppress console logs during tests unless debugging
  log: process.env.DEBUG ? console.log : jest.fn(),
  debug: process.env.DEBUG ? console.debug : jest.fn(),
  info: process.env.DEBUG ? console.info : jest.fn(),
  warn: console.warn,
  error: console.error,
};
