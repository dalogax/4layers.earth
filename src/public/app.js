// Simplified app for MVP - removing over-engineered Phase 1.5 complexity
import { Timeline } from './components/Timeline.js';
import { CounterAnimation, TextTransition } from './utils/AnimationUtils.js';

class WeatherApp {
  constructor() {
    this.currentLocation = { lat: 40.7128, lon: -74.0060 }; // New York default
    this.timeline = null;
    this.groundData = null;
    
    // Simple animation controllers
    this.animations = {
      temperature: null,
      humidity: null,
      pressure: null,
      temperatureDetails: null
    };
    
    this.isDragging = false;
    this.init();
  }

  async init() {
    try {
      console.log('Starting simplified app initialization...');
      
      // Request user location first
      await this.requestUserLocation();
      
      // Initialize timeline component
      this.initializeTimeline();
      
      // Initialize animations
      this.initializeAnimations();
      
      // Load initial weather data
      await this.loadCurrentWeather();
      
      // Initialize service worker
      this.initializeServiceWorker();
      
      console.log('Weather app initialized successfully');
    } catch (error) {
      console.error('Failed to initialize app:', error);
      this.initializeBasicFunctionality();
    }
  }

  async requestUserLocation() {
    if (!navigator.geolocation) {
      console.log('Geolocation not supported, using default location (New York)');
      this.updateLocationDisplay('New York, NY');
      return;
    }

    try {
      console.log('Requesting user location...');
      
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          resolve,
          reject,
          {
            enableHighAccuracy: false,
            timeout: 10000,
            maximumAge: 300000 // 5 minutes
          }
        );
      });

      this.currentLocation = {
        lat: position.coords.latitude,
        lon: position.coords.longitude
      };

      console.log('User location obtained:', this.currentLocation);
      
      // Get location name for display
      await this.getLocationName();

    } catch (error) {
      console.log('Geolocation failed, using default location:', error.message);
      this.updateLocationDisplay('New York, NY');
    }
  }

  async getLocationName() {
    try {
      // Use reverse geocoding to get location name
      const response = await fetch(`/api/ground/current?lat=${this.currentLocation.lat}&lon=${this.currentLocation.lon}`);
      
      if (response.ok) {
        const result = await response.json();
        if (result.status === 'success' && result.data.location) {
          const location = result.data.location;
          let displayName = location.city || 'Unknown Location';
          
          // Add state/country if available
          if (location.country === 'US' && location.state) {
            displayName += `, ${location.state}`;
          } else if (location.country && location.country !== 'US') {
            displayName += `, ${location.country}`;
          }
          
          this.updateLocationDisplay(displayName);
        }
      }
    } catch (error) {
      console.warn('Failed to get location name:', error.message);
      // Show coordinates if we can't get a name
      this.updateLocationDisplay(`${this.currentLocation.lat.toFixed(1)}°, ${this.currentLocation.lon.toFixed(1)}°`);
    }
  }

  updateLocationDisplay(locationName) {
    const locationElement = document.getElementById('location-display');
    if (locationElement) {
      locationElement.textContent = locationName;
      locationElement.classList.add('visible');
    }
  }

  initializeTimeline() {
    console.log('Initializing timeline...');
    
    const timelineWrapper = document.getElementById('timeline-wrapper');
    if (!timelineWrapper) {
      console.error('Timeline wrapper not found!');
      return;
    }

    try {
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
      
      console.log('Timeline component initialized successfully');
    } catch (error) {
      console.error('Error creating Timeline:', error);
    }
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
      const response = await fetch(`/api/ground/current?lat=${this.currentLocation.lat}&lon=${this.currentLocation.lon}`);
      
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
      console.warn('Failed to load weather data, using defaults:', error);
      
      // Show default/placeholder data
      const defaultData = {
        timestamp: new Date().toISOString(),
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
      // Simple API call - let the backend handle caching
      const response = await fetch(`/api/ground/timeline?lat=${this.currentLocation.lat}&lon=${this.currentLocation.lon}&hours=48`);
      
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
      console.warn('Failed to load timeline data:', error);
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
    
    try {
      const data = await this.loadTimelineData(event.timestamp);
      this.updateWeatherDisplay(data);
    } catch (error) {
      console.warn('Failed to update weather data for timeline:', error);
    }
  }

  handleDragStart(event) {
    console.log('Timeline drag started at:', event.timestamp);
    this.isDragging = true;
    document.body.classList.add('dragging');
  }

  handleDragEnd(event) {
    console.log('Timeline drag ended at:', event.timestamp);
    this.isDragging = false;
    document.body.classList.remove('dragging');
    
    // Trigger a final smooth update with the end position
    setTimeout(() => {
      this.handleTimeChange(event);
    }, 50);
  }

  initializeBasicFunctionality() {
    console.log('Falling back to basic functionality...');
    
    try {
      // Show basic timeline if possible
      const timelineWrapper = document.getElementById('timeline-wrapper');
      if (timelineWrapper && !timelineWrapper.innerHTML.trim()) {
        timelineWrapper.innerHTML = `
          <div class="timeline-container">
            <div class="timeline-track">
              <div class="timeline-center-indicator"></div>
              <div class="timeline-hours">
                <div class="hour-marker">Now</div>
              </div>
            </div>
          </div>
        `;
      }
      
      // Initialize animations if possible
      this.initializeAnimations();
      
      // Show default data
      const defaultData = {
        timestamp: new Date().toISOString(),
        metrics: {
          temperature: { current: 22, feelsLike: 24 },
          humidity: 68,
          pressure: { current: 1013 }
        }
      };
      
      this.setInitialValues(defaultData);
      console.log('Basic functionality initialized');
    } catch (error) {
      console.error('Failed to initialize basic functionality:', error);
    }
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
