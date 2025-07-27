// Cache Manager for efficient data storage and retrieval

export class CacheManager {
  constructor(maxAge = 300000, maxSize = 100) { // 5 minutes default, 100 items max
    this.cache = new Map();
    this.maxAge = maxAge;
    this.maxSize = maxSize;
    this.accessTimes = new Map(); // For LRU implementation
    this.debug = typeof window !== 'undefined' && window.location?.hostname === 'localhost';
    
    // Periodic cleanup
    this.cleanupInterval = setInterval(() => this.cleanup(), this.maxAge / 2);
  }

  /**
   * Store data in cache with timestamp
   * @param {string} key - Cache key
   * @param {any} data - Data to store
   * @param {number} customTTL - Custom TTL in milliseconds
   */
  set(key, data, customTTL = null) {
    const now = Date.now();
    const ttl = customTTL || this.maxAge;
    
    // If cache is full, remove oldest item
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      this.evictOldest();
    }
    
    this.cache.set(key, {
      data,
      timestamp: now,
      expires: now + ttl,
      ttl
    });
    
    this.accessTimes.set(key, now);
    
    if (this.debug) {
      console.log(`[CacheManager] Cached '${key}' (TTL: ${ttl}ms, Size: ${this.cache.size})`);
    }
  }

  /**
   * Retrieve data from cache if not expired
   * @param {string} key - Cache key
   * @returns {any|null} Cached data or null if not found/expired
   */
  get(key) {
    const item = this.cache.get(key);
    
    if (!item) {
      if (this.debug) {
        console.log(`[CacheManager] Cache miss for '${key}'`);
      }
      return null;
    }
    
    const now = Date.now();
    
    // Check if expired
    if (now > item.expires) {
      this.cache.delete(key);
      this.accessTimes.delete(key);
      
      if (this.debug) {
        console.log(`[CacheManager] Cache expired for '${key}'`);
      }
      return null;
    }
    
    // Update access time for LRU
    this.accessTimes.set(key, now);
    
    if (this.debug) {
      console.log(`[CacheManager] Cache hit for '${key}'`);
    }
    
    return item.data;
  }

  /**
   * Check if key exists and is not expired
   * @param {string} key - Cache key
   * @returns {boolean} True if key exists and is valid
   */
  has(key) {
    const item = this.cache.get(key);
    if (!item) return false;
    
    const now = Date.now();
    if (now > item.expires) {
      this.cache.delete(key);
      this.accessTimes.delete(key);
      return false;
    }
    
    return true;
  }

  /**
   * Invalidate cache entries matching a pattern
   * @param {string|RegExp} pattern - Pattern to match keys
   */
  invalidate(pattern) {
    const keysToDelete = [];
    
    for (const key of this.cache.keys()) {
      if (typeof pattern === 'string') {
        if (key.includes(pattern)) {
          keysToDelete.push(key);
        }
      } else if (pattern instanceof RegExp) {
        if (pattern.test(key)) {
          keysToDelete.push(key);
        }
      }
    }
    
    keysToDelete.forEach(key => {
      this.cache.delete(key);
      this.accessTimes.delete(key);
    });
    
    if (this.debug && keysToDelete.length > 0) {
      console.log(`[CacheManager] Invalidated ${keysToDelete.length} entries matching pattern:`, pattern);
    }
  }

  /**
   * Remove expired entries
   */
  cleanup() {
    const now = Date.now();
    const keysToDelete = [];
    
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expires) {
        keysToDelete.push(key);
      }
    }
    
    keysToDelete.forEach(key => {
      this.cache.delete(key);
      this.accessTimes.delete(key);
    });
    
    if (this.debug && keysToDelete.length > 0) {
      console.log(`[CacheManager] Cleaned up ${keysToDelete.length} expired entries`);
    }
  }

  /**
   * Evict oldest accessed item (LRU)
   */
  evictOldest() {
    let oldestKey = null;
    let oldestTime = Date.now();
    
    for (const [key, time] of this.accessTimes.entries()) {
      if (time < oldestTime) {
        oldestTime = time;
        oldestKey = key;
      }
    }
    
    if (oldestKey) {
      this.cache.delete(oldestKey);
      this.accessTimes.delete(oldestKey);
      
      if (this.debug) {
        console.log(`[CacheManager] Evicted oldest entry: '${oldestKey}'`);
      }
    }
  }

  /**
   * Get cache statistics
   * @returns {object} Cache statistics
   */
  getStats() {
    const now = Date.now();
    let expiredCount = 0;
    
    for (const item of this.cache.values()) {
      if (now > item.expires) {
        expiredCount++;
      }
    }
    
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      expired: expiredCount,
      valid: this.cache.size - expiredCount,
      maxAge: this.maxAge
    };
  }

  /**
   * Clear all cache entries
   */
  clear() {
    this.cache.clear();
    this.accessTimes.clear();
    
    if (this.debug) {
      console.log(`[CacheManager] Cache cleared`);
    }
  }

  /**
   * Destroy cache manager and cleanup intervals
   */
  destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    
    this.clear();
    
    if (this.debug) {
      console.log(`[CacheManager] Cache manager destroyed`);
    }
  }
}
