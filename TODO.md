# 4layers.earth Development Phases

---

## Recent Completed Tasks (December 2024)

### ✅ Frontend Cleanup and Immersive Design
- **✅ Removed demo API status code** - Eliminated all API status display components from frontend and backend
- **✅ Removed page titles and layer headers** - Cleaned up interface for immersive experience
- **✅ Timeline redesign** - Complete overhaul of timeline component:
  - Moved timeline to top of page
  - Removed background boxes and scrubber control
  - Implemented fixed-center design with page-wide dragging
  - Added transparent design with center indicator triangle
- **✅ Fixed JavaScript module loading** - Added proper ES6 module support
- **✅ Performance optimization** - Implemented debouncing for weather API calls:
  - Added 200ms debounce delay during timeline movement
  - Immediate weather fetch when user stops touching/dragging
  - Prevents excessive API calls during timeline scrubbing
- **✅ Timeline interaction improvements**:
  - Document-level event handling for page-wide dragging
  - Smooth animations and snap-to-hour functionality
  - Responsive design with proper touch targets
  - Hardware-accelerated CSS transforms

### ✅ Technical Infrastructure
- **✅ ES6 Module System** - Complete modular architecture with Timeline component
- **✅ CSS Architecture** - Ground layer color palette implementation
- **✅ Event System** - Proper event handling and debouncing
- **✅ Progressive Web App** - Manifest and service worker setup

---

## Phase 1: Ground Layer MVP

### 1.1 Project Setup & Foundation

**Objective**: Establish the complete project foundation with proper tooling, dependencies, and development environment.

**Context**: Before implementing the Ground layer, we need a solid foundation with proper tooling, testing setup, and development environment. This ensures code quality and maintainability from the start.

**Implementation Details**:

**Dependencies & Package.json Updates**:
- Add to `package.json` dependencies:
  - `axios` for HTTP requests to weather APIs
  - `node-cron` for scheduled data fetching
  - `compression` for gzip middleware
  - `helmet` for security headers
- Add to `package.json` devDependencies:
  - `jest` for unit testing
  - `supertest` for API testing
  - `eslint` with `@eslint/js` and `globals` for code linting
  - `nodemon` for development auto-restart
- Update scripts in `package.json`:
  - `"dev": "nodemon src/server.js"`
  - `"test": "jest"`
  - `"lint": "eslint src/**/*.js"`

**Google Fonts Integration**:
- Update `src/public/index.html` to include Space Grotesk font:
  ```html
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  ```

**Environment Configuration**:
- Create `.env` file support in `server.js` using manual parsing (no dotenv dependency)
- Add environment variables: `OPENWEATHER_API_KEY`, `NODE_ENV`, `PORT`, `CACHE_DURATION`
- Update `.gitignore` to include `.env`

**Basic CSS Variables Setup**:
- Update `src/public/style.css` with Ground layer color palette from CONCEPT.md:
  ```css
  :root {
    --ground-primary: #D4A373;
    --ground-secondary: #F2E8CF;
    --ground-accent: #A0785A;
    --ground-light: #FEFAE0;
    --font-family: 'Space Grotesk', sans-serif;
  }
  ```

**Testing Configuration**:
- Create `jest.config.js` with ES modules support
- Create `__tests__` directory structure for unit and integration tests

**Acceptance Criteria**:
- [x] All dependencies are installed and listed in package.json
- [x] Development scripts (`npm run dev`, `npm test`, `npm run lint`) work correctly
- [x] Space Grotesk font loads and displays correctly
- [x] Environment variables are properly loaded and accessible
- [x] Ground layer CSS variables are defined and usable
- [x] Basic test setup runs without errors
- [x] ESLint configuration enforces consistent code style
- [x] Git ignores node_modules, .env, and other development files

---

### 1.2 Ground Layer Data Architecture & Mock System

**Objective**: Define the Ground layer data structure and implement a comprehensive mock data system that simulates realistic weather patterns.

**Context**: The Ground layer displays temperature, humidity, and pressure data across a 24-hour timeline. We need well-structured mock data that follows realistic weather patterns to enable frontend development before API integration.

**Implementation Details**:

**Data Structure Definition**:
Create `src/models/GroundData.js` with the following interface:
```javascript
{
  timestamp: "2025-01-25T14:00:00.000Z", // ISO 8601 format
  location: {
    lat: 40.7128,
    lon: -74.0060,
    city: "New York",
    country: "US"
  },
  metrics: {
    temperature: {
      current: 22.5,        // Celsius
      feelsLike: 24.1,     // Celsius
      min24h: 18.2,        // Daily minimum
      max24h: 26.8         // Daily maximum
    },
    humidity: 68,          // Percentage (0-100)
    pressure: {
      current: 1013.25,    // hPa (hectopascals)
      seaLevel: 1013.25,   // Sea level pressure
      trend: "rising"      // "rising", "falling", "steady"
    }
  },
  conditions: {
    description: "Clear sky", // Human readable
    icon: "01d"              // OpenWeatherMap icon code
  }
}
```

**Mock Data Generator** (`src/services/MockDataService.js`):
- Generate 48 hours of realistic weather data (24h past + 24h future)
- Use mathematical functions to simulate realistic weather patterns:
  - Temperature: Sinusoidal pattern with daily cycle + random variations
  - Humidity: Inverse correlation with temperature + random variations
  - Pressure: Slower fluctuations with weather system simulation
- Include realistic weather condition transitions
- **MVP Focus**: Single location support (New York coordinates)

**Timeline Data Structure**:
- Create 1-hour intervals for the 48-hour period
- Each interval contains complete GroundData object
- Support for current time highlighting
- Enable smooth interpolation between data points

**API Endpoints** (Mock Phase):
- `GET /api/ground/current` - Current conditions
- `GET /api/ground/timeline?hours=24` - Timeline data (default 24h)
- `GET /api/ground/location?lat=40.7128&lon=-74.0060` - Location-specific data
- All endpoints return consistent GroundData structure

**Data Service Architecture**:
Create `src/services/GroundDataService.js` as an abstraction layer:
- `getCurrentConditions(lat, lon)` method
- `getTimelineData(lat, lon, hours)` method  
- `validateLocation(lat, lon)` method
- Swappable between mock and real API implementations

