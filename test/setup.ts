// Jest setup file for browser extension tests

// Mock Chrome API
const mockChrome = {
  runtime: {
    getManifest: () => ({ version: '0.1.0' }),
    onMessage: {
      addListener: jest.fn(),
      removeListener: jest.fn()
    },
    sendMessage: jest.fn((message, callback) => {
      if (callback) callback({ success: true });
    }),
    lastError: null
  },
  storage: {
    local: {
      get: jest.fn((keys, callback) => {
        callback({});
      }),
      set: jest.fn((items, callback) => {
        if (callback) callback();
      })
    }
  },
  webRequest: {
    onBeforeRequest: {
      addListener: jest.fn()
    },
    onBeforeSendHeaders: {
      addListener: jest.fn()
    }
  }
};

// Global Chrome API mock
(global as any).chrome = mockChrome;

// Mock console methods to reduce noise during tests
global.console = {
  ...console,
  // Keep log and warn for debugging if needed
  // debug: jest.fn(),
  // info: jest.fn(),
};
