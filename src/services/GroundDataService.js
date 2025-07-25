import { MockDataService } from './MockDataService.js';

/**
 * GroundDataService - Abstraction layer for weather data
 * 
 * Provides a consistent interface for fetching Ground layer data
 * that can switch between mock data and real API implementations.
 * This allows frontend development with mock data before API integration.
 */
export class GroundDataService {
  constructor() {
    this.mockService = new MockDataService();
    this.useRealAPI = false; // Toggle for development
  }

  /**
   * Gets current weather conditions
   * @param {number} lat - Latitude (default: New York)
   * @param {number} lon - Longitude (default: New York)
   * @returns {Promise<GroundData>} Current weather data
   */
  async getCurrentConditions(lat = 40.7128, lon = -74.0060) {
    if (!this.mockService.validateLocation(lat, lon)) {
      throw new Error('Invalid coordinates provided');
    }

    if (!this.useRealAPI) {
      // Simulate API delay for realistic development experience
      await new Promise(resolve => setTimeout(resolve, 50));
      return this.mockService.getCurrentConditions();
    }

    // Real API implementation will go here in Phase 1.6
    throw new Error('Real API not yet implemented');
  }

  /**
   * Gets timeline weather data
   * @param {number} lat - Latitude
   * @param {number} lon - Longitude  
   * @param {number} hours - Number of hours to include
   * @returns {Promise<Array<GroundData>>} Array of weather data points
   */
  async getTimelineData(lat = 40.7128, lon = -74.0060, hours = 24) {
    if (!this.mockService.validateLocation(lat, lon)) {
      throw new Error('Invalid coordinates provided');
    }

    if (hours < 1 || hours > 168) { // Limit to 1 week max
      throw new Error('Hours must be between 1 and 168');
    }

    if (!this.useRealAPI) {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 100));
      return this.mockService.getTimelineData(hours);
    }

    // Real API implementation will go here in Phase 1.6
    throw new Error('Real API not yet implemented');
  }

  /**
   * Validates location coordinates
   * @param {number} lat - Latitude
   * @param {number} lon - Longitude
   * @returns {boolean} True if valid coordinates
   */
  validateLocation(lat, lon) {
    return this.mockService.validateLocation(lat, lon);
  }

  /**
   * Switches between mock and real API data
   * @param {boolean} useReal - True to use real API, false for mock
   */
  setAPIMode(useReal) {
    this.useRealAPI = useReal;
  }
}
