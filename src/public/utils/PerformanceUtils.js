// Performance utilities for throttling and monitoring

/**
 * Throttle function calls to a maximum frequency
 * @param {function} func - Function to throttle
 * @param {number} limit - Maximum calls per period (e.g., 60 for 60fps)
 * @param {number} period - Period in milliseconds (default 1000)
 * @returns {function} Throttled function
 */
export function throttle(func, limit = 60, period = 1000) {
  let inThrottle = false;
  let lastCallTime = 0;
  let callCount = 0;
  
  return function(...args) {
    const now = Date.now();
    
    // Reset counter if period has passed
    if (now - lastCallTime >= period) {
      callCount = 0;
      lastCallTime = now;
    }
    
    // Check if we've exceeded the limit
    if (callCount >= limit) {
      return;
    }
    
    if (!inThrottle) {
      func.apply(this, args);
      callCount++;
      inThrottle = true;
      
      // Use RAF for smooth 60fps updates or setTimeout for other frequencies
      if (limit === 60 && period === 1000) {
        requestAnimationFrame(() => {
          inThrottle = false;
        });
      } else {
        setTimeout(() => {
          inThrottle = false;
        }, period / limit);
      }
    }
  };
}

/**
 * Debounce function calls
 * @param {function} func - Function to debounce
 * @param {number} delay - Delay in milliseconds
 * @returns {function} Debounced function
 */
export function debounce(func, delay) {
  let timeoutId;
  
  return function(...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(this, args), delay);
  };
}

/**
 * Performance monitor for tracking timeline interactions
 */
export class PerformanceMonitor {
  constructor(options = {}) {
    this.frameRate = options.frameRate || 60;
    this.sampleWindow = options.sampleWindow || 1000; // 1 second
    this.debug = options.debug || false;
    
    // Performance tracking
    this.frameTimes = [];
    this.updateTimes = [];
    this.lastFrameTime = 0;
    this.frameCount = 0;
    this.updateCount = 0;
    
    // Memory tracking
    this.memorySnapshots = [];
    this.lastMemoryCheck = 0;
    
    // Event tracking
    this.eventCounts = new Map();
    this.averageEventLatency = new Map();
    
    this.startTime = performance.now();
    this.isMonitoring = false;
  }

  /**
   * Start monitoring performance
   */
  start() {
    this.isMonitoring = true;
    this.startTime = performance.now();
    
    if (this.debug) {
      console.log('[PerformanceMonitor] Started monitoring');
    }
  }

  /**
   * Stop monitoring performance
   */
  stop() {
    this.isMonitoring = false;
    
    if (this.debug) {
      console.log('[PerformanceMonitor] Stopped monitoring');
    }
  }

  /**
   * Mark the start of a frame update
   */
  markFrameStart() {
    if (!this.isMonitoring) return;
    
    const now = performance.now();
    
    if (this.lastFrameTime > 0) {
      const frameTime = now - this.lastFrameTime;
      this.addFrameTime(frameTime);
    }
    
    this.lastFrameTime = now;
    this.frameCount++;
  }

  /**
   * Mark the end of a frame update
   */
  markFrameEnd() {
    if (!this.isMonitoring) return;
    
    const now = performance.now();
    const updateTime = now - this.lastFrameTime;
    this.addUpdateTime(updateTime);
    this.updateCount++;
  }

  /**
   * Track an event with optional latency
   */
  trackEvent(eventName, latency = null) {
    if (!this.isMonitoring) return;
    
    // Count events
    const currentCount = this.eventCounts.get(eventName) || 0;
    this.eventCounts.set(eventName, currentCount + 1);
    
    // Track latency if provided
    if (latency !== null) {
      const currentAvg = this.averageEventLatency.get(eventName) || { total: 0, count: 0 };
      currentAvg.total += latency;
      currentAvg.count++;
      this.averageEventLatency.set(eventName, currentAvg);
    }
  }

  /**
   * Add frame time sample
   */
  addFrameTime(frameTime) {
    this.frameTimes.push({
      time: frameTime,
      timestamp: performance.now()
    });
    
    // Keep only recent samples
    this.cleanupOldSamples(this.frameTimes);
  }

  /**
   * Add update time sample
   */
  addUpdateTime(updateTime) {
    this.updateTimes.push({
      time: updateTime,
      timestamp: performance.now()
    });
    
    // Keep only recent samples
    this.cleanupOldSamples(this.updateTimes);
  }

  /**
   * Cleanup old samples outside the window
   */
  cleanupOldSamples(samples) {
    const now = performance.now();
    const cutoff = now - this.sampleWindow;
    
    while (samples.length > 0 && samples[0].timestamp < cutoff) {
      samples.shift();
    }
  }

