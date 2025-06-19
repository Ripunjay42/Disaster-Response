import axios from 'axios';
import dotenv from 'dotenv';
import { Cache } from '../models/index.js';
import { Op } from 'sequelize';

dotenv.config();

// Google Gemini API configuration
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro';
const GEMINI_VISION_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro-vision';

// Cache TTL (1 hour)
const CACHE_TTL = 60 * 60 * 1000;

// Check cache for Gemini API data
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

// Extract location from a description using Gemini API
export const extractLocationFromText = async (text) => {
  if (!text) {
    throw new Error('Text description is required');
  }
  
  // Create a cache key
  const cacheKey = `location_extract:${text.substring(0, 100)}`;
  
  // Check cache first
  const cachedResult = await checkCache(cacheKey);
  if (cachedResult) {
    console.log('Using cached location extraction');
    return cachedResult;
  }
  
  try {
    const response = await axios.post(
      `${GEMINI_API_URL}:generateContent?key=${GEMINI_API_KEY}`,
      {
        contents: [
          {
            parts: [
              {
                text: `Extract the location names from the following text. Only return the location name, nothing else. If multiple locations are mentioned, return the most specific one. If no location is mentioned, return "Unknown location".
                  
Text: ${text}`
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 100
        }
      }
    );
    
    // Extract the response text
    const responseText = response.data.candidates[0]?.content?.parts[0]?.text?.trim() || 'Unknown location';
    
    // Save result to cache
    await saveToCache(cacheKey, { location: responseText });
    
    return { location: responseText };
  } catch (error) {
    console.error('Location extraction error:', error.message);
    throw new Error(`Location extraction failed: ${error.message}`);
  }
};

// Verify image authenticity using Gemini Vision API
export const verifyImage = async (imageUrl, description) => {
  if (!imageUrl) {
    throw new Error('Image URL is required');
  }
  
  // Create a cache key
  const cacheKey = `image_verify:${imageUrl}`;
  
  // Check cache first
  const cachedResult = await checkCache(cacheKey);
  if (cachedResult) {
    console.log('Using cached image verification');
    return cachedResult;
  }
  
  try {
    // First download the image and convert to base64
    const imageResponse = await axios.get(imageUrl, { responseType: 'arraybuffer' });
    const base64Image = Buffer.from(imageResponse.data, 'binary').toString('base64');
    
    const response = await axios.post(
      `${GEMINI_VISION_API_URL}:generateContent?key=${GEMINI_API_KEY}`,
      {
        contents: [
          {
            parts: [
              { text: `Analyze this disaster image. Is it authentic or manipulated? Does it match the following description: "${description}"? Provide a brief analysis and a verification score from 0-100 (0 being definitely fake, 100 being definitely authentic).` },
              {
                inline_data: {
                  mime_type: imageResponse.headers['content-type'] || 'image/jpeg',
                  data: base64Image
                }
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 800
        }
      }
    );
    
    // Extract the response text
    const analysisText = response.data.candidates[0]?.content?.parts[0]?.text || 'Unable to analyze image';
    
    // Try to extract a numeric score from the text
    const scoreMatch = analysisText.match(/(\d{1,3})\/100|score:?\s*(\d{1,3})|(\d{1,3})%/i);
    const score = scoreMatch ? parseInt(scoreMatch[1] || scoreMatch[2] || scoreMatch[3]) : 50;
    
    const result = {
      analysis: analysisText,
      score,
      verification: score >= 70 ? 'verified' : score <= 30 ? 'fake' : 'uncertain'
    };
    
    // Save result to cache
    await saveToCache(cacheKey, result);
    
    return result;
  } catch (error) {
    console.error('Image verification error:', error.message);
    throw new Error(`Image verification failed: ${error.message}`);
  }
};