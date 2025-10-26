const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const https = require('https');
const { URL } = require('url');

const weatherCache = new Map();
const CACHE_DURATION = 30 * 60 * 1000;

const isCacheValid = (timestamp) => {
  return Date.now() - timestamp < CACHE_DURATION;
};

// Helper function to make HTTPS requests
const httpsRequest = (url) => {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || 443,
      path: urlObj.pathname + urlObj.search,
      method: 'GET',
      headers: {
        'User-Agent': 'Eventra-Weather-Service/1.0'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            const jsonData = JSON.parse(data);
            resolve({
              ok: true,
              status: res.statusCode,
              json: () => Promise.resolve(jsonData)
            });
          } catch (error) {
            reject(new Error(`Failed to parse JSON: ${error.message}`));
          }
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(new Error(`Request failed: ${error.message}`));
    });

    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.end();
  });
};

const geocodeLocation = async (location) => {
  const apiKey = process.env.OPENWEATHERMAP_API_KEY;
  if (!apiKey) {
    throw new Error('OpenWeatherMap API key not configured');
  }

  let cleanLocation = location.trim();

  if (!cleanLocation.includes('India') && !cleanLocation.includes('IN')) {
    cleanLocation = `${cleanLocation}, India`;
  }

  const geocodeUrl = `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(cleanLocation)}&limit=1&appid=${apiKey}`;
  
  try {
    const response = await httpsRequest(geocodeUrl);
    if (!response.ok) {
      throw new Error(`Geocoding failed: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data || data.length === 0) {
      const parts = location.split(',').map(part => part.trim());
      if (parts.length > 1) {
        const fallbackLocation = parts.slice(0, -1).join(', ') + ', India';
        const fallbackUrl = `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(fallbackLocation)}&limit=1&appid=${apiKey}`;
        const fallbackResponse = await httpsRequest(fallbackUrl);
        const fallbackData = await fallbackResponse.json();
        
        if (fallbackData && fallbackData.length > 0) {
          return {
            name: fallbackData[0].name,
            lat: fallbackData[0].lat,
            lon: fallbackData[0].lon,
            country: fallbackData[0].country,
            state: fallbackData[0].state
          };
        }
      }
      throw new Error('Location not found');
    }
    
    return {
      name: data[0].name,
      lat: data[0].lat,
      lon: data[0].lon,
      country: data[0].country,
      state: data[0].state
    };
  } catch (error) {
    console.error('Geocoding error:', error);
    throw new Error(`Failed to geocode location: ${error.message}`);
  }
};

const getWeatherData = async (lat, lon, eventDate = null) => {
  const apiKey = process.env.OPENWEATHERMAP_API_KEY;
  
  try {
    const currentWeatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;
    const currentResponse = await httpsRequest(currentWeatherUrl);
    
    if (!currentResponse.ok) {
      throw new Error(`Current weather API failed: ${currentResponse.status}`);
    }
    
    const currentData = await currentResponse.json();
    
    const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;
    const forecastResponse = await httpsRequest(forecastUrl);
    
    if (!forecastResponse.ok) {
      throw new Error(`Forecast API failed: ${forecastResponse.status}`);
    }
    
    const forecastData = await forecastResponse.json();
    
    console.log('Backend - Forecast API response received');
    console.log('Backend - Number of forecast items:', forecastData.list ? forecastData.list.length : 0);
    if (forecastData.list && forecastData.list.length > 0) {
      const firstDate = new Date(forecastData.list[0].dt * 1000).toISOString().split('T')[0];
      const lastDate = new Date(forecastData.list[forecastData.list.length - 1].dt * 1000).toISOString().split('T')[0];
      console.log('Backend - Forecast date range:', firstDate, 'to', lastDate);
      console.log('Backend - First forecast UTC:', new Date(forecastData.list[0].dt * 1000).toUTCString());
      
      // Log all available forecast dates for debugging
      console.log('Backend - All available forecast dates:');
      const now = new Date(); // Define now here for the forEach loop
      forecastData.list.forEach((item, index) => {
        const itemDate = new Date(item.dt * 1000);
        const itemDateStr = itemDate.toISOString().split('T')[0];
        const itemTime = itemDate.toTimeString().split(' ')[0];
        const daysFromNow = Math.ceil((itemDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
        console.log(`  ${index}: ${itemDateStr} ${itemTime} (${daysFromNow} days from now)`);
      });
    } else {
      console.log('Backend - No forecast data received from API');
    }
    
    let eventForecast = null;
    if (eventDate) {
      let targetDate;
      if (typeof eventDate === 'string') {
        if (eventDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
          const [year, month, day] = eventDate.split('-');
          targetDate = new Date(Date.UTC(parseInt(year), parseInt(month) - 1, parseInt(day), 12, 0, 0));
          console.log('Backend - Parsed YYYY-MM-DD format:', eventDate, '->', targetDate);
        }
        else if (eventDate.includes('/')) {
          const [month, day, year] = eventDate.split('/');
          targetDate = new Date(Date.UTC(parseInt(year), parseInt(month) - 1, parseInt(day), 12, 0, 0));
          console.log('Backend - Parsed MM/DD/YYYY format:', eventDate, '->', targetDate);
        }
        else {
          targetDate = new Date(eventDate);
          if (isNaN(targetDate.getTime())) {
            console.log('Backend - Invalid date format, using current date');
            targetDate = new Date();
          }
          // Convert to UTC to avoid timezone issues
          targetDate = new Date(Date.UTC(
            targetDate.getFullYear(),
            targetDate.getMonth(),
            targetDate.getDate(),
            12, 0, 0
          ));
          console.log('Backend - Parsed fallback format:', eventDate, '->', targetDate);
        }
      } else {
        targetDate = new Date(eventDate);
        if (isNaN(targetDate.getTime())) {
          console.log('Backend - Invalid date object, using current date');
          targetDate = new Date();
        }
        // Convert to UTC to avoid timezone issues
        targetDate = new Date(Date.UTC(
          targetDate.getFullYear(),
          targetDate.getMonth(),
          targetDate.getDate(),
          12, 0, 0
        ));
        console.log('Backend - Parsed non-string format:', eventDate, '->', targetDate);
      }
      
      const targetDateStr = targetDate.toISOString().split('T')[0];
      
      console.log('Backend - Received event date:', eventDate);
      console.log('Backend - Parsed target date:', targetDateStr);
      console.log('Backend - Target date object:', targetDate);
      console.log('Backend - Target date timezone offset:', targetDate.getTimezoneOffset());
      console.log('Backend - Target date UTC:', targetDate.toUTCString());
      console.log('Backend - Looking for forecast for date:', targetDateStr);
      
      console.log('Backend - Available forecast dates:');
      const uniqueDates = new Set();
      forecastData.list.forEach((item, index) => {
        const itemDate = new Date(item.dt * 1000);
        const itemDateStr = itemDate.toISOString().split('T')[0];
        const timeDiff = Math.abs(itemDate.getTime() - targetDate.getTime());
        const daysDiff = Math.round(timeDiff / (24 * 60 * 60 * 1000));
        uniqueDates.add(itemDateStr);
        console.log(`  ${index}: ${itemDateStr} (${itemDate.toLocaleDateString()}) - ${daysDiff} days away`);
      });
      console.log('Backend - Unique forecast dates available:', Array.from(uniqueDates).sort());
      
      // Log the target date for debugging
      const daysFromNow = Math.ceil((targetDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
      console.log('Backend - Current server time:', now.toISOString());
      console.log('Backend - Current server date:', now.toISOString().split('T')[0]);
      console.log('Backend - Target date is', daysFromNow, 'days from now');
      console.log('Backend - Attempting to find forecast for:', targetDateStr);
      
      // Find forecasts for the target date using a more robust approach
      console.log('Backend - Looking for forecasts near target date:', targetDateStr);
      const forecastsOnTargetDate = forecastData.list.filter(item => {
        const itemDate = new Date(item.dt * 1000);
        const daysDiff = Math.abs((itemDate.getTime() - targetDate.getTime()) / (24 * 60 * 60 * 1000));
        const matches = daysDiff < 0.5; // Within 12 hours of target date
        console.log(`Checking forecast item: ${itemDate.toISOString().split('T')[0]} vs target: ${targetDateStr} - Days diff: ${daysDiff.toFixed(2)} - Match: ${matches}`);
        return matches;
      });
      console.log('Backend - Found', forecastsOnTargetDate.length, 'exact matches for', targetDateStr);
      
      // If no exact match, let's see what dates are actually available
      if (forecastsOnTargetDate.length === 0) {
        console.log('Backend - No exact match found. Available dates are:');
        const availableDates = [...new Set(forecastData.list.map(item => {
          const itemDate = new Date(item.dt * 1000);
          return itemDate.toISOString().split('T')[0];
        }))].sort();
        console.log('Backend - Available dates:', availableDates);
        console.log('Backend - Looking for:', targetDateStr);
        console.log('Backend - Is target date in available dates?', availableDates.includes(targetDateStr));
      }
      
      if (forecastsOnTargetDate.length > 0) {
        // Find the forecast closest to noon (12:00) on the target date
        const targetDateOnly = new Date(targetDateStr);
        const targetTime = targetDateOnly.getTime() + (12 * 60 * 60 * 1000); // 12:00 PM
        eventForecast = forecastsOnTargetDate.reduce((closest, current) => {
          const currentTime = new Date(current.dt * 1000).getTime();
          const closestTime = new Date(closest.dt * 1000).getTime();
          const currentDiff = Math.abs(currentTime - targetTime);
          const closestDiff = Math.abs(closestTime - targetTime);
          return currentDiff < closestDiff ? current : closest;
        });
        console.log('Found forecast for target date:', targetDateStr, 'at time:', new Date(eventForecast.dt * 1000).toISOString());
      } else {
        console.log('No forecasts found for target date:', targetDateStr);
        
        // Try to find the closest available forecast
        const targetTime = targetDate.getTime();
        
        const closestForecast = forecastData.list
          .map(item => {
            const itemDate = new Date(item.dt * 1000);
            const timeDiff = Math.abs(itemDate.getTime() - targetTime);
            return {
              ...item,
              timeDiff: timeDiff,
              dateStr: itemDate.toISOString().split('T')[0]
            };
          })
          .sort((a, b) => a.timeDiff - b.timeDiff);
        
        console.log('Backend - Closest forecasts (sorted by time difference):');
        closestForecast.slice(0, 5).forEach((item, index) => {
          const daysDiff = Math.round(item.timeDiff / (24 * 60 * 60 * 1000));
          console.log(`  ${index}: ${item.dateStr} - ${daysDiff} days away`);
        });
        
        if (closestForecast.length > 0) {
          eventForecast = closestForecast[0];
          const closestDate = new Date(eventForecast.dt * 1000).toISOString().split('T')[0];
          const daysDiff = Math.round(eventForecast.timeDiff / (24 * 60 * 60 * 1000));
          console.log('Using closest available forecast:', closestDate, `(${daysDiff} days away)`);
        } else {
          console.log('No forecast data available at all');
        }
      }
      
    }

    // Check if the forecast is for the exact event date or a different date
    let isExactDate = false;
    if (eventForecast && eventDate) {
      const forecastDate = new Date(eventForecast.dt * 1000).toISOString().split('T')[0];
      // Use the same UTC parsing logic as the target date
      let targetDateStr;
      if (typeof eventDate === 'string') {
        if (eventDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
          const [year, month, day] = eventDate.split('-');
          const targetDate = new Date(Date.UTC(parseInt(year), parseInt(month) - 1, parseInt(day), 12, 0, 0));
          targetDateStr = targetDate.toISOString().split('T')[0];
        } else {
          targetDateStr = new Date(eventDate).toISOString().split('T')[0];
        }
      } else {
        targetDateStr = new Date(eventDate).toISOString().split('T')[0];
      }
      isExactDate = forecastDate === targetDateStr;
      console.log('Backend - isExactDate check:');
      console.log('  Forecast date:', forecastDate);
      console.log('  Target date string:', targetDateStr);
      console.log('  Are they equal?', forecastDate === targetDateStr);
      console.log('  isExactDate result:', isExactDate);
      console.log('  Forecast date type:', typeof forecastDate);
      console.log('  Target date type:', typeof targetDateStr);
    }

    return {
      current: {
        temperature: Math.round(currentData.main.temp),
        feelsLike: Math.round(currentData.main.feels_like),
        condition: currentData.weather[0].main,
        description: currentData.weather[0].description,
        icon: currentData.weather[0].icon,
        humidity: currentData.main.humidity,
        windSpeed: Math.round(currentData.wind.speed * 3.6), // Convert m/s to km/h
        pressure: currentData.main.pressure
      },
      forecast: eventForecast ? {
        temperature: Math.round(eventForecast.main.temp),
        feelsLike: Math.round(eventForecast.main.feels_like),
        condition: eventForecast.weather[0].main,
        description: eventForecast.weather[0].description,
        icon: eventForecast.weather[0].icon,
        humidity: eventForecast.main.humidity,
        windSpeed: Math.round(eventForecast.wind.speed * 3.6),
        time: new Date(eventForecast.dt * 1000).toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit' 
        }),
        date: new Date(eventForecast.dt * 1000).toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        }),
        isExactDate: isExactDate
      } : null,
      location: {
        name: currentData.name,
        country: currentData.sys.country
      }
    };
  } catch (error) {
    console.error('Weather API error:', error);
    throw new Error(`Failed to fetch weather data: ${error.message}`);
  }
};

// GET /api/weather/:location
router.get('/weather/:location', verifyToken, async (req, res) => {
  try {
    // TEMPORARY: Clear cache for debugging
    weatherCache.clear();
    console.log('Cache cleared for debugging');
    
    console.log('RAW REQUEST:', {
      method: req.method,
      url: req.url,
      originalUrl: req.originalUrl,
      query: req.query,
      params: req.params,
      queryKeys: Object.keys(req.query),
      queryValues: Object.values(req.query)
    });
    
    const { location } = req.params;
    const { eventDate } = req.query;
    
    console.log('Weather API called with:');
    console.log('  Location:', location);
    console.log('  Event Date:', eventDate);
    console.log('  Event Date Type:', typeof eventDate);
    console.log('  Raw query object:', req.query);
    console.log('  Query keys:', Object.keys(req.query));
    console.log('  Query values:', Object.values(req.query));
    console.log('  Full req.query:', req.query);
    console.log('  Full req.params:', req.params);
    console.log('  Request URL:', req.url);
    console.log('  Current Date:', new Date().toISOString().split('T')[0]);
    console.log('  Days from now:', eventDate ? Math.ceil((new Date(eventDate) - new Date()) / (24 * 60 * 60 * 1000)) : 'N/A');
    
    if (!location) {
      return res.status(400).json({
        error: 'Location required',
        message: 'Please provide a location parameter'
      });
    }

    // Check if API key is configured
    const apiKey = process.env.OPENWEATHERMAP_API_KEY;
    console.log('API Key check:', apiKey ? 'Found' : 'Not found');
    console.log('API Key length:', apiKey ? apiKey.length : 0);
    console.log('API Key value:', apiKey ? apiKey.substring(0, 8) + '...' : 'Not set');
    console.log('All env vars:', Object.keys(process.env).filter(key => key.includes('WEATHER')));
    
    if (!apiKey) {
      console.error('OpenWeatherMap API key not configured');
      return res.status(500).json({
        error: 'Weather service error',
        message: 'OpenWeatherMap API key not configured'
      });
    }
    
    // Check cache first
    const cacheKey = `${location}:${eventDate || 'current'}`;
    const cachedData = weatherCache.get(cacheKey);
    
    console.log('Cache key:', cacheKey);
    console.log('Cache exists:', !!cachedData);
    console.log('Cache valid:', cachedData ? isCacheValid(cachedData.timestamp) : false);
    
    if (cachedData && isCacheValid(cachedData.timestamp)) {
      console.log('Returning cached weather data for:', location, 'with eventDate:', eventDate);
      return res.json({
        success: true,
        data: cachedData.data,
        cached: true
      });
    }
    
    console.log('Fetching fresh weather data for:', location);
    
    try {
      // Geocode location
      const geocodedLocation = await geocodeLocation(location);
      
      // Get weather data
      const weatherData = await getWeatherData(
        geocodedLocation.lat, 
        geocodedLocation.lon, 
        eventDate
      );
      
      // Add location info to response
      const responseData = {
        ...weatherData,
        location: {
          ...weatherData.location,
          original: location,
          geocoded: geocodedLocation
        }
      };
      
      // Cache the result
      weatherCache.set(cacheKey, {
        data: responseData,
        timestamp: Date.now()
      });
      
      // Clean old cache entries (simple cleanup)
      if (weatherCache.size > 100) {
        const now = Date.now();
        for (const [key, value] of weatherCache.entries()) {
          if (!isCacheValid(value.timestamp)) {
            weatherCache.delete(key);
          }
        }
      }
      
      res.json({
        success: true,
        data: responseData,
        cached: false
      });
    } catch (weatherError) {
      console.error('Weather fetch error:', weatherError);
      
      // Return a fallback response instead of failing completely
      const fallbackData = {
        current: {
          temperature: 25,
          feelsLike: 27,
          condition: 'Clear',
          description: 'clear sky',
          icon: '01d',
          humidity: 60,
          windSpeed: 10,
          pressure: 1013
        },
        forecast: eventDate ? {
          temperature: 24,
          feelsLike: 26,
          condition: 'Clear',
          description: 'clear sky',
          icon: '01d',
          humidity: 65,
          windSpeed: 8,
          time: '12:00 PM',
          date: new Date(eventDate).toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })
        } : null,
        location: {
          name: location,
          country: 'IN',
          original: location
        }
      };
      
      res.json({
        success: true,
        data: fallbackData,
        cached: false,
        fallback: true,
        message: 'Using fallback weather data due to API issues'
      });
    }
    
  } catch (error) {
    console.error('Weather API error:', error);
    res.status(500).json({
      error: 'Weather service error',
      message: error.message
    });
  }
});

// Test endpoint to verify weather API is working
router.get('/weather-test', (req, res) => {
  const apiKey = process.env.OPENWEATHERMAP_API_KEY;
  res.json({
    apiKeyConfigured: !!apiKey,
    apiKeyLength: apiKey ? apiKey.length : 0,
    apiKeyPreview: apiKey ? apiKey.substring(0, 8) + '...' : 'Not set',
    timestamp: new Date().toISOString()
  });
});

// Debug endpoint to test weather forecast for a specific date
router.get('/weather-debug/:location/:date', async (req, res) => {
  try {
    const { location, date } = req.params;
    console.log('Debug endpoint called with:', { location, date });
    
    // Get weather data
    const geocodedLocation = await geocodeLocation(location);
    const weatherData = await getWeatherData(geocodedLocation.lat, geocodedLocation.lon, date);
    
    res.json({
      success: true,
      location: location,
      date: date,
      weatherData: weatherData,
      debug: {
        currentTime: new Date().toISOString(),
        currentDate: new Date().toISOString().split('T')[0],
        targetDate: date,
        daysFromNow: Math.ceil((new Date(date).getTime() - new Date().getTime()) / (24 * 60 * 60 * 1000))
      }
    });
  } catch (error) {
    console.error('Debug endpoint error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Simple test endpoint to check what dates are available
router.get('/weather-test-dates/:location', async (req, res) => {
  try {
    const { location } = req.params;
    console.log('Testing available dates for:', location);
    
    // Get geocoded location
    const geocodedLocation = await geocodeLocation(location);
    
    // Get raw forecast data
    const apiKey = process.env.OPENWEATHERMAP_API_KEY;
    const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${geocodedLocation.lat}&lon=${geocodedLocation.lon}&appid=${apiKey}&units=metric`;
    
    const https = require('https');
    const { URL } = require('url');
    
    const response = await new Promise((resolve, reject) => {
      const urlObj = new URL(forecastUrl);
      const options = {
        hostname: urlObj.hostname,
        port: urlObj.port || 443,
        path: urlObj.pathname + urlObj.search,
        method: 'GET',
        headers: {
          'User-Agent': 'Eventra-Weather-Service/1.0'
        }
      };

      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            try {
              const jsonData = JSON.parse(data);
              resolve({ ok: true, status: res.statusCode, json: () => Promise.resolve(jsonData) });
            } catch (error) {
              reject(new Error(`Failed to parse JSON: ${error.message}`));
            }
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${data}`));
          }
        });
      });

      req.on('error', (error) => reject(new Error(`Request failed: ${error.message}`)));
      req.setTimeout(10000, () => { req.destroy(); reject(new Error('Request timeout')); });
      req.end();
    });
    
    const forecastData = await response.json();
    
    // Extract all available dates
    const availableDates = [...new Set(forecastData.list.map(item => {
      const itemDate = new Date(item.dt * 1000);
      return itemDate.toISOString().split('T')[0];
    }))].sort();
    
    res.json({
      success: true,
      location: location,
      currentDate: new Date().toISOString().split('T')[0],
      availableDates: availableDates,
      totalForecastItems: forecastData.list.length,
      firstForecastDate: availableDates[0],
      lastForecastDate: availableDates[availableDates.length - 1]
    });
  } catch (error) {
    console.error('Test dates endpoint error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;