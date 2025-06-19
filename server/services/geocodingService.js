import axios from 'axios';
import dotenv from 'dotenv';
import { Cache } from '../models/index.js';
import { Op } from 'sequelize';

dotenv.config();

// Mapbox API for geocoding
const MAPBOX_API_KEY = process.env.GEOCODING_API_KEY;
const MAPBOX_BASE_URL = 'https://api.mapbox.com/geocoding/v5/mapbox.places';

// Cache TTL (1 hour)
const CACHE_TTL = 60 * 60 * 1000;

// Check cache for geocoding data
const checkCache = async (key) => {
  try {
    const cacheEntry = await Cache.findOne({
      where: {
        key,
        expires_at: { [Op.gt]: new Date() }
      }
    });
    
    return cacheEntry ? cacheEntry.value : null;
  } catch (error) {
    console.error('Cache check error:', error);
    return null;
  }
};

// Save data to cache
const saveToCache = async (key, value) => {
  try {
    const expiresAt = new Date(Date.now() + CACHE_TTL);
    
    await Cache.upsert({
      key,
      value,
      expires_at: expiresAt
    });
  } catch (error) {
    console.error('Cache save error:', error);
  }
};

// Geocode a location name to coordinates using Mapbox
export const geocodeLocation = async (locationName) => {
  if (!locationName) {
    throw new Error('Location name is required');
  }

  // Create a cache key
  const cacheKey = `geocode:${locationName.toLowerCase().trim()}`;
  
  // Check cache first
  const cachedResult = await checkCache(cacheKey);
  if (cachedResult) {
    console.log(`Using cached geocoding for: ${locationName}`);
    return cachedResult;
  }
  
  try {
    // Make a request to Mapbox API
    const response = await axios.get(
      `${MAPBOX_BASE_URL}/${encodeURIComponent(locationName)}.json`,
      {
        params: {
          access_token: MAPBOX_API_KEY,
          limit: 1
        }
      }
    );
    
    // Check if we got a valid result
    if (response.data && response.data.features && response.data.features.length > 0) {
      const location = response.data.features[0];
      
      // Ensure coordinates are valid numbers
      if (!Array.isArray(location.center) || location.center.length < 2 || 
          typeof location.center[0] !== 'number' || typeof location.center[1] !== 'number') {
        throw new Error('Invalid coordinates in geocoding response');
      }
      
      const result = {
        longitude: location.center[0],
        latitude: location.center[1],
        full_name: location.place_name,
        bbox: location.bbox || null
      };
      
      // Save result to cache
      await saveToCache(cacheKey, result);
      
      return result;
    }
    
    throw new Error('Location not found');
  } catch (error) {
    // More detailed error logging
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error('Geocoding API error:', {
        status: error.response.status,
        data: error.response.data
      });
      throw new Error(`Geocoding failed: API error ${error.response.status}`);
    } else if (error.request) {
      // The request was made but no response was received
      console.error('Geocoding request error - no response received');
      throw new Error('Geocoding failed: No response from service');
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('Geocoding error:', error.message);
      throw new Error(`Geocoding failed: ${error.message}`);
    }
  }
};