  /**
   * Take a memory snapshot
   */
  takeMemorySnapshot() {
    if (!this.isMonitoring) return;
    
    const now = performance.now();
    
    // Only take snapshots every 5 seconds to avoid overhead
    if (now - this.lastMemoryCheck < 5000) return;
    
    if (performance.memory) {
      this.memorySnapshots.push({
        timestamp: now,
        used: performance.memory.usedJSHeapSize,
        total: performance.memory.totalJSHeapSize,
        limit: performance.memory.jsHeapSizeLimit
      });
      
      // Keep only last 20 snapshots
      if (this.memorySnapshots.length > 20) {
        this.memorySnapshots.shift();
      }
    }
    
    this.lastMemoryCheck = now;
  }

  /**
   * Get current performance statistics
   */
  getStats() {
    if (!this.isMonitoring) {
      return { monitoring: false };
    }
    
    const now = performance.now();
    const runtime = now - this.startTime;
    
    // Calculate frame rate
    const recentFrameTimes = this.frameTimes.filter(f => now - f.timestamp < this.sampleWindow);
    const avgFrameTime = recentFrameTimes.length > 0 
      ? recentFrameTimes.reduce((sum, f) => sum + f.time, 0) / recentFrameTimes.length
      : 0;
    const currentFPS = avgFrameTime > 0 ? 1000 / avgFrameTime : 0;
    
    // Calculate update times
    const recentUpdateTimes = this.updateTimes.filter(u => now - u.timestamp < this.sampleWindow);
    const avgUpdateTime = recentUpdateTimes.length > 0
      ? recentUpdateTimes.reduce((sum, u) => sum + u.time, 0) / recentUpdateTimes.length
      : 0;
    
    // Calculate event statistics
    const eventStats = {};
    this.eventCounts.forEach((count, eventName) => {
      const latencyData = this.averageEventLatency.get(eventName);
      eventStats[eventName] = {
        count,
        averageLatency: latencyData ? latencyData.total / latencyData.count : 0
      };
    });
    
    // Memory statistics
    const latestMemory = this.memorySnapshots[this.memorySnapshots.length - 1];
    const memoryTrend = this.calculateMemoryTrend();
    
    return {
      monitoring: true,
      runtime: Math.round(runtime),
      
      // Frame rate
      currentFPS: Math.round(currentFPS * 10) / 10,
      targetFPS: this.frameRate,
      frameCount: this.frameCount,
      avgFrameTime: Math.round(avgFrameTime * 100) / 100,
      
      // Update performance
      updateCount: this.updateCount,
      avgUpdateTime: Math.round(avgUpdateTime * 100) / 100,
      updatesPerSecond: recentUpdateTimes.length,
      
      // Events
      eventStats,
      
      // Memory
      memory: latestMemory ? {
        used: Math.round(latestMemory.used / 1024 / 1024), // MB
        total: Math.round(latestMemory.total / 1024 / 1024), // MB
        trend: memoryTrend
      } : null,
      
      // Performance indicators
      isDroppingFrames: currentFPS < this.frameRate * 0.9,
      isSlowUpdates: avgUpdateTime > (1000 / this.frameRate),
      isHighMemoryUsage: latestMemory ? (latestMemory.used / latestMemory.limit) > 0.8 : false
    };
  }

  /**
   * Calculate memory usage trend
   */
  calculateMemoryTrend() {
    if (this.memorySnapshots.length < 2) return 'stable';
    
    const recent = this.memorySnapshots.slice(-5); // Last 5 snapshots
    const first = recent[0];
    const last = recent[recent.length - 1];
    
    const change = last.used - first.used;
    const changePercent = (change / first.used) * 100;
    
    if (changePercent > 10) return 'increasing';
    if (changePercent < -10) return 'decreasing';
    return 'stable';
  }

  /**
   * Reset all statistics
   */
  reset() {
    this.frameTimes = [];
    this.updateTimes = [];
    this.memorySnapshots = [];
    this.eventCounts.clear();
    this.averageEventLatency.clear();
    
    this.frameCount = 0;
    this.updateCount = 0;
    this.lastFrameTime = 0;
    this.lastMemoryCheck = 0;
    this.startTime = performance.now();
    
    if (this.debug) {
      console.log('[PerformanceMonitor] Statistics reset');
    }
  }
}

/**
 * Global performance monitor instance
 */
export const performanceMonitor = new PerformanceMonitor({
  debug: typeof window !== 'undefined' && window.location?.hostname === 'localhost'
});
