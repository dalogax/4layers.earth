/**
 * Tests for Mock Data Service
 */

import { MockDataService } from '../../src/services/MockDataService.js';

describe('MockDataService', () => {
  let mockService;

  beforeEach(() => {
    mockService = new MockDataService();
  });

  test('should generate current conditions', () => {
    const data = mockService.getCurrentConditions();
    
    expect(data.isValid()).toBe(true);
    expect(data.metrics.temperature.current).toBeGreaterThan(-50);
    expect(data.metrics.temperature.current).toBeLessThan(60);
    expect(data.metrics.humidity).toBeGreaterThan(0);
    expect(data.metrics.humidity).toBeLessThan(100);
  });

  test('should generate timeline data', () => {
    const timeline = mockService.getTimelineData(24);
    
    expect(timeline).toHaveLength(25); // 24 hours + center point
    expect(timeline[0].isValid()).toBe(true);
    
    // Check that timestamps are in sequence
    for (let i = 1; i < timeline.length; i++) {
      const prev = new Date(timeline[i-1].timestamp);
      const curr = new Date(timeline[i].timestamp);
      expect(curr.getTime()).toBeGreaterThan(prev.getTime());
    }
  });

  test('should validate location coordinates', () => {
    expect(mockService.validateLocation(40.7128, -74.0060)).toBe(true);
    expect(mockService.validateLocation(91, 0)).toBe(false); // Invalid lat
    expect(mockService.validateLocation(0, 181)).toBe(false); // Invalid lon
    expect(mockService.validateLocation('invalid', 0)).toBe(false); // Invalid type
  });

  test('should generate realistic temperature patterns', () => {
    const data1 = mockService.generateDataPoint(0); // Current time
    const data2 = mockService.generateDataPoint(6); // 6 hours later
    
    // Temperature should be within reasonable bounds
    expect(data1.metrics.temperature.current).toBeGreaterThan(0);
    expect(data1.metrics.temperature.current).toBeLessThan(40);
    expect(data2.metrics.temperature.current).toBeGreaterThan(0);
    expect(data2.metrics.temperature.current).toBeLessThan(40);
  });
});
