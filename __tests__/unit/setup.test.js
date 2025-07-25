// Simple test to verify Jest setup
describe('Basic Setup', () => {
  test('Jest is working', () => {
    expect(1 + 1).toBe(2);
  });
  
  test('Environment variables', () => {
    expect(process.env.NODE_ENV).toBeDefined();
  });
});
