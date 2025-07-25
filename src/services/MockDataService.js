import { GroundData, DEFAULT_LOCATION, createGroundDataTemplate } from '../models/GroundData.js';

/**
 * MockDataService - Generates realistic weather patterns for development
 * 
 * Creates 48 hours of mock weather data (24h past + 24h future) with:
 * - Realistic temperature cycles (sinusoidal with daily patterns)
 * - Humidity inverse correlation with temperature
 * - Pressure variations simulating weather systems
 * - Proper weather condition transitions
 */
export class MockDataService {
  constructor() {
    this.baseDate = new Date();
    this.location = DEFAULT_LOCATION;
    
    // Base weather parameters for realistic simulation
    this.baseTemperature = 22; // Celsius
    this.temperatureRange = 8; // Daily variation
    this.baseHumidity = 65;
    this.basePressure = 1013.25; // hPa
    
    // Weather conditions pool with realistic icons
    this.weatherConditions = [
      { description: "Clear sky", icon: "01d", probability: 0.3 },
      { description: "Few clouds", icon: "02d", probability: 0.25 },
      { description: "Scattered clouds", icon: "03d", probability: 0.2 },
      { description: "Broken clouds", icon: "04d", probability: 0.15 },
      { description: "Light rain", icon: "10d", probability: 0.1 }
    ];
  }

  /**
   * Generates realistic temperature using sinusoidal pattern with random variations
   * @param {number} hoursOffset - Hours from current time
   * @returns {Object} Temperature data with current, feels-like, min, max
   */
  generateTemperature(hoursOffset) {
    // Daily cycle: cooler at night (4 AM), warmer in afternoon (2 PM)
    const hourOfDay = (this.baseDate.getHours() + hoursOffset) % 24;
    const dailyCycle = Math.sin(((hourOfDay - 6) / 24) * 2 * Math.PI);
    
    // Add some random variation
    const randomVariation = (Math.random() - 0.5) * 3;
    
    const current = this.baseTemperature + (dailyCycle * this.temperatureRange / 2) + randomVariation;
    const feelsLike = current + (Math.random() - 0.5) * 4; // Feels-like variation
    
    // Calculate daily min/max based on the cycle
    const min24h = this.baseTemperature - this.temperatureRange / 2 + randomVariation * 0.5;
    const max24h = this.baseTemperature + this.temperatureRange / 2 + randomVariation * 0.5;

    return {
      current: Math.round(current * 10) / 10,
      feelsLike: Math.round(feelsLike * 10) / 10,
      min24h: Math.round(min24h * 10) / 10,
      max24h: Math.round(max24h * 10) / 10
    };
  }

  /**
   * Generates humidity with inverse correlation to temperature
   * @param {number} temperature - Current temperature
   * @returns {number} Humidity percentage (0-100)
   */
  generateHumidity(temperature) {
    // Inverse correlation: higher temp = lower humidity (generally)
    const tempFactor = (this.baseTemperature - temperature) * 2;
    const randomVariation = (Math.random() - 0.5) * 20;
    
    const humidity = this.baseHumidity + tempFactor + randomVariation;
    
    // Clamp between 30-90% (realistic range)
    return Math.max(30, Math.min(90, Math.round(humidity)));
  }

  /**
   * Generates atmospheric pressure with slower variations simulating weather systems
   * @param {number} hoursOffset - Hours from current time
   * @returns {Object} Pressure data with current, sea level, and trend
   */
  generatePressure(hoursOffset) {
    // Slower pressure changes (weather systems move over days)
    const systemCycle = Math.sin((hoursOffset / 48) * 2 * Math.PI);
    const randomVariation = (Math.random() - 0.5) * 10;
    
    const current = this.basePressure + (systemCycle * 15) + randomVariation;
    const seaLevel = current; // Simplified for MVP
    
    // Determine trend based on pressure change
    const previousPressure = this.basePressure + (Math.sin(((hoursOffset - 1) / 48) * 2 * Math.PI) * 15);
    let trend = "steady";
    
    if (current > previousPressure + 2) trend = "rising";
    else if (current < previousPressure - 2) trend = "falling";

    return {
      current: Math.round(current * 100) / 100,
      seaLevel: Math.round(seaLevel * 100) / 100,
      trend
    };
  }

  /**
   * Selects weather conditions based on pressure and humidity
   * @param {number} pressure - Current pressure
   * @param {number} humidity - Current humidity
   * @returns {Object} Weather condition with description and icon
   */
  generateConditions(pressure, humidity) {
    // Higher pressure + lower humidity = clearer skies
    // Lower pressure + higher humidity = more clouds/rain
    let conditionIndex = 0;
    
    if (pressure > 1020 && humidity < 50) {
      conditionIndex = 0; // Clear sky
    } else if (pressure > 1015 && humidity < 70) {
      conditionIndex = Math.random() < 0.6 ? 1 : 2; // Few to scattered clouds
    } else if (pressure > 1010) {
      conditionIndex = Math.random() < 0.7 ? 2 : 3; // Scattered to broken clouds
    } else {
      conditionIndex = Math.random() < 0.3 ? 3 : 4; // Broken clouds to light rain
    }

    return this.weatherConditions[conditionIndex];
  }

  /**
   * Generates a single data point for a specific time offset
   * @param {number} hoursOffset - Hours from current time (negative for past)
   * @returns {GroundData} Complete weather data point
   */
  generateDataPoint(hoursOffset) {
    const timestamp = new Date(this.baseDate.getTime() + hoursOffset * 60 * 60 * 1000);
    
    const temperature = this.generateTemperature(hoursOffset);
    const humidity = this.generateHumidity(temperature.current);
    const pressure = this.generatePressure(hoursOffset);
    const conditions = this.generateConditions(pressure.current, humidity);

    return new GroundData({
      timestamp: timestamp.toISOString(),
      location: this.location,
      metrics: {
        temperature,
        humidity,
        pressure
      },
      conditions
    });
  }

  /**
   * Generates 48 hours of timeline data (24h past + 24h future)
   * @returns {Array<GroundData>} Array of weather data points
   */
  generateTimelineData() {
    const dataPoints = [];
    
    // Generate 24 hours in the past to 24 hours in the future
    for (let hour = -24; hour <= 24; hour++) {
      dataPoints.push(this.generateDataPoint(hour));
    }
    
    return dataPoints;
  }

  /**
   * Gets current weather conditions
   * @returns {GroundData} Current weather data
   */
  getCurrentConditions() {
    return this.generateDataPoint(0);
  }

  /**
   * Gets timeline data for a specific duration
   * @param {number} hours - Number of hours to include (default: 24)
   * @returns {Array<GroundData>} Array of weather data points
   */
  getTimelineData(hours = 24) {
    const dataPoints = [];
    const startHour = Math.floor(-hours / 2);
    const endHour = Math.ceil(hours / 2);
    
    for (let hour = startHour; hour <= endHour; hour++) {
      dataPoints.push(this.generateDataPoint(hour));
    }
    
    return dataPoints;
  }

  /**
   * Validates location coordinates
   * @param {number} lat - Latitude
   * @param {number} lon - Longitude
   * @returns {boolean} True if valid coordinates
   */
  validateLocation(lat, lon) {
    return (
      typeof lat === 'number' &&
      typeof lon === 'number' &&
      lat >= -90 && lat <= 90 &&
      lon >= -180 && lon <= 180
    );
  }
}
