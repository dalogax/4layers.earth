import axios from 'axios';

/**
 * OpenWeatherService - Real weather data from OpenWeatherMap API
 * 
 * Integrates with OpenWeatherMap API to fetch current weather and forecast data.
 * Handles rate limiting, caching, and data transformation to our GroundData format.
 */
export class OpenWeatherService {
  constructor() {
    this.baseURL = 'https://api.openweathermap.org/data/2.5';
    this.apiKey = process.env.OPENWEATHER_API_KEY;
    this.cache = new Map();
    this.requestCount = 0;
    this.lastResetTime = Date.now();
    this.maxRequestsPerMinute = 60; // OpenWeatherMap free tier limit
    
    // Validate API key on initialization
    if (!this.apiKey) {
      console.warn('OPENWEATHER_API_KEY not found in environment variables. Using mock data fallback.');
    }
    
    // Setup axios instance with timeout
    this.client = axios.create({
      timeout: 10000, // 10 second timeout
      headers: {
        'Accept': 'application/json',
        'User-Agent': '4layers.earth/1.0'
      }
    });
  }

  /**
   * Check if we can make an API request (rate limiting)
   */
  canMakeRequest() {
    const now = Date.now();
    
    // Reset counter every minute
    if (now - this.lastResetTime >= 60000) {
      this.requestCount = 0;
      this.lastResetTime = now;
    }
    
    return this.requestCount < this.maxRequestsPerMinute;
  }

  /**
   * Get cache key for location and endpoint
   */
  getCacheKey(endpoint, lat, lon) {
    return `${endpoint}_${lat.toFixed(2)}_${lon.toFixed(2)}`;
  }

  /**
   * Check if cached data is still valid
   */
  isCacheValid(cacheEntry, maxAgeMs) {
    return cacheEntry && (Date.now() - cacheEntry.timestamp < maxAgeMs);
  }

  /**
   * Get current weather conditions
   */
  async getCurrentWeather(lat, lon) {
    if (!this.apiKey) {
      throw new Error('OpenWeatherMap API key not configured');
    }

    if (!this.canMakeRequest()) {
      throw new Error('Rate limit exceeded. Please try again later.');
    }

    const cacheKey = this.getCacheKey('current', lat, lon);
    const cachedData = this.cache.get(cacheKey);
    
    // Return cached data if less than 10 minutes old
    if (this.isCacheValid(cachedData, 10 * 60 * 1000)) {
      console.log('Returning cached current weather data');
      return cachedData.data;
    }

    try {
      this.requestCount++;
      
      const response = await this.client.get(`${this.baseURL}/weather`, {
        params: {
          lat: lat,
          lon: lon,
          appid: this.apiKey,
          units: 'metric' // Get temperature in Celsius
        }
      });

      const transformedData = this.transformCurrentWeatherData(response.data);
      
      // Cache the result
      this.cache.set(cacheKey, {
        data: transformedData,
        timestamp: Date.now()
      });

      console.log(`OpenWeatherMap API: Current weather fetched for ${lat}, ${lon}`);
      return transformedData;

    } catch (error) {
      console.error('OpenWeatherMap API error:', error.message);
      
      // If we have cached data (even if old), return it
      if (cachedData) {
        console.log('Returning stale cached data due to API error');
        return cachedData.data;
      }
      
      throw new Error(`Failed to fetch weather data: ${error.message}`);
    }
  }

