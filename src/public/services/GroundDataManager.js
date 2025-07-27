// Ground Data Manager for fetching, caching, and managing weather data

import { CacheManager } from './CacheManager.js';
import { eventBus, EVENTS } from './EventBus.js';

export class GroundDataManager {
  constructor(mockDataService = null) {
    this.cache = new CacheManager(300000, 200); // 5 minutes, 200 items
    this.pendingRequests = new Map();
    this.dataService = mockDataService;
    this.requestCount = 0;
    this.errorCount = 0;
    this.cacheHitCount = 0;
    
    // Performance settings
    this.debounceDelay = 250; // 250ms debounce for API calls
    this.maxConcurrentRequests = 3;
    this.retryAttempts = 3;
    this.retryDelay = 1000; // Start with 1 second
    
    this.debug = typeof window !== 'undefined' && window.location?.hostname === 'localhost';
    
    // Setup periodic cleanup
    this.cleanupInterval = setInterval(() => this.cleanup(), 300000); // 5 minutes
  }

  /**
   * Get data for a specific timestamp with caching and fallbacks
   * @param {Date|string} timestamp - Target timestamp
   * @param {object} options - Options for data fetching
   * @returns {Promise<object>} Ground data
   */
  async getDataForTime(timestamp, options = {}) {
    const {
      lat = 40.7128,
      lon = -74.0060,
      forceRefresh = false,
      priority = 'normal'
    } = options;
    
    const targetTime = new Date(timestamp);
    const cacheKey = this.generateCacheKey(targetTime, lat, lon);
    
    // Check cache first (unless force refresh)
    if (!forceRefresh) {
      const cachedData = this.cache.get(cacheKey);
      if (cachedData) {
        this.cacheHitCount++;
        
        if (this.debug) {
          console.log(`[GroundDataManager] Cache hit for ${targetTime.toISOString()}`);
        }
        
        return cachedData;
      }
    }
    
    // Check if request is already pending
    if (this.pendingRequests.has(cacheKey)) {
      if (this.debug) {
        console.log(`[GroundDataManager] Request already pending for ${targetTime.toISOString()}`);
      }
      return this.pendingRequests.get(cacheKey);
    }
    
    // Create new request
    const requestPromise = this.fetchDataWithRetry(targetTime, lat, lon, options);
    this.pendingRequests.set(cacheKey, requestPromise);
    
    try {
      const data = await requestPromise;
      
      // Cache the result
      this.cache.set(cacheKey, data);
      
      // Emit data loaded event
      eventBus.emit(EVENTS.DATA_LOADED, {
        timestamp: targetTime,
        data,
        source: 'api',
        cached: false
      });
      
      return data;
      
    } catch (error) {
      this.errorCount++;
      
      if (this.debug) {
        console.error(`[GroundDataManager] Failed to fetch data for ${targetTime.toISOString()}:`, error);
      }
      
      // Emit error event
      eventBus.emit(EVENTS.DATA_ERROR, {
        timestamp: targetTime,
        error: error.message,
        source: 'api'
      });
      
      // Try to return cached data as fallback
      const fallbackData = this.cache.get(cacheKey);
      if (fallbackData) {
        console.warn(`[GroundDataManager] Using cached fallback data for ${targetTime.toISOString()}`);
        return fallbackData;
      }
      
      throw error;
      
    } finally {
      // Remove from pending requests
      this.pendingRequests.delete(cacheKey);
    }
  }

  /**
   * Fetch data with retry logic
   * @param {Date} timestamp - Target timestamp
   * @param {number} lat - Latitude
   * @param {number} lon - Longitude
   * @param {object} options - Fetch options
   * @returns {Promise<object>} Ground data
   */
  async fetchDataWithRetry(timestamp, lat, lon, options = {}) {
    const { retryAttempts = this.retryAttempts } = options;
    
    for (let attempt = 1; attempt <= retryAttempts; attempt++) {
      try {
        // Emit loading event
        if (attempt === 1) {
          eventBus.emit(EVENTS.DATA_LOADING, {
            timestamp,
            operation: 'fetch',
            attempt
          });
        }
        
        const data = await this.fetchData(timestamp, lat, lon, options);
        this.requestCount++;
        
        return data;
        
      } catch (error) {
        if (attempt === retryAttempts) {
          // Last attempt failed
          throw error;
        }
        
        // Wait before retry with exponential backoff
        const delay = this.retryDelay * Math.pow(2, attempt - 1);
        await new Promise(resolve => setTimeout(resolve, delay));
        
        if (this.debug) {
          console.warn(`[GroundDataManager] Retry attempt ${attempt + 1} for ${timestamp.toISOString()}`);
        }
      }
    }
  }