**Acceptance Criteria**:
- [x] GroundData interface is clearly defined and documented
- [x] Mock data generator creates realistic weather patterns over 48 hours
- [x] Timeline data includes proper temporal progression and smooth transitions
- [x] API endpoints return consistently structured data
- [x] Mock data includes proper temperature cycles (cooler at night, warmer during day)
- [x] Humidity and pressure values correlate realistically with temperature
- [x] Data service abstraction allows easy switching between mock and real APIs
- [x] Location validation prevents invalid coordinates
- [x] All mock endpoints respond within 100ms
- [x] Generated data passes validation for realistic weather ranges

---

### 1.3 Horizontal Timeline UI Component

**Objective**: Build a smooth, responsive horizontal scrolling timeline component that serves as the core navigation mechanism for the Ground layer.

**Context**: The horizontal timeline is the primary interaction element, allowing users to scrub through 48 hours of weather data. It must feel natural on both touch and desktop interfaces.

**Implementation Details**:

**Timeline Component Structure** (`src/public/components/Timeline.js`):
```html
<div class="timeline-container">
  <div class="timeline-track" id="timeline-track">
    <div class="timeline-scrubber" id="timeline-scrubber"></div>
    <div class="timeline-hours" id="timeline-hours">
      <!-- Generated hour markers -->
    </div>
  </div>
  <div class="timeline-current-time" id="current-time">
    Now: 2:34 PM
  </div>
</div>
```

**CSS Implementation** (`src/public/styles/timeline.css`):
- Use CSS Grid for precise hour marker positioning
- Implement smooth CSS transforms for scrubber movement
- Use CSS custom properties for dynamic positioning
- Hardware acceleration with `transform3d` and `will-change`
- Responsive design: full width on mobile, fixed width on desktop

**JavaScript Timeline Controller**:
- **Touch Events**: Support `touchstart`, `touchmove`, `touchend` for mobile
- **Mouse Events**: Support `mousedown`, `mousemove`, `mouseup` for desktop
- **Wheel Events**: Support horizontal scroll wheel for precision control
- **Keyboard Events**: Arrow keys for accessibility (15-minute increments)

**Smooth Scrolling Implementation**:
- Use `requestAnimationFrame` for 60fps animations
- Implement momentum scrolling with easing functions
- Snap to hour boundaries when user stops interacting
- Smooth interpolation between data points during scrubbing

**Time Calculation Logic**:
- Convert pixel positions to timestamps with high precision
- Handle timezone display and UTC conversion
- Support both 12-hour and 24-hour time formats
- Calculate relative positioning (e.g., "-2h" for 2 hours ago)

**Visual Design Specifications**:
- Total timeline width: 200% of viewport width (allows smooth panning)
- Hour markers: Every hour with 1px vertical line
- Current time indicator: Distinctive color and icon
- Scrubber: 44x44px touch target (iOS guidelines)
- Color scheme: Ground layer palette (`#D4A373`, `#F2E8CF`)

**Responsive Breakpoints**:
- Mobile (< 768px): Full gesture control, larger touch targets
- Tablet (768px - 1024px): Hybrid touch + mouse support
- Desktop (> 1024px): Mouse precision, keyboard shortcuts

**Performance Optimizations**:
- Virtual scrolling for hour markers (only render visible elements)
- Debounced event handlers to prevent excessive API calls
- CSS containment for layout optimization
- Passive event listeners where possible

**Integration Points**:
- Emit `timechange` events with selected timestamp
- Listen for external time updates (e.g., "jump to now" button)
- Support programmatic scrolling to specific times
- Maintain scroll position during data updates

**Acceptance Criteria**:
- [x] Timeline renders correctly across all device sizes (mobile, tablet, desktop)
- [x] Touch scrolling feels natural with proper momentum and snap behavior
- [x] Mouse wheel scrolling works smoothly with appropriate sensitivity
- [x] Keyboard navigation supports arrow keys with 15-minute precision
- [x] Current time is visually distinct and updates automatically
- [x] Scrubber snaps to hour boundaries when user stops interacting
- [x] Timeline emits accurate timestamp events during user interaction
- [x] Animation performance maintains 60fps during scrolling
- [x] Touch targets meet accessibility guidelines (minimum 44x44px)
- [x] Visual design matches Ground layer color palette from CONCEPT.md
- [x] Component works without JavaScript (graceful degradation)
- [x] Timeline position persists during page interactions (no unexpected jumps)

---

### 1.4 Ground Layer Data Display Components

**Objective**: Create modular, visually appealing components to display Ground layer weather data with smooth animations and responsive design.

**Context**: The Ground layer needs distinct visual components for temperature, humidity, and pressure that update smoothly as users scrub through the timeline. Each component should follow the design system and provide clear, actionable weather information.

**Implementation Details**:

**Component Architecture**:
Create modular ES6 classes in `src/public/components/`:
- `TemperatureDisplay.js` - Main temperature display with feels-like and min/max
- `HumidityDisplay.js` - Humidity percentage with comfort indicators  
- `PressureDisplay.js` - Atmospheric pressure with trend indicators
- `GroundLayerContainer.js` - Main container that orchestrates all components

**TemperatureDisplay Component**:
```html
<div class="metric-display temperature-display">
  <div class="metric-main">
    <span class="metric-value" id="temp-value">22°</span>
    <span class="metric-details">
      <span class="feels-like">feels like 24°</span>
      <span class="temp-range">18° • 27°</span>
    </span>
  </div>
</div>
```

**Visual Design Specifications**:
- **Color Scheme**: Ground layer palette from CONCEPT.md
  - Primary: `#D4A373` (warm brown)
  - Secondary: `#F2E8CF` (light cream)
  - Accent: `#A0785A` (darker brown)
  - Background: `#FEFAE0` (very light cream)
- **Typography**: Space Grotesk font family
  - Main values: 2.5rem (40px), weight 300-400 (light/regular)
  - Details: 1rem (16px), weight 300
  - Labels: 0.875rem (14px), weight 300
- **Layout**: Minimalist text-based layout with subtle positioning
- **Text Blending**: Low contrast text that blends harmoniously with background colors

**Animation System**:
- Use CSS custom properties for smooth value transitions
- Implement counter animations for numeric values (temperature, humidity, pressure)
- Add subtle hover effects with CSS transforms
- Use CSS transitions with cubic-bezier easing for natural feel
- Duration: 400ms for value changes, 200ms for hover effects