  /**
   * Get 5-day forecast data
   */
  async getForecastData(lat, lon) {
    if (!this.apiKey) {
      throw new Error('OpenWeatherMap API key not configured');
    }

    if (!this.canMakeRequest()) {
      throw new Error('Rate limit exceeded. Please try again later.');
    }

    const cacheKey = this.getCacheKey('forecast', lat, lon);
    const cachedData = this.cache.get(cacheKey);
    
    // Return cached data if less than 30 minutes old
    if (this.isCacheValid(cachedData, 30 * 60 * 1000)) {
      console.log('Returning cached forecast data');
      return cachedData.data;
    }

    try {
      this.requestCount++;
      
      const response = await this.client.get(`${this.baseURL}/forecast`, {
        params: {
          lat: lat,
          lon: lon,
          appid: this.apiKey,
          units: 'metric' // Get temperature in Celsius
        }
      });

      const transformedData = this.transformForecastData(response.data);
      
      // Cache the result
      this.cache.set(cacheKey, {
        data: transformedData,
        timestamp: Date.now()
      });

      console.log(`OpenWeatherMap API: Forecast fetched for ${lat}, ${lon}`);
      return transformedData;

    } catch (error) {
      console.error('OpenWeatherMap forecast API error:', error.message);
      
      // If we have cached data (even if old), return it
      if (cachedData) {
        console.log('Returning stale cached forecast data due to API error');
        return cachedData.data;
      }
      
      throw new Error(`Failed to fetch forecast data: ${error.message}`);
    }
  }

  /**
   * Transform OpenWeatherMap current weather response to our GroundData format
   */
  transformCurrentWeatherData(data) {
    return {
      timestamp: new Date(data.dt * 1000).toISOString(),
      location: {
        lat: data.coord.lat,
        lon: data.coord.lon,
        city: data.name,
        country: data.sys.country
      },
      metrics: {
        temperature: {
          current: Math.round(data.main.temp * 10) / 10, // Round to 1 decimal
          feelsLike: Math.round(data.main.feels_like * 10) / 10,
          min24h: Math.round(data.main.temp_min * 10) / 10,
          max24h: Math.round(data.main.temp_max * 10) / 10
        },
        humidity: data.main.humidity,
        pressure: {
          current: data.main.pressure,
          seaLevel: data.main.sea_level || data.main.pressure,
          trend: "steady" // OpenWeatherMap doesn't provide trend, default to steady
        }
      },
      conditions: {
        description: data.weather[0].description,
        icon: data.weather[0].icon
      }
    };
  }

  /**
   * Transform OpenWeatherMap forecast response to array of GroundData
   */
  transformForecastData(data) {
    return data.list.map(item => ({
      timestamp: new Date(item.dt * 1000).toISOString(),
      location: {
        lat: data.city.coord.lat,
        lon: data.city.coord.lon,
        city: data.city.name,
        country: data.city.country
      },
      metrics: {
        temperature: {
          current: Math.round(item.main.temp * 10) / 10,
          feelsLike: Math.round(item.main.feels_like * 10) / 10,
          min24h: Math.round(item.main.temp_min * 10) / 10,
          max24h: Math.round(item.main.temp_max * 10) / 10
        },
        humidity: item.main.humidity,
        pressure: {
          current: item.main.pressure,
          seaLevel: item.main.sea_level || item.main.pressure,
          trend: "steady"
        }
      },
      conditions: {
        description: item.weather[0].description,
        icon: item.weather[0].icon
      }
    }));
  }

  /**
   * Get combined timeline data (current + forecast)
   */
  async getTimelineData(lat, lon, hours = 48) {
    try {
      // Get both current and forecast data
      const [currentWeather, forecastData] = await Promise.all([
        this.getCurrentWeather(lat, lon),
        this.getForecastData(lat, lon)
      ]);

      // Combine current weather with forecast
      const allData = [currentWeather, ...forecastData];
      
      // Sort by timestamp and limit to requested hours
      const sortedData = allData
        .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
        .slice(0, Math.ceil(hours / 3)); // Forecast data is every 3 hours

      return sortedData;

    } catch (error) {
      console.error('Error getting timeline data:', error.message);
      throw error;
    }
  }

  /**
   * Validate location coordinates
   */
  validateLocation(lat, lon) {
    return lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180;
  }

  /**
   * Clean up old cache entries
   */
  cleanupCache() {
    const now = Date.now();
    const maxAge = 60 * 60 * 1000; // 1 hour
    
    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp > maxAge) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return {
      cacheSize: this.cache.size,
      requestCount: this.requestCount,
      timeUntilReset: Math.max(0, 60000 - (Date.now() - this.lastResetTime))
    };
  }
}
