import axios from 'axios';
import { Cache } from '../models/index.js';
import { Op } from 'sequelize';

// Cache TTL (1 hour)
const CACHE_TTL = 60 * 60 * 1000;

// Check cache for official updates data
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

// Mock official sources based on disaster type
const getSourcesForDisaster = (disasterDetails) => {
  const { tags = [] } = disasterDetails;
  const sources = [];
  
  // Default sources
  sources.push({
    name: 'FEMA',
    url: 'https://www.fema.gov/disasters',
    type: 'government'
  });
  
  sources.push({
    name: 'Red Cross',
    url: 'https://www.redcross.org/get-help/disaster-relief-and-recovery-services.html',
    type: 'relief'
  });
  
  // Add specific sources based on disaster tags
  if (tags.includes('flood') || tags.includes('hurricane') || tags.includes('storm')) {
    sources.push({
      name: 'National Weather Service',
      url: 'https://www.weather.gov',
      type: 'government'
    });
  }
  
  if (tags.includes('earthquake')) {
    sources.push({
      name: 'USGS Earthquake Hazards Program',
      url: 'https://earthquake.usgs.gov',
      type: 'government'
    });
  }
  
  if (tags.includes('fire') || tags.includes('wildfire')) {
    sources.push({
      name: 'National Interagency Fire Center',
      url: 'https://www.nifc.gov',
      type: 'government'
    });
  }
  
  return sources;
};

// Generate mock official updates
const generateMockUpdates = (disasterDetails, sources) => {
  const { title, location_name, tags = [] } = disasterDetails;
  const locationName = location_name || 'the affected area';
  const updates = [];
  
  // Date formatting
  const formatDate = (date) => {
    return date.toISOString().split('T')[0];
  };
  
  // Generic updates from each source
  sources.forEach(source => {
    // Generate 1-3 updates per source
    const updateCount = 1 + Math.floor(Math.random() * 3);
    
    for (let i = 0; i < updateCount; i++) {
      const daysAgo = Math.floor(Math.random() * 3);
      const updateDate = new Date();
      updateDate.setDate(updateDate.getDate() - daysAgo);
      
      let updateTitle = '';
      let updateContent = '';
      
      // Generate update based on source type
      if (source.type === 'government') {
        updateTitle = [
          `${source.name} Issues ${title} Alert for ${locationName}`,
          `Emergency Declaration for ${locationName}`,
          `${source.name} Response Updates for ${locationName}`,
          `${source.name} Mobilizes Resources for ${title} in ${locationName}`
        ][Math.floor(Math.random() * 4)];
        
        updateContent = [
          `${source.name} has issued an emergency declaration for ${locationName} following the recent ${title}. Local authorities are coordinating with federal agencies to provide assistance.`,
          `Response teams have been deployed to ${locationName}. Residents are advised to follow all evacuation orders and safety instructions.`,
          `${source.name} has established emergency shelters in ${locationName}. Visit the official website for locations and availability.`,
          `Assessment teams are currently evaluating damage in ${locationName}. Initial reports indicate significant impact to infrastructure and homes.`
        ][Math.floor(Math.random() * 4)];
      } else {
        updateTitle = [
          `${source.name} Relief Efforts Underway in ${locationName}`,
          `Volunteers Needed for ${title} Response in ${locationName}`,
          `${source.name} Distributing Supplies in ${locationName}`,
          `${source.name} Appeals for Donations for ${locationName} Relief`
        ][Math.floor(Math.random() * 4)];
        
        updateContent = [
          `${source.name} volunteers are on the ground in ${locationName} providing emergency assistance including food, shelter, and medical aid.`,
          `Emergency relief kits are being distributed at multiple locations throughout ${locationName}. Visit our website for distribution centers and times.`,
          `${source.name} is coordinating with local authorities to ensure effective delivery of aid to those affected by the ${title} in ${locationName}.`,
          `Donations are urgently needed to support relief efforts in ${locationName}. Financial contributions can be made through our official website.`
        ][Math.floor(Math.random() * 4)];
      }
      
      updates.push({
        source: source.name,
        source_url: source.url,
        title: updateTitle,
        content: updateContent,
        date: formatDate(updateDate),
        type: source.type
      });
    }
  });
  
  // Sort by date, most recent first
  updates.sort((a, b) => new Date(b.date) - new Date(a.date));
  
  return updates;
};

// Fetch official updates for a disaster
export const getOfficialUpdates = async (disasterId, disasterDetails) => {
  // Create a cache key with daily refresh
  const today = new Date().toISOString().split('T')[0];
  const cacheKey = `official_updates:${disasterId}:${today}`;
  
  // Check cache first
  const cachedResult = await checkCache(cacheKey);
  if (cachedResult) {
    console.log('Using cached official updates');
    return cachedResult;
  }
  
  try {
    // In a real implementation, we would:
    // 1. Use a web scraping library like cheerio to fetch data from official websites
    // 2. Parse the HTML to extract relevant updates
    // 3. Format the data consistently
    
    // For now, we'll generate mock data
    const sources = getSourcesForDisaster(disasterDetails);
    const updates = generateMockUpdates(disasterDetails, sources);
    
    // Save to cache
    await saveToCache(cacheKey, updates);
    
    return updates;
  } catch (error) {
    console.error('Error fetching official updates:', error);
    
    // Return empty array if there's an error
    return [];
  }
};