**Data Update Logic**:
Create `src/public/services/GroundLayerRenderer.js`:
```javascript
class GroundLayerRenderer {
  updateTemperature(data) {
    // Animate from current to new value with subtle transitions
    // Update feels-like, min/max with blended text appearance
  }
  
  updateHumidity(data) {
    // Animate humidity percentage with minimal visual change
    // Update comfort indicator with subtle text shifts
  }
  
  updatePressure(data) {
    // Animate pressure value with smooth transitions
    // Update trend with minimalist text indicators
  }
  
  renderComplete(groundData) {
    // Orchestrate all component updates with harmonious blending
    // Ensure text maintains readability while blending with background
  }
}
```

**Responsive Design Implementation**:
- **Mobile (< 768px)**: Vertical text layout, larger readable sizes
- **Tablet (768px - 1024px)**: Balanced text positioning
- **Desktop (> 1024px)**: Horizontal text distribution across viewport
- Use CSS Container Queries for component-level responsiveness

**Interactive Elements**:
- **All Displays**: Gentle opacity transitions for interaction feedback
- **Fixed Units**: Display temperature in Celsius only (simplifies MVP)

**Performance Optimizations**:
- Use CSS transforms instead of changing layout properties
- Implement throttled updates to prevent excessive animations
- Use `will-change` CSS property for elements that will animate
- Batch DOM updates using document fragments

**Error States & Loading**:
- Show skeleton loading states while fetching data
- Display error messages for failed data loads
- Graceful degradation when data is incomplete
- Retry mechanisms for transient failures

**CSS Architecture** (`src/public/styles/ground-layer.css`):
```css
.ground-layer {
  --ground-primary: #D4A373;
  --ground-secondary: #F2E8CF;
  --ground-accent: #A0785A;
  --ground-light: #FEFAE0;
  --text-blend: rgba(168, 120, 90, 0.7);  /* Blended text color */
  --text-subtle: rgba(168, 120, 90, 0.5); /* Very subtle text */
  
  background: linear-gradient(180deg, var(--ground-light) 0%, var(--ground-secondary) 100%);
  min-height: 100vh;
  padding: 2rem 1rem;
  color: var(--text-blend);
}

.metrics-display {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  max-width: 1200px;
  margin: 0 auto;
  text-align: center;
}

.metric-display {
  border: none;
  background: transparent;
  padding: 0;
  transition: opacity 300ms ease;
}

.metric-value {
  font-size: 2.5rem;
  font-weight: 300;
  color: var(--ground-primary);
  display: block;
  margin-bottom: 0.25rem;
}

.metric-details {
  font-size: 1rem;
  font-weight: 300;
  color: var(--text-subtle);
  line-height: 1.4;
}
```

**Acceptance Criteria**:
- [ ] All three metric displays (temperature, humidity, pressure) render with minimalist text design
- [ ] Values animate smoothly when timeline data changes (400ms duration)
- [ ] Component layout is responsive across mobile, tablet, and desktop
- [ ] Ground layer color palette creates harmonious text blending with background
- [ ] Space Grotesk font loads and displays at light weights (300-400)
- [ ] Text maintains sufficient readability while blending with background colors
- [ ] Hover/focus states provide gentle opacity feedback
- [ ] Loading states display with minimal visual disruption
- [ ] Error states show with subtle text indicators when data fails to load
- [ ] All animations maintain 60fps performance
- [ ] Components gracefully handle missing or malformed data
- [ ] CSS custom properties enable easy text color and blending adjustments

---

### 1.5 Timeline-Data Integration & State Management

**Objective**: Connect the timeline component with data display components to create a smooth, responsive user experience where scrubbing the timeline updates all Ground layer metrics in real-time.

**Context**: This phase integrates the timeline UI with the data display components, establishing the core interaction pattern that will be extended to other layers. Users should see immediate visual feedback as they navigate through time.

**Implementation Details**:

**State Management Architecture**:
Create `src/public/services/GroundLayerState.js` using the Publisher-Subscriber pattern:
```javascript
class GroundLayerState {
  constructor() {
    this.currentTimestamp = new Date();
    this.timelineData = new Map(); // timestamp -> GroundData
    this.subscribers = new Set();
    this.isLoading = false;
    this.error = null;
  }
  
  // Core methods
  setCurrentTime(timestamp) { /* emit updates */ }
  updateTimelineData(dataArray) { /* cache and emit */ }
  getCurrentData() { /* return interpolated data */ }
  subscribe(callback) { /* add subscriber */ }
  unsubscribe(callback) { /* remove subscriber */ }
}
```

**Real-time Data Interpolation**:
- Implement linear interpolation between data points for smooth value transitions
- Handle edge cases (missing data, out of range timestamps)
- Provide fallback to closest available data when interpolation isn't possible
- Cache interpolated values to improve performance during rapid timeline scrubbing

**Event System Integration**:
Create centralized event handling in `src/public/services/EventBus.js`:
```javascript
// Timeline events
'timeline:timechange' -> { timestamp, source: 'user'|'auto' }
'timeline:dragstart' -> { timestamp }
'timeline:dragend' -> { timestamp }

// Data events  
'data:loading' -> { operation: 'fetch'|'interpolate' }
'data:loaded' -> { timestamp, data }
'data:error' -> { error, timestamp }
'data:updated' -> { timestamp, data, interpolated: boolean }

// UI events
'ui:render' -> { components: [], timestamp }
'ui:error' -> { component, error }
```

**Performance Optimization Strategy**:
- **Debouncing**: Limit API calls during rapid timeline scrubbing (250ms delay)
- **Throttling**: Limit UI updates to 60fps during timeline dragging
- **Caching**: Store timeline data in memory for instant access
- **Preloading**: Fetch adjacent time periods while user interacts
- **Virtual Rendering**: Only update visible components during timeline scrubbing

**Data Fetching Strategy**:
Create `src/public/services/GroundDataManager.js`:
```javascript
class GroundDataManager {
  constructor(mockDataService) {
    this.cache = new Map();
    this.pendingRequests = new Map();
    this.dataService = mockDataService;
  }
  
  async getDataForTime(timestamp) {
    // Check cache first
    // Handle pending requests
    // Fetch missing data
    // Return interpolated result
  }
  
  preloadAdjacentData(centerTimestamp, hoursRadius = 6) {
    // Background fetch surrounding time periods
  }
}
```

**User Interaction Flow**:
1. **User starts timeline drag** → Emit `timeline:dragstart` → Switch to high-frequency updates
2. **User drags timeline** → Emit `timeline:timechange` → Update UI with cached/interpolated data
3. **User stops dragging** → Emit `timeline:dragend` → Fetch precise data if needed
4. **Auto-time updates** → Handle real-time progression when not actively dragging

