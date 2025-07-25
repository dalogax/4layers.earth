import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { GroundDataService } from './services/GroundDataService.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Manual environment configuration (no dotenv dependency)
function loadEnvironment() {
  try {
    const envPath = path.join(process.cwd(), '.env');
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf8');
      envContent.split('\n').forEach(line => {
        const [key, value] = line.split('=');
        if (key && value) {
          process.env[key.trim()] = value.trim();
        }
      });
    }
  } catch (error) {
    console.log('No .env file found or error reading it');
  }
}

loadEnvironment();

const app = express();
const PORT = process.env.PORT || 8080;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Initialize Ground Data Service
const groundDataService = new GroundDataService();

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// Ground Layer API Endpoints

/**
 * GET /api/ground/current - Current weather conditions
 * Query params: lat, lon (optional, defaults to New York)
 */
app.get('/api/ground/current', async (req, res) => {
  try {
    const lat = parseFloat(req.query.lat) || 40.7128;
    const lon = parseFloat(req.query.lon) || -74.0060;
    
    const data = await groundDataService.getCurrentConditions(lat, lon);
    
    res.json({
      status: 'success',
      data: data,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/ground/timeline - Timeline weather data
 * Query params: lat, lon, hours (optional)
 */
app.get('/api/ground/timeline', async (req, res) => {
  try {
    const lat = parseFloat(req.query.lat) || 40.7128;
    const lon = parseFloat(req.query.lon) || -74.0060;
    const hours = parseInt(req.query.hours) || 24;
    
    const data = await groundDataService.getTimelineData(lat, lon, hours);
    
    res.json({
      status: 'success',
      data: data,
      meta: {
        location: { lat, lon },
        hours: hours,
        dataPoints: data.length
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/ground/location - Location validation and data
 * Query params: lat, lon, city (city not implemented in MVP)
 */
app.get('/api/ground/location', async (req, res) => {
  try {
    const lat = parseFloat(req.query.lat);
    const lon = parseFloat(req.query.lon);
    
    if (isNaN(lat) || isNaN(lon)) {
      return res.status(400).json({
        status: 'error',
        message: 'Valid latitude and longitude required',
        timestamp: new Date().toISOString()
      });
    }
    
    const isValid = groundDataService.validateLocation(lat, lon);
    
    if (!isValid) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid coordinates. Latitude must be -90 to 90, longitude -180 to 180',
        timestamp: new Date().toISOString()
      });
    }
    
    res.json({
      status: 'success',
      data: {
        lat,
        lon,
        valid: true,
        message: 'Coordinates are valid'
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Catch-all: serve index.html for any non-API route (for SPA/PWA)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
  console.log(`Environment: ${NODE_ENV}`);
  console.log('Ground Layer API endpoints:');
  console.log('  GET /api/ground/current');
  console.log('  GET /api/ground/timeline');
  console.log('  GET /api/ground/location');
});
