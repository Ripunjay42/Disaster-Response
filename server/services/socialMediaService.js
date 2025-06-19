import { Cache } from '../models/index.js';
import { Op } from 'sequelize';

// Cache TTL (1 hour)
const CACHE_TTL = 60 * 60 * 1000;

// Check cache for social media data
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

// Generate mock social media data based on disaster info
export const getMockSocialMediaPosts = async (disasterId, disasterDetails) => {
  // Create a cache key
  const cacheKey = `social_media:${disasterId}:${Date.now().toString().substr(0, 7)}`;
  
  // Check cache first (refresh approximately every 10 minutes by using timestamp in key)
  const cachedResult = await checkCache(cacheKey);
  if (cachedResult) {
    console.log('Using cached social media data');
    return cachedResult;
  }
  
  // Get location name and tags for realistic mock data
  const { title, location_name, tags = [] } = disasterDetails;
  const locationName = location_name || 'the affected area';
  
  // Generate hashtags based on disaster tags
  const hashtagsFromTags = tags.map(tag => `#${tag.replace(/\s+/g, '')}`);
  const commonHashtags = ['#emergency', '#disaster', '#help', '#relief'];
  const allHashtags = [...hashtagsFromTags, ...commonHashtags];
  
  // Common needs during disasters
  const needs = [
    'food', 'water', 'shelter', 'medical supplies', 'evacuation', 
    'electricity', 'internet', 'transportation', 'baby supplies',
    'blankets', 'clothing', 'volunteers', 'information'
  ];
  
  // Mock user names
  const usernames = [
    'LocalReporter', 'CitizenJournalist', 'EmergencyUpdates', 
    'ReliefWorker', 'AreaResident', 'CommunityHelper',
    'DisasterResponse', 'LocalAuthority', 'ConcernedCitizen',
    'VolunteerCoordinator', 'NewsAlert', 'SafetyFirst'
  ];
  
  // Generate random posts
  const generateRandomPosts = (count) => {
    const posts = [];
    for (let i = 0; i < count; i++) {
      // Randomly select post type
      const postType = Math.random() > 0.7 ? 'update' : Math.random() > 0.5 ? 'need' : 'offer';
      
      let postContent = '';
      const randomHashtags = [...allHashtags]
        .sort(() => 0.5 - Math.random())
        .slice(0, 2 + Math.floor(Math.random() * 3))
        .join(' ');
      
      // Generate content based on type
      switch (postType) {
        case 'need':
          const randomNeed = needs[Math.floor(Math.random() * needs.length)];
          postContent = `Need ${randomNeed} in ${locationName}. ${randomHashtags}`;
          break;
        case 'offer':
          const randomOffer = needs[Math.floor(Math.random() * needs.length)];
          postContent = `Offering ${randomOffer} at ${locationName}. DM for details. ${randomHashtags}`;
          break;
        case 'update':
          const updates = [
            `Situation worsening in ${locationName}. Stay safe.`,
            `Authorities responding to ${title} in ${locationName}.`,
            `Roads blocked near ${locationName} due to ${title}.`,
            `Volunteer center set up at community center in ${locationName}.`,
            `Power outages reported across ${locationName}.`
          ];
          postContent = `${updates[Math.floor(Math.random() * updates.length)]} ${randomHashtags}`;
          break;
      }
      
      // Add urgency markers to some posts
      if (Math.random() > 0.8) {
        const urgencyMarkers = ['URGENT', 'SOS', 'HELP NEEDED', 'CRITICAL'];
        const marker = urgencyMarkers[Math.floor(Math.random() * urgencyMarkers.length)];
        postContent = `${marker}: ${postContent}`;
      }
      
      // Create post object
      posts.push({
        id: `mock-${Date.now()}-${i}`,
        username: usernames[Math.floor(Math.random() * usernames.length)],
        content: postContent,
        timestamp: new Date(Date.now() - Math.floor(Math.random() * 3600000)).toISOString(),
        type: postType,
        priority: postContent.includes('URGENT') || postContent.includes('SOS') ? 'high' : 'normal'
      });
    }
    return posts;
  };
  
  // Generate 5-15 random posts
  const postCount = 5 + Math.floor(Math.random() * 10);
  const posts = generateRandomPosts(postCount);
  
  // Save to cache
  await saveToCache(cacheKey, posts);
  
  return posts;
};