**Error Handling & Recovery**:
- Display non-blocking error messages for failed data fetches
- Implement automatic retry with exponential backoff
- Graceful degradation to cached data when real-time updates fail
- Clear error indicators when data fetching succeeds

**Loading States Management**:
- Show subtle loading indicators during data fetches
- Skeleton placeholders for initial page load
- Progress indicators for longer operations
- Maintain interactivity during background data loading

**Memory Management**:
- Implement LRU cache for timeline data (limit: 168 hours / 1 week)
- Clean up event listeners on component destruction
- Prevent memory leaks in animation callbacks
- Monitor and limit concurrent data requests

**Integration Testing Scenarios**:
- Timeline scrubbing with rapid movements
- Network failures during data fetching
- Page visibility changes (background/foreground)
- Memory usage during extended use
- Concurrent user interactions

**API Response Caching**:
Implement `src/public/services/CacheManager.js`:
```javascript
class CacheManager {
  constructor(maxAge = 300000) { // 5 minutes default
    this.cache = new Map();
    this.maxAge = maxAge;
  }
  
  set(key, data) { /* store with timestamp */ }
  get(key) { /* return if not expired */ }
  invalidate(pattern) { /* clear matching entries */ }
  cleanup() { /* remove expired entries */ }
}
```

**Developer Experience Tools**:
- Console logging for state changes in development mode
- Performance monitoring for timeline interactions
- Debug overlay showing current state and cache status
- Timeline data visualization for debugging

**Acceptance Criteria**:
- [ ] Timeline scrubbing updates all metric displays in real-time (< 16ms per frame)
- [ ] Data interpolation provides smooth value transitions between known data points
- [ ] Loading states appear appropriately without blocking user interaction
- [ ] Error messages display helpfully without disrupting the timeline experience
- [ ] Memory usage remains stable during extended timeline interaction
- [ ] Cached data reduces API calls by at least 80% during typical usage
- [ ] Timeline position accurately reflects the data being displayed
- [ ] Rapid timeline movements don't cause UI stuttering or data inconsistencies
- [ ] Network failures gracefully fall back to cached data when available
- [ ] State management prevents race conditions between user interactions and data updates
- [ ] Performance monitoring shows consistent 60fps during timeline animations
- [ ] All event subscriptions are properly cleaned up to prevent memory leaks

---

### 1.6 OpenWeatherMap API Integration

**Objective**: Replace mock data with real weather data from OpenWeatherMap API, implementing robust error handling, caching, and rate limiting.

**Context**: Transition from mock data to real weather data while maintaining the same user experience. OpenWeatherMap provides current weather, 5-day forecast, and historical data through their free tier.

**Implementation Details**:

**API Configuration & Setup**:
- **Selected API**: OpenWeatherMap (free tier provides 1000 calls/day)
- **Required Endpoints**:
  - Current Weather: `https://api.openweathermap.org/data/2.5/weather`
  - 5-Day Forecast: `https://api.openweathermap.org/data/2.5/forecast`
  - One Call API 3.0: `https://api.openweathermap.org/data/3.0/onecall` (requires subscription)
- **Authentication**: API key in environment variable `OPENWEATHER_API_KEY`
- **Rate Limiting**: 60 calls/minute, 1000 calls/day (free tier)

**Backend API Service** (`src/services/OpenWeatherService.js`):
```javascript
class OpenWeatherService {
  constructor() {
    this.baseURL = 'https://api.openweathermap.org/data/2.5';
    this.apiKey = process.env.OPENWEATHER_API_KEY;
    this.cache = new Map();
    this.rateLimiter = new RateLimiter(60, 60000); // 60 calls per minute
  }
  
  async getCurrentWeather(lat, lon) {
    // Implementation with caching and error handling
  }
  
  async getForecastData(lat, lon) {
    // 5-day forecast with 3-hour intervals
  }
  
  transformToGroundData(rawData) {
    // Convert OpenWeatherMap format to our GroundData interface
  }
}
```

**Data Transformation Logic**:
Map OpenWeatherMap API response to our GroundData interface:
```javascript
// OpenWeatherMap response -> GroundData transformation
{
  // From OpenWeatherMap API
  main: { temp: 295.15, feels_like: 298.4, pressure: 1013, humidity: 68 },
  weather: [{ main: "Clear", description: "clear sky", icon: "01d" }],
  dt: 1642694400
} 
// Transforms to our GroundData format
{
  timestamp: "2025-01-25T14:00:00.000Z",
  metrics: {
    temperature: {
      current: 22.0,      // Converted from Kelvin
      feelsLike: 25.3,    // Converted from Kelvin  
      min24h: null,       // Calculate from forecast data
      max24h: null        // Calculate from forecast data
    },
    humidity: 68,
    pressure: {
      current: 1013,
      seaLevel: 1013,
      trend: "steady"     // Calculate from historical comparison
    }
  }
}
```

**Enhanced Backend Endpoints**:
Update `src/server.js` with new endpoints:
```javascript
// Current conditions
app.get('/api/ground/current', async (req, res) => {
  const { lat = 40.7128, lon = -74.0060 } = req.query;
  // Implement with caching, error handling, validation
});

// Timeline data (combines current + forecast)
app.get('/api/ground/timeline', async (req, res) => {
  const { lat = 40.7128, lon = -74.0060, hours = 24 } = req.query;
  // Combine current weather + forecast data
  // Fill gaps with interpolation where needed
});

// Location search and validation
app.get('/api/ground/location', async (req, res) => {
  const { lat, lon, city } = req.query;
  // Validate coordinates or resolve city name
});
```

**Intelligent Caching Strategy**:
Implement `src/services/WeatherCache.js`:
- **Current Weather**: Cache for 10 minutes
- **Forecast Data**: Cache for 30 minutes  
- **Location Data**: Cache for 24 hours
- **Error Responses**: Cache for 2 minutes (prevent API spam on errors)
- Use Redis-like in-memory caching with TTL expiration
- Implement cache invalidation strategies

**Rate Limiting & Quota Management**:
Create `src/services/RateLimiter.js`:
```javascript
class RateLimiter {
  constructor(maxRequests, windowMs) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
    this.requests = [];
  }
  
  async canMakeRequest() {
    // Check if request is within rate limits
    // Return true/false with optional retry-after
  }
  
  recordRequest() {
    // Track successful API calls
  }
}
```

