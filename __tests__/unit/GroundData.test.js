/**
 * Basic tests for Ground Data Model
 */

import { GroundData, DEFAULT_LOCATION, createGroundDataTemplate } from '../../src/models/GroundData.js';

describe('GroundData Model', () => {
  test('should create valid GroundData instance', () => {
    const data = createGroundDataTemplate();
    const groundData = new GroundData(data);
    
    expect(groundData.isValid()).toBe(true);
    expect(groundData.location.lat).toBe(DEFAULT_LOCATION.lat);
    expect(groundData.metrics.temperature.current).toBeDefined();
  });

  test('should validate required fields', () => {
    const invalidData = new GroundData({
      timestamp: new Date().toISOString(),
      location: { lat: 40.7128 }, // missing lon
      metrics: {}
    });
    
    expect(invalidData.isValid()).toBe(false);
  });

  test('should create from object', () => {
    const data = createGroundDataTemplate();
    const groundData = GroundData.fromObject(data);
    
    expect(groundData).toBeInstanceOf(GroundData);
    expect(groundData.isValid()).toBe(true);
  });
});
