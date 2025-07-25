// Main application logic
import { Timeline } from './components/Timeline.js';

class WeatherApp {
  constructor() {
    this.currentLocation = { lat: 40.7128, lon: -74.0060 }; // New York default
    this.timeline = null;
    this.groundData = null;
    
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

    console.log('Timeline component initialized');
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
      this.updateWeatherDisplay(this.groundData);
      
      console.log('Current weather data loaded:', this.groundData);
    } catch (error) {
      console.error('Failed to load weather data:', error);
      this.showError('Failed to load weather data. Using default values.');
      
      // Show default/placeholder data
      this.updateWeatherDisplay({
        metrics: {
          temperature: { current: 22, feelsLike: 24 },
          humidity: 68,
          pressure: { current: 1013 }
        }
      });
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
    // Update temperature
    const tempDisplay = document.getElementById('temperature-display');
    if (tempDisplay && data.metrics?.temperature) {
      const tempValue = tempDisplay.querySelector('.metric-value');
      const tempDetails = tempDisplay.querySelector('.metric-details');
      
      if (tempValue) {
        tempValue.textContent = `${Math.round(data.metrics.temperature.current)}°`;
      }
      
      if (tempDetails && data.metrics.temperature.feelsLike) {
        tempDetails.textContent = `feels like ${Math.round(data.metrics.temperature.feelsLike)}°`;
      }
    }

    // Update humidity
    const humidityDisplay = document.getElementById('humidity-display');
    if (humidityDisplay && data.metrics?.humidity) {
      const humidityValue = humidityDisplay.querySelector('.metric-value');
      
      if (humidityValue) {
        humidityValue.textContent = `${data.metrics.humidity}%`;
      }
    }

    // Update pressure
    const pressureDisplay = document.getElementById('pressure-display');
    if (pressureDisplay && data.metrics?.pressure) {
      const pressureValue = pressureDisplay.querySelector('.metric-value');
      
      if (pressureValue) {
        pressureValue.textContent = Math.round(data.metrics.pressure.current);
      }
    }
  }

  async handleTimeChange(event) {
    console.log('Time changed to:', event.timestamp);
    
    // In Phase 1.5, this will trigger real-time data updates
    // For now, we'll simulate the behavior
    try {
      const data = await this.loadTimelineData(event.timestamp);
      this.updateWeatherDisplay(data);
    } catch (error) {
      console.error('Failed to update weather data for timeline:', error);
    }
  }

  handleDragStart(event) {
    console.log('Timeline drag started at:', event.timestamp);
    // Add visual feedback for drag start if needed
  }

  handleDragEnd(event) {
    console.log('Timeline drag ended at:', event.timestamp);
    // Add visual feedback for drag end if needed
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