  /**
   * Actual data fetching logic
   * @param {Date} timestamp - Target timestamp
   * @param {number} lat - Latitude
   * @param {number} lon - Longitude
   * @param {object} options - Fetch options
   * @returns {Promise<object>} Ground data
   */
  async fetchData(timestamp, lat, lon, options = {}) {
    const now = new Date();
    const isCurrentTime = Math.abs(timestamp.getTime() - now.getTime()) < 30 * 60 * 1000; // Within 30 minutes
    
    if (isCurrentTime) {
      // Fetch current weather
      const response = await fetch(`/api/ground/current?lat=${lat}&lon=${lon}`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Failed to fetch current weather`);
      }
      
      const result = await response.json();
      
      if (result.status !== 'success') {
        throw new Error(result.message || 'Invalid API response');
      }
      
      return result.data;
      
    } else {
      // Fetch timeline data (includes forecast and historical simulation)
      const hoursFromNow = Math.round((timestamp.getTime() - now.getTime()) / (1000 * 60 * 60));
      const response = await fetch(`/api/ground/timeline?lat=${lat}&lon=${lon}&hours=24&center=${hoursFromNow}`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Failed to fetch timeline data`);
      }
      
      const result = await response.json();
      
      if (result.status !== 'success') {
        throw new Error(result.message || 'Invalid API response');
      }
      
      // Find closest data point
      const targetTime = timestamp.getTime();
      let closestData = null;
      let closestDistance = Infinity;
      
      result.data.forEach(dataPoint => {
        const dataTime = new Date(dataPoint.timestamp).getTime();
        const distance = Math.abs(dataTime - targetTime);
        
        if (distance < closestDistance) {
          closestDistance = distance;
          closestData = dataPoint;
        }
      });
      
      if (!closestData) {
        throw new Error('No data found for timestamp');
      }
      
      return closestData;
    }
  }

  /**
   * Preload data for adjacent time periods
   * @param {Date} centerTimestamp - Center timestamp
   * @param {number} hoursRadius - Hours to preload around center (default 6)
   * @param {object} options - Options for preloading
   */
  async preloadAdjacentData(centerTimestamp, hoursRadius = 6, options = {}) {
    const {
      lat = 40.7128,
      lon = -74.0060,
      priority = 'low'
    } = options;
    
    const promises = [];
    const centerTime = new Date(centerTimestamp);
    
    // Preload data points every hour around the center
    for (let offset = -hoursRadius; offset <= hoursRadius; offset++) {
      if (offset === 0) continue; // Skip center point (should already be loaded)
      
      const targetTime = new Date(centerTime.getTime() + offset * 60 * 60 * 1000);
      const cacheKey = this.generateCacheKey(targetTime, lat, lon);
      
      // Only preload if not already cached
      if (!this.cache.has(cacheKey) && !this.pendingRequests.has(cacheKey)) {
        promises.push(
          this.getDataForTime(targetTime, { lat, lon, priority })
            .catch(error => {
              // Don't let preload failures affect the main flow
              if (this.debug) {
                console.warn(`[GroundDataManager] Preload failed for ${targetTime.toISOString()}:`, error.message);
              }
            })
        );
      }
    }
    
    // Limit concurrent preload requests
    const chunks = [];
    for (let i = 0; i < promises.length; i += this.maxConcurrentRequests) {
      chunks.push(promises.slice(i, i + this.maxConcurrentRequests));
    }
    
    // Execute chunks sequentially to avoid overwhelming the API
    for (const chunk of chunks) {
      await Promise.all(chunk);
      
      // Small delay between chunks
      if (chunks.length > 1) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    if (this.debug && promises.length > 0) {
      console.log(`[GroundDataManager] Preloaded ${promises.length} data points around ${centerTimestamp.toISOString()}`);
    }
  }

  /**
   * Generate cache key for consistent caching
   * @param {Date} timestamp - Timestamp
   * @param {number} lat - Latitude
   * @param {number} lon - Longitude
   * @returns {string} Cache key
   */
  generateCacheKey(timestamp, lat, lon) {
    // Round to nearest hour and location to 2 decimal places for consistent caching
    const date = new Date(timestamp);
    date.setMinutes(0, 0, 0);
    
    const roundedLat = Math.round(lat * 100) / 100;
    const roundedLon = Math.round(lon * 100) / 100;
    
    return `ground_${date.toISOString()}_${roundedLat}_${roundedLon}`;
  }

  /**
   * Get performance statistics
   * @returns {object} Performance statistics
   */
  getStats() {
    return {
      requestCount: this.requestCount,
      errorCount: this.errorCount,
      cacheHitCount: this.cacheHitCount,
      cacheStats: this.cache.getStats(),
      pendingRequests: this.pendingRequests.size,
      cacheHitRate: this.requestCount > 0 ? (this.cacheHitCount / (this.requestCount + this.cacheHitCount)) : 0,
      errorRate: this.requestCount > 0 ? (this.errorCount / this.requestCount) : 0
    };
  }

  /**
   * Cleanup old requests and cache
   */
  cleanup() {
    // Clear expired cache entries
    this.cache.cleanup();
    
    // Clear very old pending requests (shouldn't happen, but safety net)
    const now = Date.now();
    const oldRequests = [];
    
    for (const [key, promise] of this.pendingRequests.entries()) {
      // If request has been pending for more than 30 seconds, something is wrong
      if (promise.startTime && (now - promise.startTime) > 30000) {
        oldRequests.push(key);
      }
    }
    
    oldRequests.forEach(key => this.pendingRequests.delete(key));
    
    if (this.debug && oldRequests.length > 0) {
      console.warn(`[GroundDataManager] Cleaned up ${oldRequests.length} stale pending requests`);
    }
  }

  /**
   * Destroy data manager and cleanup resources
   */
  destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    
    this.cache.destroy();
    this.pendingRequests.clear();
    
    if (this.debug) {
      console.log(`[GroundDataManager] Data manager destroyed`);
    }
  }
}