**Error Handling Strategy**:
- **Network Errors**: Retry with exponential backoff (max 3 attempts)
- **API Quota Exceeded**: Fall back to cached data, user notification
- **Invalid Coordinates**: Return helpful error messages
- **Malformed Responses**: Log error, return cached data if available
- **Timeout Handling**: 10-second timeout for API requests

**Location Services Integration**:
- **Browser Geolocation**: Request user's current location
- **Default Location**: New York as fallback (40.7128, -74.0060)
- **MVP Simplification**: Single location support only

**Data Quality & Validation**:
Implement validation in `src/services/DataValidator.js`:
- Validate temperature ranges (-50°C to 60°C)
- Validate humidity percentages (0-100%)
- Validate pressure ranges (950-1050 hPa)
- Check for missing required fields
- Sanitize and normalize data formats

**Frontend Integration Updates**:
Update `src/public/services/GroundDataService.js`:
```javascript
class GroundDataService {
  constructor() {
    this.useRealAPI = true; // Toggle for development
    this.mockService = new MockDataService();
    this.apiBaseURL = '/api/ground';
  }
  
  async getCurrentConditions(lat, lon) {
    if (!this.useRealAPI) return this.mockService.getCurrentConditions(lat, lon);
    
    try {
      const response = await fetch(`${this.apiBaseURL}/current?lat=${lat}&lon=${lon}`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch (error) {
      console.warn('API failed, falling back to mock data:', error);
      return this.mockService.getCurrentConditions(lat, lon);
    }
  }
}
```

**Performance Monitoring**:
- Track API response times
- Monitor cache hit/miss ratios
- Log quota usage and rate limit status
- Alert when approaching daily API limits
- Performance metrics for data transformation

**Development & Testing Tools**:
- Environment variable for toggling mock vs real API
- API key validation on server startup
- Test endpoints with sample coordinates
- Mock API responses for automated testing
- Rate limit testing utilities

**Package.json Dependencies Update**:
Add new dependencies:
```json
{
  "dependencies": {
    "express": "^4.21.2",
    "axios": "^1.6.7",
    "compression": "^1.7.4",
    "helmet": "^7.1.0"
  }
}
```

**Acceptance Criteria**:
- [ ] OpenWeatherMap API integration works with valid API key
- [ ] All three Ground layer metrics (temperature, humidity, pressure) display real data
- [ ] API responses are cached appropriately to minimize quota usage
- [ ] Rate limiting prevents exceeding OpenWeatherMap's limits (60/minute, 1000/day)
- [ ] Error handling gracefully falls back to cached or mock data
- [ ] Location services successfully resolve user coordinates
- [ ] Data transformation correctly converts OpenWeatherMap format to GroundData interface
- [ ] Timeline data combines current weather and forecast seamlessly
- [ ] Invalid coordinates return helpful error messages
- [ ] API quota monitoring prevents unexpected service interruptions
- [ ] Frontend gracefully handles API failures without breaking user experience
- [ ] Performance monitoring shows API response times under 2 seconds
- [ ] Development environment supports easy toggling between mock and real data
- [ ] All API endpoints include proper error responses and status codes
- [ ] Data validation ensures only realistic weather values are displayed

---

### 1.7 Responsive Design & Mobile Optimization

**Objective**: Ensure the Ground layer works perfectly across all devices with touch-optimized interactions, proper typography scaling, and mobile-first responsive design.

**Context**: The app must provide an excellent experience on mobile devices where most users will interact with it. This includes touch gestures, appropriate sizing, and performance optimization for mobile networks and processors.

**Implementation Details**:

**Mobile-First CSS Architecture**:
Restructure `src/public/style.css` with mobile-first approach:
```css
/* Base mobile styles (320px+) */
:root {
  --scale-factor: 1;
  --touch-target: 44px;  /* iOS minimum */
  --spacing-unit: 1rem;
  --border-radius: 12px;
}

/* Tablet breakpoint (768px+) */
@media (min-width: 768px) {
  :root {
    --scale-factor: 1.125;
    --spacing-unit: 1.25rem;
    --border-radius: 16px;
  }
}

/* Desktop breakpoint (1024px+) */
@media (min-width: 1024px) {
  :root {
    --scale-factor: 1.25;
    --spacing-unit: 1.5rem;
  }
}
```

**Touch-Optimized Timeline**:
Enhanced timeline component for mobile in `src/public/components/Timeline.js`:
- **Touch Targets**: Minimum 44x44px (iOS) and 48x48dp (Android)
- **Gesture Support**: Pan, swipe with momentum scrolling
- **Scroll Indicators**: Visual cues showing available content
- **Edge Resistance**: Subtle bounce at timeline boundaries

**Responsive Typography System**:
Implement fluid typography using `clamp()` function:
```css
.metric-value {
  font-size: clamp(2rem, 5vw, 3rem);     /* 32px - 48px */
}

.metric-label {
  font-size: clamp(0.875rem, 2.5vw, 1rem); /* 14px - 16px */
}

.timeline-time {
  font-size: clamp(0.75rem, 2vw, 0.875rem); /* 12px - 14px */
}
```

**Layout Grid System**:
Create flexible layout in `src/public/styles/grid.css`:
```css
.metrics-display {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-unit);
  align-items: center;
  justify-content: center;
  
  /* Mobile: Vertical stack */
  text-align: center;
  
  /* Tablet: Maintain center alignment */
  /* Desktop: Horizontal distribution */
}

@media (min-width: 768px) {
  .metrics-display {
    flex-direction: row;
    justify-content: space-between;
    align-items: baseline;
    text-align: left;
  }
}

@media (min-width: 1024px) {
  .metrics-display {
    max-width: 1200px;
    margin: 0 auto;
    justify-content: space-evenly;
  }
}
```

**Touch Gesture Implementation**:
Enhanced touch handling in `src/public/services/TouchHandler.js`:
```javascript
class TouchHandler {
  constructor(element, callbacks) {
    this.element = element;
    this.callbacks = callbacks;
    this.setupTouchEvents();
    this.setupMouseEvents(); // For desktop compatibility
  }
  
  setupTouchEvents() {
    // Handle touch events with proper passive listeners
    // Implement momentum scrolling
    // Add gesture recognition (swipe, pinch, tap)
  }
  
  calculateMomentum(velocity, distance) {
    // Physics-based momentum calculation
    // Natural deceleration curves
  }
}
```

