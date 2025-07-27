// Ground Layer State Management with Publisher-Subscriber pattern

import { eventBus, EVENTS } from './EventBus.js';
import { ValueInterpolator } from '../utils/AnimationUtils.js';

export class GroundLayerState {
  constructor() {
    this.currentTimestamp = new Date();
    this.timelineData = new Map(); // timestamp -> GroundData
    this.subscribers = new Set();
    this.isLoading = false;
    this.error = null;
    this.lastUpdateTime = Date.now();
    
    // Interpolation utility
    this.interpolator = new ValueInterpolator();
    
    // Performance tracking
    this.updateCount = 0;
    this.lastPerformanceCheck = Date.now();
    
    this.debug = typeof window !== 'undefined' && window.location?.hostname === 'localhost';
    
    // Listen to events
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Listen for timeline changes
    eventBus.on(EVENTS.TIMELINE_TIME_CHANGE, (event) => {
      this.setCurrentTime(event.timestamp);
    });
    
    // Listen for data loading events
    eventBus.on(EVENTS.DATA_LOADED, (event) => {
      this.updateTimelineData([event.data], event.timestamp);
    });
  }

  /**
   * Set current time and emit updates
   * @param {Date|string} timestamp - New current timestamp
   */
  setCurrentTime(timestamp) {
    const newTime = new Date(timestamp);
    const oldTime = this.currentTimestamp;
    
    this.currentTimestamp = newTime;
    this.lastUpdateTime = Date.now();
    this.updateCount++;
    
    // Get interpolated data for this timestamp
    const currentData = this.getCurrentData();
    
    // Emit state change
    const stateChange = {
      timestamp: newTime,
      previousTimestamp: oldTime,
      data: currentData,
      interpolated: currentData?._interpolated || false,
      updateCount: this.updateCount
    };
    
    // Notify subscribers
    this.notifySubscribers(stateChange);
    
    // Emit global event
    eventBus.emit(EVENTS.STATE_CHANGED, stateChange);
    eventBus.emit(EVENTS.DATA_UPDATED, {
      timestamp: newTime,
      data: currentData,
      interpolated: currentData?._interpolated || false
    });
    
    if (this.debug) {
      console.log(`[GroundLayerState] Time updated to:`, newTime, 'Data:', currentData);
    }
  }

  /**
   * Update timeline data cache
   * @param {Array} dataArray - Array of GroundData objects
   * @param {Date} centerTimestamp - Center timestamp for the data
   */
  updateTimelineData(dataArray, centerTimestamp = null) {
    let addedCount = 0;
    
    dataArray.forEach(data => {
      if (data.timestamp) {
        const timestamp = new Date(data.timestamp);
        const key = this.getTimelineKey(timestamp);
        
        if (!this.timelineData.has(key)) {
          addedCount++;
        }
        
        this.timelineData.set(key, {
          ...data,
          _cached: true,
          _cacheTime: Date.now()
        });
      }
    });
    
    if (this.debug && addedCount > 0) {
      console.log(`[GroundLayerState] Added ${addedCount} new data points. Total cached: ${this.timelineData.size}`);
    }
    
    // Emit cache update event
    eventBus.emit(EVENTS.CACHE_UPDATED, {
      addedCount,
      totalSize: this.timelineData.size,
      centerTimestamp
    });
    
    // Update current data if we have new information
    const currentData = this.getCurrentData();
    if (currentData) {
      eventBus.emit(EVENTS.DATA_UPDATED, {
        timestamp: this.currentTimestamp,
        data: currentData,
        interpolated: currentData._interpolated || false
      });
    }
  }

  /**
   * Get current data with interpolation if needed
   * @returns {object|null} Current ground data
   */
  getCurrentData() {
    const currentKey = this.getTimelineKey(this.currentTimestamp);
    
    // Check if we have exact data for current time
    if (this.timelineData.has(currentKey)) {
      const data = this.timelineData.get(currentKey);
      return { ...data, _interpolated: false };
    }
    
    // Find surrounding data points for interpolation
    const surrounding = this.getSurroundingDataPoints(this.currentTimestamp);
    
    if (surrounding.exact) {
      return { ...surrounding.exact, _interpolated: false };
    }
    
    if (surrounding.before && surrounding.after) {
      // Interpolate between before and after
      const beforeTime = new Date(surrounding.before.timestamp).getTime();
      const afterTime = new Date(surrounding.after.timestamp).getTime();
      const currentTime = this.currentTimestamp.getTime();
      
      const progress = (currentTime - beforeTime) / (afterTime - beforeTime);
      const interpolated = this.interpolator.interpolate(
        surrounding.before,
        surrounding.after,
        progress
      );
      
      return {
        ...interpolated,
        timestamp: this.currentTimestamp.toISOString(),
        _interpolated: true,
        _progress: progress
      };
    }
    
    // Fallback to closest data point
    if (surrounding.closest) {
      return {
        ...surrounding.closest,
        timestamp: this.currentTimestamp.toISOString(),
        _interpolated: false,
        _fallback: true
      };
    }
    
    return null;
  }

