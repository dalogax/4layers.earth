// Animation utilities for smooth value transitions and counter animations

/**
 * Counter animation utility for smoothly animating numeric values
 */
export class CounterAnimation {
  constructor(element, options = {}) {
    this.element = element;
    this.duration = options.duration || 400;
    this.easing = options.easing || this.easeOutCubic;
    this.decimals = options.decimals || 0;
    this.suffix = options.suffix || '';
    this.prefix = options.prefix || '';
    
    this.currentValue = 0;
    this.targetValue = 0;
    this.animationId = null;
  }

  /**
   * Animate to a new target value
   */
  animateTo(newValue) {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }

    const startValue = this.currentValue;
    const endValue = parseFloat(newValue) || 0;
    const startTime = performance.now();

    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / this.duration, 1);
      
      const easedProgress = this.easing(progress);
      const currentValue = startValue + (endValue - startValue) * easedProgress;
      
      this.currentValue = currentValue;
      this.updateDisplay(currentValue);
      
      if (progress < 1) {
        this.animationId = requestAnimationFrame(animate);
      } else {
        this.currentValue = endValue;
        this.targetValue = endValue;
        this.updateDisplay(endValue);
        this.animationId = null;
      }
    };

    this.targetValue = endValue;
    this.animationId = requestAnimationFrame(animate);
  }

  /**
   * Update the display with the current animated value
   */
  updateDisplay(value) {
    const formattedValue = this.decimals > 0 
      ? value.toFixed(this.decimals)
      : Math.round(value);
    
    this.element.textContent = `${this.prefix}${formattedValue}${this.suffix}`;
  }

  /**
   * Set initial value without animation
   */
  setValue(value) {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
    
    this.currentValue = parseFloat(value) || 0;
    this.targetValue = this.currentValue;
    this.updateDisplay(this.currentValue);
  }

  /**
   * Easing function for smooth animation
   */
  easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
  }

  /**
   * Cleanup animation
   */
  destroy() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }
}

/**
 * Text transition utility for smooth text changes
 */
export class TextTransition {
  constructor(element, options = {}) {
    this.element = element;
    this.duration = options.duration || 300;
    this.fadeOut = options.fadeOut || 150;
    this.fadeIn = options.fadeIn || 150;
    
    this.isTransitioning = false;
  }

  /**
   * Smoothly transition to new text content
   */
  async transitionTo(newText) {
    if (this.isTransitioning) return;
    
    this.isTransitioning = true;
    
    // Fade out current text
    this.element.style.transition = `opacity ${this.fadeOut}ms ease-out`;
    this.element.style.opacity = '0';
    
    // Wait for fade out to complete
    await new Promise(resolve => setTimeout(resolve, this.fadeOut));
    
    // Update text content
    this.element.textContent = newText;
    
    // Fade in new text
    this.element.style.transition = `opacity ${this.fadeIn}ms ease-in`;
    this.element.style.opacity = '1';
    
    // Wait for fade in to complete
    await new Promise(resolve => setTimeout(resolve, this.fadeIn));
    
    this.isTransitioning = false;
  }

  /**
   * Set text immediately without transition
   */
  setText(text) {
    if (this.isTransitioning) return;
    
    this.element.style.transition = 'none';
    this.element.style.opacity = '1';
    this.element.textContent = text;
  }
}

/**
 * Value interpolation utility for smooth data transitions
 */
export class ValueInterpolator {
  constructor() {
    this.cache = new Map();
  }

  /**
   * Interpolate between two data points based on time
   */
  interpolate(startData, endData, progress) {
    const clampedProgress = Math.max(0, Math.min(1, progress));
    
    if (clampedProgress === 0) return startData;
    if (clampedProgress === 1) return endData;
    
    const result = { ...startData };
    
    // Interpolate metrics
    if (startData.metrics && endData.metrics) {
      result.metrics = this.interpolateMetrics(
        startData.metrics,
        endData.metrics,
        clampedProgress
      );
    }
    
    return result;
  }

  /**
   * Interpolate weather metrics
   */
  interpolateMetrics(startMetrics, endMetrics, progress) {
    const interpolated = { ...startMetrics };
    
    // Temperature interpolation
    if (startMetrics.temperature && endMetrics.temperature) {
      interpolated.temperature = {
        ...startMetrics.temperature,
        current: this.lerp(
          startMetrics.temperature.current,
          endMetrics.temperature.current,
          progress
        ),
        feelsLike: this.lerp(
          startMetrics.temperature.feelsLike,
          endMetrics.temperature.feelsLike,
          progress
        )
      };
    }
    
    // Humidity interpolation
    if (typeof startMetrics.humidity === 'number' && typeof endMetrics.humidity === 'number') {
      interpolated.humidity = Math.round(this.lerp(
        startMetrics.humidity,
        endMetrics.humidity,
        progress
      ));
    }
    
    // Pressure interpolation
    if (startMetrics.pressure && endMetrics.pressure) {
      interpolated.pressure = {
        ...startMetrics.pressure,
        current: this.lerp(
          startMetrics.pressure.current,
          endMetrics.pressure.current,
          progress
        )
      };
    }
    
    return interpolated;
  }

  /**
   * Linear interpolation between two values
   */
  lerp(start, end, t) {
    return start + (end - start) * t;
  }

  /**
   * Cache interpolated values for performance
   */
  getCachedInterpolation(key, startData, endData, progress) {
    const cacheKey = `${key}_${progress}`;
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }
    
    const result = this.interpolate(startData, endData, progress);
    this.cache.set(cacheKey, result);
    
    // Clean cache periodically
    if (this.cache.size > 100) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    
    return result;
  }
}