**Performance Optimization for Mobile**:
- **CSS Containment**: `contain: layout style paint` for metric displays
- **Passive Event Listeners**: Prevent scroll blocking
- **Reduced Animations**: Respect `prefers-reduced-motion`

**Viewport & Meta Tags**:
Update `src/public/index.html`:
```html
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
<meta name="theme-color" content="#D4A373">
<meta name="color-scheme" content="light">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="default">
```

**Safe Area Support** (iPhone notch, etc.):
```css
.ground-layer {
  padding-top: max(2rem, env(safe-area-inset-top));
  padding-bottom: max(2rem, env(safe-area-inset-bottom));
  padding-left: max(1rem, env(safe-area-inset-left));
  padding-right: max(1rem, env(safe-area-inset-right));
}
```

**Orientation Change Handling**:
```javascript
// src/public/services/OrientationHandler.js
class OrientationHandler {
  constructor() {
    this.setupOrientationListeners();
  }
  
  setupOrientationListeners() {
    screen.orientation?.addEventListener('change', () => {
      this.handleOrientationChange();
    });
    
    window.addEventListener('resize', debounce(() => {
      this.handleResize();
    }, 150));
  }
  
  handleOrientationChange() {
    // Recalculate timeline dimensions
    // Adjust metric card layouts
    // Update touch target sizes
  }
}
```

**Accessibility Enhancements**:
- **Voice Control**: Support for iOS Voice Control and Android Voice Access
- **Large Text**: Respect system font size preferences with scalable minimalist text
- **High Contrast**: Support forced-colors media query while maintaining design aesthetics
- **Reduced Motion**: Honor prefers-reduced-motion settings
- **Screen Reader**: Optimized ARIA labels with subtle visual indicators

**PWA Mobile Features**:
Update `src/public/manifest.json`:
```json
{
  "display": "standalone",
  "orientation": "portrait-primary",
  "theme_color": "#D4A373",
  "background_color": "#FEFAE0",
  "start_url": "/",
  "scope": "/",
  "categories": ["weather", "utilities"]
}
```

**Network Optimization**:
- **Critical CSS**: Inline above-the-fold styles
- **Font Loading**: Use font-display: swap for web fonts
- **MVP Focus**: Core functionality only, defer advanced optimizations

**Testing Strategy**:
- **Device Testing**: iPhone SE, iPhone 14, Galaxy S23
- **Browser Testing**: Safari iOS, Chrome Android
- **Network Testing**: 3G, WiFi performance
- **Accessibility Testing**: VoiceOver, basic keyboard navigation

**Performance Budgets**:
- **First Contentful Paint**: < 2s on 3G
- **Largest Contentful Paint**: < 4s on 3G  
- **Cumulative Layout Shift**: < 0.1
- **First Input Delay**: < 100ms
- **Bundle Size**: < 200KB total JavaScript

**Responsive Images**:
```html
<!-- MVP: Simple responsive images without advanced optimization -->
<img src="weather-icon.png" alt="Weather conditions" loading="lazy" 
     style="width: 100%; max-width: 64px; height: auto;">
```

**Acceptance Criteria**:
- [ ] App displays correctly on iPhone SE (375x667) and iPhone 14 Pro Max (430x932)
- [ ] Touch targets meet minimum size requirements (44x44px) on all interactive elements
- [ ] Timeline scrolling feels natural with proper momentum and bounce on mobile
- [ ] Typography scales appropriately across all screen sizes without horizontal scrolling
- [ ] Landscape orientation works properly with adjusted layouts
- [ ] Safe area insets are respected on devices with notches/dynamic islands
- [ ] App loads and renders within 2 seconds on 3G network connections
- [ ] PWA installs correctly on iOS Safari and Android Chrome
- [ ] Reduced motion settings are respected for users who prefer less animation
- [ ] High contrast mode works properly for accessibility
- [ ] Voice control and screen readers can navigate the interface effectively
- [ ] Performance budgets are met for mobile network conditions
- [ ] Battery usage is optimized for mobile devices
- [ ] Memory usage remains stable during extended mobile use

---

### 1.8 Testing, Performance & Accessibility

**Objective**: Implement comprehensive testing, performance monitoring, and accessibility compliance to ensure a robust, fast, and inclusive Ground layer experience.

**Context**: The Ground layer must meet modern web standards for performance, accessibility, and reliability. This includes automated testing, performance optimization, and WCAG compliance.

**Implementation Details**:

**Testing Framework Setup**:
Create comprehensive testing structure:
```
__tests__/
├── unit/
│   ├── components/
│   │   ├── Timeline.test.js
│   │   ├── TemperatureCard.test.js
│   │   └── HumidityCard.test.js
│   ├── services/
│   │   ├── GroundDataService.test.js
│   │   └── OpenWeatherService.test.js
│   └── utils/
├── integration/
│   ├── api-endpoints.test.js
│   └── timeline-data-flow.test.js
└── e2e/
    ├── user-interactions.test.js
    └── responsive-design.test.js
```

**Jest Configuration** (`jest.config.js`):
```javascript
export default {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/__tests__/setup.js'],
  moduleNameMapping: {
    '\.(css|less|scss)$': 'identity-obj-proxy'
  },
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/**/*.test.js',
    '!src/public/service-worker.js'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  }
};
```

**Unit Tests for Timeline Component**:
```javascript
// __tests__/unit/components/Timeline.test.js
import { Timeline } from '../../../src/public/components/Timeline.js';

describe('Timeline Component', () => {
  test('renders with correct hour markers', () => {
    // Test hour marker generation
  });
  
  test('handles touch events correctly', () => {
    // Test touch interaction
  });
  
  test('emits timechange events with correct timestamps', () => {
    // Test event emission
  });
  
  test('snaps to hour boundaries', () => {
    // Test snapping behavior
  });
});
```

**Unit Tests for Minimalist Display Components**:
```javascript
// __tests__/unit/components/TemperatureDisplay.test.js
import { TemperatureDisplay } from '../../../src/public/components/TemperatureDisplay.js';

describe('Temperature Display Component', () => {
  test('renders temperature with proper text blending', () => {
    // Test minimalist text rendering
  });
  
  test('updates values with smooth transitions', () => {
    // Test animation behavior
  });
  
  test('maintains readability while blending with background', () => {
    // Test color contrast compliance
  });
});
```

