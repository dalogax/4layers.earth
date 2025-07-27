// Main application logic
import { Timeline } from './components/Timeline.js';
import { CounterAnimation, TextTransition, ValueInterpolator } from './utils/AnimationUtils.js';

class WeatherApp {
  constructor() {
    this.currentLocation = { lat: 40.7128, lon: -74.0060 }; // New York default
    this.timeline = null;
    this.groundData = null;
    
    // Animation controllers
    this.animations = {
      temperature: null,
      humidity: null,
      pressure: null,
      temperatureDetails: null
    };
    
    this.valueInterpolator = new ValueInterpolator();
    this.isDragging = false;
    
    this.init();
  }

  async init() {
    try {
      // Initialize timeline component
      this.initializeTimeline();
      
      // Load initial weather data
      await this.loadCurrentWeather();
      
      // Initialize service worker
      this.initializeServiceWorker();
      
      console.log('Weather app initialized successfully');
    } catch (error) {
      console.error('Failed to initialize app:', error);
    }
  }

  initializeTimeline() {
    const timelineWrapper = document.getElementById('timeline-wrapper');
    if (!timelineWrapper) {
      throw new Error('Timeline wrapper not found');
    }

    this.timeline = new Timeline(timelineWrapper, {
      totalHours: 48,
      centerHour: 24,
      snapToHour: true,
      showCurrentTime: true,
      touchEnabled: true,
      keyboardEnabled: true,
      onTimeChange: this.handleTimeChange.bind(this),
      onDragStart: this.handleDragStart.bind(this),
      onDragEnd: this.handleDragEnd.bind(this)
    });

    // Initialize animation controllers after timeline is created
    this.initializeAnimations();

    console.log('Timeline component initialized');
  }

  initializeAnimations() {
    // Initialize counter animations for numeric values
    const tempValue = document.querySelector('#temperature-display .metric-value');
    if (tempValue) {
      this.animations.temperature = new CounterAnimation(tempValue, {
        duration: 400,
        decimals: 0,
        suffix: '°'
      });
    }

    const humidityValue = document.querySelector('#humidity-display .metric-value');
    if (humidityValue) {
      this.animations.humidity = new CounterAnimation(humidityValue, {
        duration: 400,
        decimals: 0,
        suffix: '%'
      });
    }

    const pressureValue = document.querySelector('#pressure-display .metric-value');
    if (pressureValue) {
      this.animations.pressure = new CounterAnimation(pressureValue, {
        duration: 400,
        decimals: 0
      });
    }

    // Initialize text transitions for details
    const tempDetails = document.querySelector('#temperature-display .metric-details');
    if (tempDetails) {
      this.animations.temperatureDetails = new TextTransition(tempDetails, {
        duration: 300
      });
    }

    console.log('Animation controllers initialized');
  }

  async loadCurrentWeather() {
    try {
      const response = await fetch(
        `/api/ground/current?lat=${this.currentLocation.lat}&lon=${this.currentLocation.lon}`
      );
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Failed to fetch weather data`);
      }
      
      const result = await response.json();
      
      if (result.status !== 'success') {
        throw new Error(result.message || 'Invalid API response');
      }
      
      this.groundData = result.data;
      
      // Set initial values without animation
      this.setInitialValues(this.groundData);
      
      console.log('Current weather data loaded:', this.groundData);
    } catch (error) {
      console.error('Failed to load weather data:', error);
      this.showError('Failed to load weather data. Using default values.');
      
      // Show default/placeholder data
      const defaultData = {
        metrics: {
          temperature: { current: 22, feelsLike: 24 },
          humidity: 68,
          pressure: { current: 1013 }
        }
      };
      
      this.setInitialValues(defaultData);
    }
  }

  setInitialValues(data) {
    // Set initial values immediately without animations
    if (data.metrics?.temperature && this.animations.temperature) {
      this.animations.temperature.setValue(Math.round(data.metrics.temperature.current));
    }
    
    if (data.metrics?.humidity && this.animations.humidity) {
      this.animations.humidity.setValue(data.metrics.humidity);
    }
    
    if (data.metrics?.pressure?.current && this.animations.pressure) {
      this.animations.pressure.setValue(Math.round(data.metrics.pressure.current));
    }
    
    if (data.metrics?.temperature?.feelsLike && this.animations.temperatureDetails) {
      const detailsText = `feels like ${Math.round(data.metrics.temperature.feelsLike)}°`;
      this.animations.temperatureDetails.setText(detailsText);
    }
  }

  async loadTimelineData(timestamp) {
    try {
      // For now, just load current data
      // In Phase 1.5, this will load proper timeline data
      const response = await fetch(
        `/api/ground/timeline?lat=${this.currentLocation.lat}&lon=${this.currentLocation.lon}&hours=48`
      );
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Failed to fetch timeline data`);
      }
      
