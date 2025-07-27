// Debug utilities for testing animations and state management
// Add to browser console: window.testAnimations() to see counter animations in action

window.testAnimations = function() {
  console.log('Testing counter animations...');
  
  // Test temperature animation
  const tempElement = document.querySelector('#temperature-display .metric-value');
  if (tempElement && window.weatherApp?.animations?.temperature) {
    console.log('Testing temperature counter animation from 22° to 28°');
    window.weatherApp.animations.temperature.animateTo(28);
    
    setTimeout(() => {
      console.log('Testing temperature counter animation from 28° to 15°');
      window.weatherApp.animations.temperature.animateTo(15);
    }, 1000);
  }
  
  // Test humidity animation
  const humidityElement = document.querySelector('#humidity-display .metric-value');
  if (humidityElement && window.weatherApp?.animations?.humidity) {
    setTimeout(() => {
      console.log('Testing humidity counter animation from 68% to 45%');
      window.weatherApp.animations.humidity.animateTo(45);
    }, 500);
    
    setTimeout(() => {
      console.log('Testing humidity counter animation from 45% to 82%');
      window.weatherApp.animations.humidity.animateTo(82);
    }, 1500);
  }
  
  // Test pressure animation
  const pressureElement = document.querySelector('#pressure-display .metric-value');
  if (pressureElement && window.weatherApp?.animations?.pressure) {
    setTimeout(() => {
      console.log('Testing pressure counter animation from 1013 to 1025');
      window.weatherApp.animations.pressure.animateTo(1025);
    }, 750);
    
    setTimeout(() => {
      console.log('Testing pressure counter animation from 1025 to 998');
      window.weatherApp.animations.pressure.animateTo(998);
    }, 1750);
  }
  
  // Test text transition
  if (window.weatherApp?.animations?.temperatureDetails) {
    setTimeout(() => {
      console.log('Testing text transition for temperature details');
      window.weatherApp.animations.temperatureDetails.transitionTo('feels like 18°');
    }, 250);
    
    setTimeout(() => {
      console.log('Testing text transition back to original');
      window.weatherApp.animations.temperatureDetails.transitionTo('feels like 24°');
    }, 2000);
  }
};

window.testTimelineAnimation = function() {
  console.log('Testing timeline data changes with animations...');
  
  // Simulate different weather conditions
  const weatherConditions = [
    {
      metrics: {
        temperature: { current: 18, feelsLike: 16 },
        humidity: 45,
        pressure: { current: 1020 }
      }
    },
    {
      metrics: {
        temperature: { current: 25, feelsLike: 28 },
        humidity: 72,
        pressure: { current: 1008 }
      }
    },
    {
      metrics: {
        temperature: { current: 31, feelsLike: 35 },
        humidity: 55,
        pressure: { current: 995 }
      }
    }
  ];
  
  weatherConditions.forEach((condition, index) => {
    setTimeout(() => {
      console.log(`Applying weather condition ${index + 1}:`, condition);
      if (window.weatherApp) {
        window.weatherApp.updateWeatherDisplay(condition);
      }
    }, index * 2000);
  });
};

window.testStateManagement = function() {
  console.log('Testing state management and data flow...');
  
  if (!window.weatherApp) {
    console.error('Weather app not found');
    return;
  }
  
  // Test state changes
  const testTimestamps = [
    new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
    new Date(), // now
    new Date(Date.now() + 1 * 60 * 60 * 1000), // 1 hour from now
    new Date(Date.now() + 2 * 60 * 60 * 1000)  // 2 hours from now
  ];
  
  testTimestamps.forEach((timestamp, index) => {
    setTimeout(() => {
      console.log(`Testing state change ${index + 1}: ${timestamp.toISOString()}`);
      window.weatherApp.groundState.setCurrentTime(timestamp);
    }, index * 1000);
  });
};

window.getPerformanceReport = function() {
  if (!window.weatherApp) {
    console.error('Weather app not found');
    return;
  }
  
  const stats = window.weatherApp.getPerformanceStats();
  
  console.log('=== PERFORMANCE REPORT ===');
  console.log('Performance:', stats.performance);
  console.log('Data Manager:', stats.dataManager);
  console.log('State:', stats.state);
  console.log('Event Bus:', stats.eventBus);
  
  // Check for potential issues
  const issues = [];
  
  if (stats.performance.isDroppingFrames) {
    issues.push('⚠️ Dropping frames - performance may be degraded');
  }
  
  if (stats.performance.isSlowUpdates) {
    issues.push('⚠️ Slow UI updates detected');
  }
  
  if (stats.performance.isHighMemoryUsage) {
    issues.push('⚠️ High memory usage detected');
  }
  
  if (stats.dataManager.errorRate > 0.1) {
    issues.push('⚠️ High API error rate detected');
  }
  
  if (stats.dataManager.cacheHitRate < 0.5) {
    issues.push('⚠️ Low cache hit rate - may be making too many API calls');
  }
  
  if (issues.length > 0) {
    console.log('=== ISSUES DETECTED ===');
    issues.forEach(issue => console.log(issue));
  } else {
    console.log('✅ No performance issues detected');
  }
  
  return stats;
};

window.testCaching = function() {
  console.log('Testing caching system...');
  
  if (!window.weatherApp) {
    console.error('Weather app not found');
    return;
  }
  
  const testLocation = { lat: 40.7128, lon: -74.0060 };
  const testTimes = [
    new Date(),
    new Date(Date.now() + 60 * 60 * 1000), // 1 hour from now
    new Date(Date.now() - 60 * 60 * 1000)  // 1 hour ago
  ];
  
  // Test cache performance
  testTimes.forEach(async (time, index) => {
    console.log(`Cache test ${index + 1}: Loading data for ${time.toISOString()}`);
    
    const start = performance.now();
    try {
      await window.weatherApp.dataManager.getDataForTime(time, testLocation);
      const duration = performance.now() - start;
      console.log(`Cache test ${index + 1}: Completed in ${duration.toFixed(2)}ms`);
    } catch (error) {
      console.error(`Cache test ${index + 1}: Failed:`, error);
    }
  });
  
  // Test cache hit after loading
  setTimeout(async () => {
    console.log('Testing cache hits...');
    
    for (const time of testTimes) {
      const start = performance.now();
      try {
        await window.weatherApp.dataManager.getDataForTime(time, testLocation);
        const duration = performance.now() - start;
        console.log(`Cache hit test for ${time.toISOString()}: ${duration.toFixed(2)}ms (should be <1ms if cached)`);
      } catch (error) {
        console.error('Cache hit test failed:', error);
      }
    }
  }, 2000);
};

console.log('State Management Debug utilities loaded. Use:');
console.log('- window.testAnimations() to test counter animations');
console.log('- window.testTimelineAnimation() to test weather condition changes');
console.log('- window.testStateManagement() to test state changes');
console.log('- window.getPerformanceReport() to get performance statistics');
console.log('- window.testCaching() to test caching system performance');
