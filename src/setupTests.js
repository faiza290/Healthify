// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';
// Optional: Add these mocks to prevent common errors

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock scrollTo
window.scrollTo = jest.fn();

// Mock localStorage
Storage.prototype.setItem = jest.fn();
Storage.prototype.getItem = jest.fn();
Storage.prototype.removeItem = jest.fn();
Storage.prototype.clear = jest.fn();

// SUPPRESS ALL CONSOLE ERRORS IN TESTS
const originalError = console.error;
beforeAll(() => {
  console.error = (...args) => {
    // Suppress all errors in tests
    return;
  };
});

afterAll(() => {
  console.error = originalError;
});