**API Integration Tests**:
```javascript
// __tests__/integration/api-endpoints.test.js
import request from 'supertest';
import app from '../../src/server.js';

describe('Ground Layer API Endpoints', () => {
  test('GET /api/ground/current returns valid weather data', async () => {
    const response = await request(app)
      .get('/api/ground/current?lat=40.7128&lon=-74.0060')
      .expect(200);
    
    expect(response.body).toMatchObject({
      timestamp: expect.any(String),
      metrics: expect.objectContaining({
        temperature: expect.objectContaining({
          current: expect.any(Number)
        })
      })
    });
  });
});
```

**Performance Testing & Monitoring**:
Create `src/public/services/PerformanceMonitor.js`:
```javascript
class PerformanceMonitor {
  constructor() {
    this.metrics = new Map();
    this.observers = [];
    this.setupObservers();
  }
  
  setupObservers() {
    // Core Web Vitals monitoring
    this.observeLCP(); // Largest Contentful Paint
    this.observeFID(); // First Input Delay  
    this.observeCLS(); // Cumulative Layout Shift
    this.observeFCP(); // First Contentful Paint
    this.observeTTFB(); // Time to First Byte
  }
  
  observeLCP() {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];
      this.metrics.set('LCP', lastEntry.startTime);
    });
    observer.observe({ type: 'largest-contentful-paint', buffered: true });
  }
  
  measureTimelinePerformance() {
    // Measure timeline scroll performance
    // Track frame rate during interactions
    // Monitor memory usage
  }
  
  reportMetrics() {
    // Send metrics to analytics or console
    console.log('Performance Metrics:', Object.fromEntries(this.metrics));
  }
}
```

**Accessibility Implementation**:
Update components with comprehensive ARIA support:
```javascript
// src/public/components/TemperatureDisplay.js
class TemperatureDisplay {
  render(data) {
    return `
      <div class="metric-display temperature-display" 
           role="region" 
           aria-labelledby="temp-label"
           aria-live="polite">
        <span id="temp-label" class="sr-only">Temperature Information</span>
        <div class="metric-main">
          <span class="metric-value" 
                aria-label="Current temperature ${data.temperature.current} degrees Celsius">
            ${data.temperature.current}°
          </span>
          <span class="metric-details">
            <span aria-label="Feels like ${data.temperature.feelsLike} degrees">
              feels like ${data.temperature.feelsLike}°
            </span>
          </span>
        </div>
      </div>
    `;
  }
}
```

**Accessibility CSS** (`src/public/styles/accessibility.css`):
```css
/* Screen reader only text */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

/* High contrast mode support - maintain minimalist aesthetic */
@media (prefers-contrast: high) {
  .metric-display {
    color: ButtonText;
    background: ButtonFace;
  }
  
  .metric-value {
    color: ButtonText;
  }
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}

/* Focus indicators - minimal but visible */
.timeline-scrubber:focus,
.metric-display:focus-within {
  outline: 2px solid rgba(0, 95, 204, 0.6);
  outline-offset: 4px;
}
```

**Keyboard Navigation**:
Implement comprehensive keyboard support:
```javascript
// src/public/services/KeyboardHandler.js
class KeyboardHandler {
  constructor() {
    this.setupKeyboardListeners();
  }
  
  setupKeyboardListeners() {
    document.addEventListener('keydown', (event) => {
      switch (event.key) {
        case 'ArrowLeft':
          this.moveTimeline(-15); // 15 minutes back
          break;
        case 'ArrowRight':
          this.moveTimeline(15);  // 15 minutes forward
          break;
        case 'Home':
          this.jumpToCurrentTime();
          break;
        case 'Tab':
          this.handleTabNavigation(event);
          break;
      }
    });
  }
}
```

**Performance Optimization Implementation**:
- **Bundle Optimization**: Basic minification and compression
- **CSS Optimization**: Critical CSS extraction
- **JavaScript Optimization**: Minification, compression

**Core Web Vitals Targets**:
- **Largest Contentful Paint (LCP)**: < 2.5 seconds
- **First Input Delay (FID)**: < 100 milliseconds
- **Cumulative Layout Shift (CLS)**: < 0.1
- **First Contentful Paint (FCP)**: < 1.8 seconds
- **Time to Interactive (TTI)**: < 3.8 seconds

**Accessibility Testing Tools Integration**:
```javascript
// __tests__/accessibility/axe-tests.js
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

describe('Accessibility Tests', () => {
  test('Ground layer has no accessibility violations with minimalist design', async () => {
    const html = renderGroundLayer();
    const results = await axe(html);
    expect(results).toHaveNoViolations();
  });
  
  test('Text blending maintains sufficient contrast ratios', async () => {
    // Test color contrast compliance for blended text
    const displays = document.querySelectorAll('.metric-display');
    displays.forEach(display => {
      const contrast = calculateContrast(display);
      expect(contrast).toBeGreaterThan(4.5); // WCAG AA standard
    });
  });
});
```

**Performance Budget Enforcement**:
Create `performance-budget.json`:
```json
{
  "budget": [
    {
      "resourceSizes": [
        { "resourceType": "script", "budget": 150 },
        { "resourceType": "total", "budget": 300 }
      ],
      "resourceCounts": [
        { "resourceType": "third-party", "budget": 5 }
      ]
    }
  ]
}
```

**Browser Testing Matrix**:
- **iOS Safari**: Latest version
- **Chrome Android**: Latest version  
- **Desktop Chrome**: Latest version
- **Desktop Safari**: Latest version
- **MVP Focus**: Core browsers only, expand testing in later phases

**Automated Testing Pipeline**:
Update `package.json` scripts:
```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage"
  }
}
```

**Error Monitoring & Logging**:
```javascript
// src/public/services/ErrorMonitor.js
class ErrorMonitor {
  constructor() {
    this.setupErrorHandlers();
  }
  
  setupErrorHandlers() {
    window.addEventListener('error', this.handleError.bind(this));
    window.addEventListener('unhandledrejection', this.handlePromiseRejection.bind(this));
  }
  
  handleError(event) {
    console.error('JavaScript Error:', {
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      error: event.error
    });
  }
}
```

