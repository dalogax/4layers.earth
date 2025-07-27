// Debug utilities for testing animations
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

console.log('Animation debug utilities loaded. Use:');
console.log('- window.testAnimations() to test counter animations');
console.log('- window.testTimelineAnimation() to test weather condition changes');
