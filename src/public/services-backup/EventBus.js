// Event Bus for centralized event handling across the application

export class EventBus {
  constructor() {
    this.listeners = new Map();
    this.debug = typeof window !== 'undefined' && window.location?.hostname === 'localhost';
  }

  /**
   * Subscribe to an event
   * @param {string} eventName - Name of the event
   * @param {function} callback - Callback function
   * @returns {function} Unsubscribe function
   */
  on(eventName, callback) {
    if (!this.listeners.has(eventName)) {
      this.listeners.set(eventName, new Set());
    }
    
    this.listeners.get(eventName).add(callback);
    
    if (this.debug) {
      console.log(`[EventBus] Subscribed to '${eventName}'. Total listeners:`, this.listeners.get(eventName).size);
    }
    
    // Return unsubscribe function
    return () => this.off(eventName, callback);
  }

  /**
   * Unsubscribe from an event
   * @param {string} eventName - Name of the event
   * @param {function} callback - Callback function to remove
   */
  off(eventName, callback) {
    if (this.listeners.has(eventName)) {
      this.listeners.get(eventName).delete(callback);
      
      if (this.debug) {
        console.log(`[EventBus] Unsubscribed from '${eventName}'. Remaining listeners:`, this.listeners.get(eventName).size);
      }
    }
  }

  /**
   * Emit an event to all subscribers
   * @param {string} eventName - Name of the event
   * @param {any} data - Data to pass to listeners
   */
  emit(eventName, data) {
    if (this.debug) {
      console.log(`[EventBus] Emitting '${eventName}':`, data);
    }
    
    if (this.listeners.has(eventName)) {
      this.listeners.get(eventName).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`[EventBus] Error in listener for '${eventName}':`, error);
        }
      });
    }
  }

  /**
   * Subscribe to an event only once
   * @param {string} eventName - Name of the event
   * @param {function} callback - Callback function
   * @returns {function} Unsubscribe function
   */
  once(eventName, callback) {
    const unsubscribe = this.on(eventName, (data) => {
      unsubscribe();
      callback(data);
    });
    
    return unsubscribe;
  }

  /**
   * Get all current event listeners (for debugging)
   */
  getListeners() {
    const result = {};
    this.listeners.forEach((callbacks, eventName) => {
      result[eventName] = callbacks.size;
    });
    return result;
  }

  /**
   * Clear all listeners for an event or all events
   * @param {string} eventName - Optional event name to clear. If not provided, clears all
   */
  clear(eventName) {
    if (eventName) {
      this.listeners.delete(eventName);
      if (this.debug) {
        console.log(`[EventBus] Cleared all listeners for '${eventName}'`);
      }
    } else {
      this.listeners.clear();
      if (this.debug) {
        console.log(`[EventBus] Cleared all listeners`);
      }
    }
  }
}

// Global event bus instance
export const eventBus = new EventBus();

// Event name constants for type safety and autocomplete
export const EVENTS = {
  // Timeline events
  TIMELINE_TIME_CHANGE: 'timeline:timechange',
  TIMELINE_DRAG_START: 'timeline:dragstart',
  TIMELINE_DRAG_END: 'timeline:dragend',
  
  // Data events
  DATA_LOADING: 'data:loading',
  DATA_LOADED: 'data:loaded',
  DATA_ERROR: 'data:error',
  DATA_UPDATED: 'data:updated',
  
  // UI events
  UI_RENDER: 'ui:render',
  UI_ERROR: 'ui:error',
  
  // State events
  STATE_CHANGED: 'state:changed',
  CACHE_UPDATED: 'cache:updated'
};
