/**
 * Timeline Component - Horizontal scrolling timeline for time navigation
 * 
 * Features:
 * - Touch and mouse support for scrubbing through time
 * - Snap to hour boundaries
 * - 48-hour range (24h past + 24h future)
 * - Responsive design with proper touch targets
 * - Keyboard accessibility
 */
export class Timeline {
  constructor(container, options = {}) {
    this.container = container;
    this.options = {
      totalHours: 48,
      centerHour: 24, // Current time at center
      snapToHour: true,
      showCurrentTime: true,
      touchEnabled: true,
      keyboardEnabled: true,
      debounceDelay: 200, // ms to wait before triggering weather fetch
      ...options
    };

    this.currentTimestamp = new Date();
    this.isDragging = false;
    this.dragStartX = 0;
    this.scrollPosition = 0;
    this.timelineWidth = 0;
    this.hourWidth = 0;
    this.debounceTimeout = null;
    
    this.callbacks = {
      onTimeChange: options.onTimeChange || (() => {}),
      onDragStart: options.onDragStart || (() => {}),
      onDragEnd: options.onDragEnd || (() => {})
    };

    this.init();
  }

  /**
   * Initialize the timeline component
   */
  init() {
    console.log('Timeline init() called');
    this.initialized = false;
    
    try {
      console.log('Rendering timeline...');
      this.render();
      console.log('Timeline rendered');
      
      console.log('Setting up event listeners...');
      this.setupEventListeners();
      console.log('Event listeners setup');
      
      console.log('Calculating dimensions...');
      this.calculateDimensions();
      console.log('Dimensions calculated');
      
      console.log('Centering on current time...');
      this.centerOnCurrentTime();
      console.log('Timeline centered');
      
      this.initialized = true;
      console.log('Timeline initialization complete');
    } catch (error) {
      console.error('Timeline initialization failed:', error);
      throw error;
    }
  }

  /**
   * Render the timeline HTML structure
   */
  render() {
    this.container.innerHTML = `
      <div class="timeline-container">
        <div class="timeline-track" id="timeline-track">
          <div class="timeline-center-indicator"></div>
          <div class="timeline-hours" id="timeline-hours">
            ${this.generateHourMarkers()}
          </div>
        </div>
        <div class="timeline-current-time" id="current-time">
          ${this.formatTime(this.currentTimestamp)}
        </div>
      </div>
    `;

    this.track = this.container.querySelector('#timeline-track');
    this.hoursContainer = this.container.querySelector('#timeline-hours');
    this.currentTimeDisplay = this.container.querySelector('#current-time');
  }

  /**
   * Generate hour markers for the timeline
   */
  generateHourMarkers() {
    let markers = '';
    const startTime = new Date(this.currentTimestamp.getTime() - 24 * 60 * 60 * 1000);
    
    for (let i = 0; i < this.options.totalHours; i++) {
      const time = new Date(startTime.getTime() + i * 60 * 60 * 1000);
      const isCurrentTime = Math.abs(time.getTime() - this.currentTimestamp.getTime()) < 30 * 60 * 1000;
      
      markers += `
        <div class="hour-marker ${isCurrentTime ? 'current-time' : ''}" data-hour="${i}">
          <div class="hour-line"></div>
          <div class="hour-label">${this.formatTime(time, true)}</div>
        </div>
      `;
    }
    
    return markers;
  }