  /**
   * Find surrounding data points for interpolation
   * @param {Date} timestamp - Target timestamp
   * @returns {object} Object with before, after, exact, and closest data points
   */
  getSurroundingDataPoints(timestamp) {
    const targetTime = timestamp.getTime();
    const targetKey = this.getTimelineKey(timestamp);
    
    // Check for exact match
    if (this.timelineData.has(targetKey)) {
      return { exact: this.timelineData.get(targetKey) };
    }
    
    let before = null;
    let after = null;
    let closest = null;
    let closestDistance = Infinity;
    
    for (const [key, data] of this.timelineData.entries()) {
      const dataTime = new Date(data.timestamp).getTime();
      const distance = Math.abs(dataTime - targetTime);
      
      // Update closest
      if (distance < closestDistance) {
        closestDistance = distance;
        closest = data;
      }
      
      // Update before/after
      if (dataTime < targetTime && (!before || dataTime > new Date(before.timestamp).getTime())) {
        before = data;
      } else if (dataTime > targetTime && (!after || dataTime < new Date(after.timestamp).getTime())) {
        after = data;
      }
    }
    
    return { before, after, closest };
  }

  /**
   * Subscribe to state changes
   * @param {function} callback - Callback function
   * @returns {function} Unsubscribe function
   */
  subscribe(callback) {
    this.subscribers.add(callback);
    
    if (this.debug) {
      console.log(`[GroundLayerState] New subscriber added. Total: ${this.subscribers.size}`);
    }
    
    // Return unsubscribe function
    return () => this.unsubscribe(callback);
  }

  /**
   * Unsubscribe from state changes
   * @param {function} callback - Callback function to remove
   */
  unsubscribe(callback) {
    this.subscribers.delete(callback);
    
    if (this.debug) {
      console.log(`[GroundLayerState] Subscriber removed. Total: ${this.subscribers.size}`);
    }
  }

  /**
   * Notify all subscribers
   * @param {object} stateChange - State change data
   */
  notifySubscribers(stateChange) {
    this.subscribers.forEach(callback => {
      try {
        callback(stateChange);
      } catch (error) {
        console.error(`[GroundLayerState] Error in subscriber callback:`, error);
      }
    });
  }

  /**
   * Generate timeline key for consistent caching
   * @param {Date} timestamp - Timestamp
   * @returns {string} Timeline key
   */
  getTimelineKey(timestamp) {
    // Round to nearest hour for consistent caching
    const date = new Date(timestamp);
    date.setMinutes(0, 0, 0);
    return date.toISOString();
  }

  /**
   * Get state statistics
   * @returns {object} State statistics
   */
  getStats() {
    const now = Date.now();
    const performanceWindow = now - this.lastPerformanceCheck;
    const updatesPerSecond = this.updateCount / (performanceWindow / 1000);
    
    return {
      currentTimestamp: this.currentTimestamp,
      cachedDataPoints: this.timelineData.size,
      subscribers: this.subscribers.size,
      isLoading: this.isLoading,
      error: this.error,
      updateCount: this.updateCount,
      updatesPerSecond: Math.round(updatesPerSecond * 100) / 100,
      lastUpdateTime: this.lastUpdateTime,
      memoryUsage: this.getMemoryUsage()
    };
  }

  /**
   * Estimate memory usage
   * @returns {object} Memory usage estimates
   */
  getMemoryUsage() {
    const dataSize = this.timelineData.size;
    const subscriberSize = this.subscribers.size;
    
    // Rough estimates
    const dataMemory = dataSize * 1000; // ~1KB per data point
    const subscriberMemory = subscriberSize * 100; // ~100B per subscriber
    
    return {
      estimatedDataMemory: dataMemory,
      estimatedSubscriberMemory: subscriberMemory,
      totalEstimate: dataMemory + subscriberMemory
    };
  }

  /**
   * Clear old data to prevent memory leaks
   * @param {number} maxAge - Maximum age in milliseconds
   */
  cleanupOldData(maxAge = 7 * 24 * 60 * 60 * 1000) { // 1 week default
    const now = Date.now();
    const keysToDelete = [];
    
    for (const [key, data] of this.timelineData.entries()) {
      const dataAge = now - new Date(data.timestamp).getTime();
      if (dataAge > maxAge) {
        keysToDelete.push(key);
      }
    }
    
    keysToDelete.forEach(key => this.timelineData.delete(key));
    
    if (this.debug && keysToDelete.length > 0) {
      console.log(`[GroundLayerState] Cleaned up ${keysToDelete.length} old data points`);
    }
  }

  /**
   * Destroy state manager and cleanup
   */
  destroy() {
    this.subscribers.clear();
    this.timelineData.clear();
    
    if (this.debug) {
      console.log(`[GroundLayerState] State manager destroyed`);
    }
  }
}
