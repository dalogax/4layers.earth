import { OpenWeatherService } from '../../../src/services/OpenWeatherService.js';

// Mock axios for testing
jest.mock('axios', () => ({
  create: jest.fn(() => ({
    get: jest.fn()
  }))
}));

describe('OpenWeatherService', () => {
  let service;
  let mockAxiosInstance;

  beforeEach(() => {
    // Set up environment
    process.env.OPENWEATHER_API_KEY = 'test-api-key';
    
    service = new OpenWeatherService();
    mockAxiosInstance = service.client;
  });

  afterEach(() => {
    delete process.env.OPENWEATHER_API_KEY;
    jest.clearAllMocks();
  });

  describe('getCurrentWeather', () => {
    test('should fetch and transform current weather data', async () => {
      const mockApiResponse = {
        data: {
          dt: 1642694400,
          coord: { lat: 40.7128, lon: -74.0060 },
          name: 'New York',
          sys: { country: 'US' },
          main: {
            temp: 22.5,
            feels_like: 24.1,
            temp_min: 18.2,
            temp_max: 26.8,
            pressure: 1013,
            humidity: 68
          },
          weather: [{
            description: 'clear sky',
            icon: '01d'
          }]
        }
      };

      mockAxiosInstance.get.mockResolvedValue(mockApiResponse);

      const result = await service.getCurrentWeather(40.7128, -74.0060);

      expect(mockAxiosInstance.get).toHaveBeenCalledWith(
        'https://api.openweathermap.org/data/2.5/weather',
        {
          params: {
            lat: 40.7128,
            lon: -74.0060,
            appid: 'test-api-key',
            units: 'metric'
          }
        }
      );

      expect(result).toMatchObject({
        timestamp: expect.any(String),
        location: {
          lat: 40.7128,
          lon: -74.0060,
          city: 'New York',
          country: 'US'
        },
        metrics: {
          temperature: {
            current: 22.5,
            feelsLike: 24.1,
            min24h: 18.2,
            max24h: 26.8
          },
          humidity: 68,
          pressure: {
            current: 1013,
            seaLevel: 1013,
            trend: 'steady'
          }
        },
        conditions: {
          description: 'clear sky',
          icon: '01d'
        }
      });
    });

    test('should return cached data when available', async () => {
      const mockApiResponse = {
        data: {
          dt: 1642694400,
          coord: { lat: 40.7128, lon: -74.0060 },
          name: 'New York',
          sys: { country: 'US' },
          main: { temp: 22.5, feels_like: 24.1, temp_min: 18.2, temp_max: 26.8, pressure: 1013, humidity: 68 },
          weather: [{ description: 'clear sky', icon: '01d' }]
        }
      };

      mockAxiosInstance.get.mockResolvedValue(mockApiResponse);

      // First call should fetch from API
      await service.getCurrentWeather(40.7128, -74.0060);
      
      // Second call should use cache
      const result = await service.getCurrentWeather(40.7128, -74.0060);

      expect(mockAxiosInstance.get).toHaveBeenCalledTimes(1);
      expect(result).toBeDefined();
    });

    test('should handle API errors gracefully', async () => {
      mockAxiosInstance.get.mockRejectedValue(new Error('API Error'));

      await expect(service.getCurrentWeather(40.7128, -74.0060))
        .rejects.toThrow('Failed to fetch weather data: API Error');
    });

    test('should respect rate limiting', async () => {
      // Simulate exceeding rate limit
      service.requestCount = service.maxRequestsPerMinute;

      await expect(service.getCurrentWeather(40.7128, -74.0060))
        .rejects.toThrow('Rate limit exceeded');
    });
  });

  describe('getForecastData', () => {
    test('should fetch and transform forecast data', async () => {
      const mockApiResponse = {
        data: {
          city: {
            coord: { lat: 40.7128, lon: -74.0060 },
            name: 'New York',
            country: 'US'
          },
          list: [
            {
              dt: 1642694400,
              main: { temp: 22.5, feels_like: 24.1, temp_min: 18.2, temp_max: 26.8, pressure: 1013, humidity: 68 },
              weather: [{ description: 'clear sky', icon: '01d' }]
            },
            {
              dt: 1642698000,
              main: { temp: 23.0, feels_like: 24.5, temp_min: 19.0, temp_max: 27.0, pressure: 1014, humidity: 65 },
              weather: [{ description: 'few clouds', icon: '02d' }]
            }
          ]
        }
      };

      mockAxiosInstance.get.mockResolvedValue(mockApiResponse);

      const result = await service.getForecastData(40.7128, -74.0060);

      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({
        timestamp: expect.any(String),
        location: {
          lat: 40.7128,
          lon: -74.0060,
          city: 'New York',
          country: 'US'
        },
        metrics: {
          temperature: {
            current: 22.5,
            feelsLike: 24.1
          },
          humidity: 68,
          pressure: {
            current: 1013,
            trend: 'steady'
          }
        }
      });
    });
  });

  describe('validateLocation', () => {
    test('should validate correct coordinates', () => {
      expect(service.validateLocation(40.7128, -74.0060)).toBe(true);
      expect(service.validateLocation(0, 0)).toBe(true);
      expect(service.validateLocation(-90, -180)).toBe(true);
      expect(service.validateLocation(90, 180)).toBe(true);
    });

    test('should reject invalid coordinates', () => {
      expect(service.validateLocation(91, 0)).toBe(false);
      expect(service.validateLocation(-91, 0)).toBe(false);
      expect(service.validateLocation(0, 181)).toBe(false);
      expect(service.validateLocation(0, -181)).toBe(false);
    });
  });

  describe('cache management', () => {
    test('should clean up old cache entries', () => {
      // Add some old cache entries
      service.cache.set('test-key', {
        data: { test: 'data' },
        timestamp: Date.now() - (2 * 60 * 60 * 1000) // 2 hours ago
      });

      service.cleanupCache();

      expect(service.cache.has('test-key')).toBe(false);
    });

    test('should provide cache statistics', () => {
      const stats = service.getCacheStats();

      expect(stats).toMatchObject({
        cacheSize: expect.any(Number),
        requestCount: expect.any(Number),
        timeUntilReset: expect.any(Number)
      });
    });
  });
});
