// Mock canvas for Jest tests
module.exports = {
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
};