  /**
   * Setup event listeners for touch, mouse, and keyboard
   */
  setupEventListeners() {
    // Touch events - listen on entire document for page-wide dragging
    if (this.options.touchEnabled) {
      document.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false });
      document.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
      document.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: false });
    }

    // Mouse events - listen on entire document for page-wide dragging
    document.addEventListener('mousedown', this.handleMouseDown.bind(this));
    document.addEventListener('mousemove', this.handleMouseMove.bind(this));
    document.addEventListener('mouseup', this.handleMouseUp.bind(this));

    // Wheel events for precision control
    this.track.addEventListener('wheel', this.handleWheel.bind(this), { passive: false });

    // Keyboard events
    if (this.options.keyboardEnabled) {
      document.addEventListener('keydown', this.handleKeyDown.bind(this));
    }

    // Window resize
    window.addEventListener('resize', this.handleResize.bind(this));
  }

  /**
   * Handle touch start
   */
  handleTouchStart(event) {
    event.preventDefault();
    this.isDragging = true;
    this.dragStartX = event.touches[0].clientX;
    this.callbacks.onDragStart({ timestamp: this.getCurrentTimestamp() });
  }

  /**
   * Handle touch move
   */
  handleTouchMove(event) {
    if (!this.isDragging) return;
    event.preventDefault();
    
    const deltaX = event.touches[0].clientX - this.dragStartX;
    this.updateScrollPosition(deltaX);
  }

  /**
   * Handle touch end
   */
  handleTouchEnd(event) {
    if (!this.isDragging) return;
    event.preventDefault();
    
    this.isDragging = false;
    this.snapToHour();
    this.callbacks.onDragEnd({ timestamp: this.getCurrentTimestamp() });
    
    // Immediately trigger weather fetch when user stops touching
    this.emitTimeChangeImmediate();
  }

  /**
   * Handle mouse down
   */
  handleMouseDown(event) {
    this.isDragging = true;
    this.dragStartX = event.clientX;
    this.callbacks.onDragStart({ timestamp: this.getCurrentTimestamp() });
  }

  /**
   * Handle mouse move
   */
  handleMouseMove(event) {
    if (!this.isDragging) return;
    
    const deltaX = event.clientX - this.dragStartX;
    this.updateScrollPosition(deltaX);
  }

  /**
   * Handle mouse up
   */
  handleMouseUp(event) {
    if (!this.isDragging) return;
    
    this.isDragging = false;
    this.snapToHour();
    this.callbacks.onDragEnd({ timestamp: this.getCurrentTimestamp() });
    
    // Immediately trigger weather fetch when user stops dragging
    this.emitTimeChangeImmediate();
  }

  /**
   * Handle wheel events for precision scrolling
   */
  handleWheel(event) {
    event.preventDefault();
    
    const deltaX = event.deltaX * 2; // Amplify for better control
    this.updateScrollPosition(-deltaX);
    
    // Debounced snap to hour and weather fetch
    clearTimeout(this.wheelTimeout);
    this.wheelTimeout = setTimeout(() => {
      this.snapToHour();
    }, 150);
  }

  /**
   * Handle keyboard navigation
   */
  handleKeyDown(event) {
    let hoursToMove = 0;
    
    switch (event.key) {
      case 'ArrowLeft':
        hoursToMove = -0.25; // 15 minutes back
        break;
      case 'ArrowRight':
        hoursToMove = 0.25; // 15 minutes forward
        break;
      case 'Home':
        this.centerOnCurrentTime();
        return;
      case 'PageUp':
        hoursToMove = -1; // 1 hour back
        break;
      case 'PageDown':
        hoursToMove = 1; // 1 hour forward
        break;
      default:
        return;
    }
    
    event.preventDefault();
    this.moveByHours(hoursToMove);
  }

  /**
   * Handle window resize
   */
  handleResize() {
    this.calculateDimensions();
    this.updateTimelinePosition();
  }

  /**
   * Update scroll position and timeline position
   */
  updateScrollPosition(deltaX) {
    this.scrollPosition += deltaX;
    
    // Update timeline position (timeline moves, center stays fixed)
    this.updateTimelinePosition();
    this.updateTimeDisplay();
    
    // Reset drag start for continuous dragging
    this.dragStartX += deltaX;
  }

  /**
   * Update timeline position (moves the timeline markers)
   */
  updateTimelinePosition() {
    // Move the timeline hours container
    this.hoursContainer.style.transform = `translateX(${-this.scrollPosition}px)`;
    
    // Only emit time change if we're not in initialization
    if (this.initialized) {
      this.emitTimeChange();
    }
  }

  /**
   * Snap to the nearest hour boundary
   */
  snapToHour() {
    if (!this.options.snapToHour) return;
    
    const targetHour = Math.round(this.scrollPosition / this.hourWidth);
    const targetPosition = targetHour * this.hourWidth;
    
    // Smooth animation to snap position
    this.animateToPosition(targetPosition);
  }

  /**
   * Animate to a specific scroll position
   */
  animateToPosition(targetPosition, duration = 300) {
    const startPosition = this.scrollPosition;
    const distance = targetPosition - startPosition;
    const startTime = performance.now();
    
    // Add animating class for smooth transition
    this.hoursContainer.classList.add('animating');
    
    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function (ease-out)
      const easedProgress = 1 - Math.pow(1 - progress, 3);
      
      this.scrollPosition = startPosition + distance * easedProgress;
      this.updateTimelinePosition();
      this.updateTimeDisplay();
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        this.hoursContainer.classList.remove('animating');
        this.emitTimeChangeImmediate();
      }
    };
    
    requestAnimationFrame(animate);
  }

  /**
   * Move timeline by a specific number of hours
   */
  moveByHours(hours) {
    const deltaPosition = hours * this.hourWidth;
    const targetPosition = this.scrollPosition + deltaPosition;
    
    this.animateToPosition(targetPosition);
  }

  /**
   * Center timeline on current time
   */
  centerOnCurrentTime() {
    // Reset scroll position to center the current time
    this.scrollPosition = this.options.centerHour * this.hourWidth;
    this.updateTimelinePosition();
    this.updateTimeDisplay();
  }

  /**
   * Calculate component dimensions
   */
  calculateDimensions() {
    this.timelineWidth = this.options.totalHours * 80; // 80px per hour (responsive)
    this.hourWidth = this.timelineWidth / this.options.totalHours;
    
    // Set responsive hour width based on screen size
    if (window.innerWidth <= 480) {
      this.hourWidth = 50;
    } else if (window.innerWidth <= 768) {
      this.hourWidth = 60;
    } else {
      this.hourWidth = 80;
    }
    
    this.timelineWidth = this.options.totalHours * this.hourWidth;
  }

  /**
   * Get current timestamp based on center position
   */
  getCurrentTimestamp() {
    // The center is always the current viewing time
    // Calculate based on how much the timeline has moved from center
    const centerOffset = this.scrollPosition / this.hourWidth;
    const hoursFromCurrentTime = centerOffset - this.options.centerHour;
    
    return new Date(this.currentTimestamp.getTime() + hoursFromCurrentTime * 60 * 60 * 1000);
  }

  /**
   * Update time display
   */
  updateTimeDisplay() {
    const timestamp = this.getCurrentTimestamp();
    const now = new Date();
    const diffMs = timestamp.getTime() - now.getTime();
    const diffHours = Math.round(diffMs / (60 * 60 * 1000));
    
    let displayText;
    if (Math.abs(diffHours) < 1) {
      displayText = `Now: ${this.formatTime(now)}`;
    } else if (diffHours > 0) {
      displayText = `+${diffHours}h: ${this.formatTime(timestamp)}`;
    } else {
      displayText = `${diffHours}h: ${this.formatTime(timestamp)}`;
    }
    
    this.currentTimeDisplay.textContent = displayText;
  }

  /**
   * Emit time change event with debouncing
   */
  emitTimeChange() {
    // Clear any existing timeout
    if (this.debounceTimeout) {
      clearTimeout(this.debounceTimeout);
    }

    // If user is actively dragging, don't emit immediately
    if (this.isDragging) {
      return;
    }

    // Debounce the weather fetch call
    this.debounceTimeout = setTimeout(() => {
      const timestamp = this.getCurrentTimestamp();
      this.callbacks.onTimeChange({
        timestamp,
        source: this.isDragging ? 'user' : 'auto'
      });
    }, this.options.debounceDelay);
  }

  /**
   * Emit time change immediately (for when user stops interacting)
   */
  emitTimeChangeImmediate() {
    // Clear any pending debounced calls
    if (this.debounceTimeout) {
      clearTimeout(this.debounceTimeout);
    }

    const timestamp = this.getCurrentTimestamp();
    this.callbacks.onTimeChange({
      timestamp,
      source: 'user'
    });
  }

  /**
   * Format time for display
   */
  formatTime(date, shortFormat = false) {
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    
    if (shortFormat) {
      return `${displayHours}${ampm.toLowerCase()}`;
    }
    
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${ampm}`;
  }

  /**
   * Jump to a specific timestamp
   */
  jumpToTime(timestamp) {
    const diffMs = timestamp.getTime() - (this.currentTimestamp.getTime() - 24 * 60 * 60 * 1000);
    const hours = diffMs / (60 * 60 * 1000);
    const targetPosition = hours * this.hourWidth - this.container.clientWidth / 2;
    
    this.animateToPosition(targetPosition);
  }

  /**
   * Destroy the component and clean up event listeners
   */
  destroy() {
    clearTimeout(this.wheelTimeout);
    clearTimeout(this.debounceTimeout);
    window.removeEventListener('resize', this.handleResize.bind(this));
    // Additional cleanup would go here
  }
}