      const result = await response.json();
      
      if (result.status !== 'success') {
        throw new Error(result.message || 'Invalid API response');
      }
      
      // Find the data point closest to the selected timestamp
      const targetTime = timestamp.getTime();
      let closestData = result.data[0];
      let closestDiff = Math.abs(new Date(closestData.timestamp).getTime() - targetTime);
      
      result.data.forEach(dataPoint => {
        const diff = Math.abs(new Date(dataPoint.timestamp).getTime() - targetTime);
        if (diff < closestDiff) {
          closestDiff = diff;
          closestData = dataPoint;
        }
      });
      
      return closestData;
    } catch (error) {
      console.error('Failed to load timeline data:', error);
      return this.groundData; // Fallback to current data
    }
  }

  updateWeatherDisplay(data) {
    // Use smooth animations for value updates
    if (data.metrics?.temperature) {
      // Animate temperature value
      if (this.animations.temperature) {
        this.animations.temperature.animateTo(Math.round(data.metrics.temperature.current));
      }
      
      // Animate temperature details text
      if (this.animations.temperatureDetails && data.metrics.temperature.feelsLike) {
        const detailsText = `feels like ${Math.round(data.metrics.temperature.feelsLike)}°`;
        if (this.isDragging) {
          // During dragging, update immediately for responsiveness
          this.animations.temperatureDetails.setText(detailsText);
        } else {
          // When not dragging, use smooth transition
          this.animations.temperatureDetails.transitionTo(detailsText);
        }
      }
    }

    // Animate humidity value
    if (data.metrics?.humidity && this.animations.humidity) {
      this.animations.humidity.animateTo(data.metrics.humidity);
    }

    // Animate pressure value
    if (data.metrics?.pressure?.current && this.animations.pressure) {
      this.animations.pressure.animateTo(Math.round(data.metrics.pressure.current));
    }
  }

  async handleTimeChange(event) {
    console.log('Time changed to:', event.timestamp);
    
    // Smooth interpolation during timeline scrubbing
    try {
      const data = await this.loadTimelineData(event.timestamp);
      
      // Apply smooth transitions during timeline interaction
      this.updateWeatherDisplay(data);
    } catch (error) {
      console.error('Failed to update weather data for timeline:', error);
    }
  }

  handleDragStart(event) {
    console.log('Timeline drag started at:', event.timestamp);
    this.isDragging = true;
    
    // Switch to immediate updates during dragging for responsiveness
    document.body.classList.add('dragging');
  }

  handleDragEnd(event) {
    console.log('Timeline drag ended at:', event.timestamp);
    this.isDragging = false;
    
    // Resume smooth animations after dragging
    document.body.classList.remove('dragging');
    
    // Trigger a final smooth update with the end position
    setTimeout(() => {
      this.handleTimeChange(event);
    }, 50);
  }

  initializeServiceWorker() {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/service-worker.js')
        .then(registration => {
          console.log('Service Worker registered:', registration);
        })
        .catch(error => {
          console.log('Service Worker registration failed:', error);
        });
    }
  }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.weatherApp = new WeatherApp();
});
