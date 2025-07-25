/**
 * GroundData - Data structure for Ground layer weather information
 * 
 * This interface defines the standardized format for all Ground layer data,
 * ensuring consistency between mock data, API responses, and frontend consumption.
 */

export class GroundData {
  constructor({
    timestamp,
    location,
    metrics,
    conditions
  }) {
    this.timestamp = timestamp;
    this.location = location;
    this.metrics = metrics;
    this.conditions = conditions;
  }

  /**
   * Validates that the GroundData object has all required fields
   * @returns {boolean} True if valid, false otherwise
   */
  isValid() {
    return (
      this.timestamp &&
      this.location?.lat !== undefined &&
      this.location?.lon !== undefined &&
      this.metrics?.temperature?.current !== undefined &&
      this.metrics?.humidity !== undefined &&
      this.metrics?.pressure?.current !== undefined
    );
  }

  /**
   * Creates a GroundData instance from a plain object
   * @param {Object} data - Plain object with GroundData structure
   * @returns {GroundData} New GroundData instance
   */
  static fromObject(data) {
    return new GroundData(data);
  }
}

/**
 * Default location data for MVP (New York)
 */
export const DEFAULT_LOCATION = {
  lat: 40.7128,
  lon: -74.0060,
  city: "New York",
  country: "US"
};

/**
 * Template for creating new GroundData objects
 */
export const createGroundDataTemplate = (overrides = {}) => ({
  timestamp: new Date().toISOString(),
  location: DEFAULT_LOCATION,
  metrics: {
    temperature: {
      current: 22.5,
      feelsLike: 24.1,
      min24h: 18.2,
      max24h: 26.8
    },
    humidity: 68,
    pressure: {
      current: 1013.25,
      seaLevel: 1013.25,
      trend: "steady" // "rising", "falling", "steady"
    }
  },
  conditions: {
    description: "Clear sky",
    icon: "01d"
  },
  ...overrides
});
