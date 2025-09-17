// Optional: configure or set up a testing framework before each test.
// If you delete this file, remove `setupFilesAfterEnv` from `jest.config.js`

// Used for __tests__/testing-library.js
// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// Mock environment variables
process.env.NODE_ENV = 'test';
process.env.MONGODB_URI =
  'mongodb://localhost:27017/certificate-generator-test';
process.env.SMTP_HOST = 'smtp.test.com';
process.env.SMTP_PORT = '587';
process.env.SMTP_USER = 'test@test.com';
process.env.SMTP_PASS = 'testpass';

// Mock nodemailer
jest.mock('nodemailer', () => ({
  createTransport: jest.fn(() => ({
    sendMail: jest.fn(),
    verify: jest.fn(),
  })),
}));

// Mock canvas - simplified for testing
jest.mock('canvas', () => ({
  createCanvas: jest.fn(() => ({
    getContext: jest.fn(() => ({
      drawImage: jest.fn(),
      fillText: jest.fn(),
      measureText: jest.fn(() => ({ width: 100 })),
      font: '',
      fillStyle: '',
      textAlign: '',
      textBaseline: '',
    })),
    toBuffer: jest.fn(() => Buffer.from('mock-image-data')),
    toDataURL: jest.fn(() => 'data:image/png;base64,mock-data'),
    width: 800,
    height: 600,
  })),
  loadImage: jest.fn(() =>
    Promise.resolve({
      width: 800,
      height: 600,
    })
  ),
  registerFont: jest.fn(),
}));

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/',
}));

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};