**Acceptance Criteria**:
- [ ] Unit test coverage reaches at least 80% for all components and services
- [ ] Integration tests verify API endpoints return correctly formatted data
- [ ] E2E tests validate complete user interaction flows work correctly
- [ ] Core Web Vitals meet Google's "Good" thresholds (LCP < 2.5s, FID < 100ms, CLS < 0.1)
- [ ] Lighthouse accessibility score is 95+ across all pages
- [ ] WCAG 2.1 AA compliance verified with minimalist design maintaining sufficient contrast
- [ ] Keyboard navigation works for all interactive elements
- [ ] Screen reader compatibility tested with VoiceOver and NVDA
- [ ] High contrast mode displays correctly while preserving minimalist aesthetic
- [ ] Reduced motion preferences are respected for all animations
- [ ] Performance budgets are enforced and maintained below thresholds
- [ ] Cross-browser testing passes on all supported browsers
- [ ] Mobile performance meets targets on 3G network conditions
- [ ] Error monitoring captures and reports issues effectively
- [ ] Bundle size optimization keeps total payload under 300KB
- [ ] Text blending maintains readability across all supported devices and browsers

---

**Phase 1 Development Flow Summary:**

1. **Setup & Foundation** (1.1) → Basic project structure, dependencies, CSS variables
2. **Mock Data System** (1.2) → Realistic weather simulation for frontend development  
3. **Timeline UI** (1.3) → Core horizontal scrolling interaction
4. **Data Display** (1.4) → Visual components for temperature, humidity, pressure
5. **Integration** (1.5) → Connect timeline with data display using mock data
6. **Real API** (1.6) → Replace mock data with OpenWeatherMap API
7. **Mobile Optimization** (1.7) → Touch gestures, responsive design, PWA features
8. **Testing & Polish** (1.8) → Comprehensive testing, performance, accessibility

**Key Principle**: Mock data enables rapid frontend development in phases 1.2-1.5, then real API integration in 1.6 provides production-ready data without changing the frontend interface.

**MVP Simplifications Applied:**
- **Fixed Units**: Celsius only (no temperature unit toggle)
- **Single Location**: New York as default, browser geolocation as backup
- **Core Browser Support**: Latest iOS Safari, Chrome Android, Desktop Chrome/Safari
- **Basic PWA**: Essential manifest without shortcuts or advanced features
- **Essential Testing**: Core functionality and accessibility, defer performance tooling
- **Simple Images**: Basic responsive images without WebP optimization
- **Core Performance**: Basic minification, defer advanced caching strategies
- **Minimal Interactions**: Remove comfort indicators, pressure trends, haptic feedback

**Post-MVP Features** (for future phases):
- Temperature unit switching (C/F)
- Multiple location support and location history
- Advanced image optimization (WebP, multiple formats)
- Service worker and offline functionality
- App shortcuts and advanced PWA features
- Comprehensive browser support matrix
- Advanced performance monitoring and budgets
- Detailed weather condition indicators

---

## Phase 2: Sea Layer Implementation
(To be detailed)

---

## Phase 3: Sky Layer Implementation
(To be detailed)

---

## Phase 4: Astro Layer Implementation
(To be detailed)

Define backend endpoints for Ground layer data and integrate real data sources (APIs) relevant to the Ground layer.

Context: The app needs to display real-time or recent ground-related environmental data (e.g., temperature, soil moisture, weather conditions) for the selected time slices.

Implementation details:
- Identify and document the required data fields for the Ground layer.
- Research and select suitable public APIs or data sources that provide this information.
- Implement backend endpoints in `server.js` to fetch, process, and serve this data to the frontend.
- Add error handling and caching to ensure reliability and performance.
- Provide clear API documentation for frontend consumption.
- Update the frontend to consume these endpoints, replacing mock data with real data.

Acceptance criteria:
- [ ] Backend endpoints are available and documented.
- [ ] Data is fetched from real APIs and served to the frontend.
- [ ] The frontend displays real data for the Ground layer.
- [ ] Error handling and caching are implemented.
- [ ] Automated tests verify backend endpoints, data fetching, and frontend integration.

### 1.3 Layer Visualization (Ground Layer)

Design and implement the Ground layer’s visual components, applying color themes, gradients, and transitions.

Context: The Ground layer should have a distinct visual identity and clearly present its data in an engaging, user-friendly way.

Implementation details:
- Create modular UI components (e.g., cards, charts, icons) to display ground data.
- Use CSS, canvas, or SVG for gradients, backgrounds, and smooth transitions between time slices.
- Apply a unique color palette and style for the Ground layer, consistent with the app’s design language.
- Animate data and visual changes for a dynamic, modern experience.
- Ensure all visuals are responsive and accessible.

Acceptance criteria:
- [ ] Ground layer visuals are distinct, attractive, and consistent.
- [ ] Data is presented clearly and updates smoothly.
- [ ] Visuals are responsive and accessible.
- [ ] Automated tests verify visual component rendering and data-driven updates.

### 1.4 Progressive Enhancement & Responsiveness

Ensure mobile-first, responsive design and add touch and keyboard navigation for the Ground layer.

Context: The app should work seamlessly on all devices and be accessible to all users.

Implementation details:
- Use responsive CSS (flexbox, grid, media queries) to adapt the layout for mobile, tablet, and desktop.
- Test and optimize the UI for different screen sizes and input methods.
- Implement touch gestures (swipe, tap) for navigation on mobile devices.
- Add keyboard navigation and focus management for accessibility.

Acceptance criteria:
- [ ] The app is fully usable and visually correct on mobile, tablet, and desktop.
- [ ] Users can navigate using touch and keyboard.
- [ ] Accessibility best practices are followed.
- [ ] Automated tests verify responsiveness, touch, and keyboard navigation.

### 1.5 Performance & Accessibility

Optimize for fast loading, smooth animations, and accessibility features for the Ground layer.

Context: The app should load quickly, run smoothly, and be accessible to all users, including those with disabilities.

Implementation details:
- Minimize bundle size and optimize asset loading (e.g., lazy loading, compression).
- Use efficient rendering and animation techniques for smooth UI updates.
- Ensure sufficient color contrast, ARIA labels, and semantic HTML.
- Support screen readers and keyboard-only navigation.

Acceptance criteria:
- [ ] The app loads quickly and animations are smooth.
- [ ] Accessibility checks (contrast, ARIA, keyboard navigation) pass.
- [ ] Automated tests verify performance optimizations and accessibility features.


---


## Phase 2: Sea Layer Implementation
(To be detailed)

---


## Phase 3: Sky Layer Implementation
(To be detailed)

---


## Phase 4: Astro Layer Implementation
(To be detailed)
