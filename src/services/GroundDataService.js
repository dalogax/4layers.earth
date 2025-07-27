import { MockDataService } from './MockDataService.js';
import { OpenWeatherService } from './OpenWeatherService.js';

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
    this.openWeatherService = new OpenWeatherService();
    this.useRealAPI = !!process.env.OPENWEATHER_API_KEY; // Auto-enable if API key is present
    
    if (this.useRealAPI) {
      console.log('GroundDataService: Real API mode enabled with OpenWeatherMap');
    } else {
      console.log('GroundDataService: Mock data mode (set OPENWEATHER_API_KEY to enable real API)');
    }
  }

  /**
   * Gets current weather conditions
   * @param {number} lat - Latitude (default: New York)
   * @param {number} lon - Longitude (default: New York)
   * @returns {Promise<GroundData>} Current weather data
   */
  async getCurrentConditions(lat = 40.7128, lon = -74.0060) {
    if (!this.validateLocation(lat, lon)) {
      throw new Error('Invalid coordinates provided');
    }

    if (!this.useRealAPI) {
      // Simulate API delay for realistic development experience
      await new Promise(resolve => setTimeout(resolve, 50));
      return this.mockService.getCurrentConditions();
    }

    try {
      return await this.openWeatherService.getCurrentWeather(lat, lon);
    } catch (error) {
      console.warn('Real API failed, falling back to mock data:', error.message);
      // Fallback to mock data if real API fails
      return this.mockService.getCurrentConditions();
    }
  }

  /**
   * Gets timeline weather data
   * @param {number} lat - Latitude
   * @param {number} lon - Longitude  
   * @param {number} hours - Number of hours to include
   * @returns {Promise<Array<GroundData>>} Array of weather data points
   */
  async getTimelineData(lat = 40.7128, lon = -74.0060, hours = 24) {
    if (!this.validateLocation(lat, lon)) {
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

    try {
      const timelineData = await this.openWeatherService.getTimelineData(lat, lon, hours);
      
      // If we get less data than requested hours, fill with mock data for the missing time slots
      if (timelineData.length < Math.ceil(hours / 3)) {
        console.log(`Real API returned ${timelineData.length} data points, filling remaining with mock data`);
        const mockData = this.mockService.getTimelineData(hours);
        const realTimestamps = new Set(timelineData.map(d => d.timestamp));
        
        // Add mock data for time slots not covered by real API
        const fillerData = mockData.filter(mock => !realTimestamps.has(mock.timestamp));
        return [...timelineData, ...fillerData].slice(0, hours);
      }
      
      return timelineData;
    } catch (error) {
      console.warn('Real API timeline failed, falling back to mock data:', error.message);
      // Fallback to mock data if real API fails
      return this.mockService.getTimelineData(hours);
    }
  }

  /**
   * Validates location coordinates
   * @param {number} lat - Latitude
   * @param {number} lon - Longitude
   * @returns {boolean} True if valid coordinates
   */
  validateLocation(lat, lon) {
    return this.openWeatherService.validateLocation(lat, lon);
  }

  /**
   * Switches between mock and real API data
   * @param {boolean} useReal - True to use real API, false for mock
   */
  setAPIMode(useReal) {
    this.useRealAPI = useReal && !!process.env.OPENWEATHER_API_KEY;
    console.log(`API mode switched to: ${this.useRealAPI ? 'Real API' : 'Mock data'}`);
  }

  /**
   * Get service statistics
   */
  getStats() {
    const stats = {
      mode: this.useRealAPI ? 'real-api' : 'mock',
      apiKeyConfigured: !!process.env.OPENWEATHER_API_KEY
    };

    if (this.useRealAPI) {
      stats.openWeatherStats = this.openWeatherService.getCacheStats();
    }

    return stats;
  }

  /**
   * Clean up resources and cache
   */
  cleanup() {
    if (this.openWeatherService) {
      this.openWeatherService.cleanupCache();
    }
  }
}
