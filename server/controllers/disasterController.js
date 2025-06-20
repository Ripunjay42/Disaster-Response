import { Disaster, Report, sequelize } from '../models/index.js';
import { geocodeLocation } from '../services/geocodingService.js';
import { extractLocationFromText } from '../services/geminiService.js';
import { getMockSocialMediaPosts } from '../services/socialMediaService.js';
import { getOfficialUpdates } from '../services/updateService.js';
import { verifyImage } from '../services/geminiService.js';
import { formatAsUUID } from '../utils/uuidHelper.js';
import { Op } from 'sequelize';

// Create a new disaster
export const createDisaster = async (req, res) => {
  try {
    const { title, location_name, description, tags = [] } = req.body;
    
    // Validate required fields
    if (!title || !description) {
      return res.status(400).json({ error: 'Title and description are required' });
    }
    
    // Extract location if not provided and description is available
    let locationNameToUse = location_name;
    if (!locationNameToUse && description) {
      try {
        const extractedLocation = await extractLocationFromText(description);
        locationNameToUse = extractedLocation.location;
        if (locationNameToUse === 'Unknown location') {
          return res.status(400).json({ error: 'Could not extract location from description. Please provide a location name.' });
        }
      } catch (error) {
        return res.status(400).json({ error: `Failed to extract location: ${error.message}` });
      }
    }
    
    if (!locationNameToUse) {
      return res.status(400).json({ error: 'Location name is required' });
    }
    
    // Geocode the location
    let coordinates = null;
    try {
      const geocodedLocation = await geocodeLocation(locationNameToUse);
      coordinates = { 
        type: 'Point', 
        coordinates: [geocodedLocation.longitude, geocodedLocation.latitude]
      };
    } catch (error) {
      console.error('Geocoding error:', error);
      return res.status(400).json({ error: `Geocoding failed: ${error.message}` });
    }    // Create the disaster record
    const disaster = await Disaster.create({
      title,
      location_name: locationNameToUse,
      location: coordinates,
      description,
      tags: Array.isArray(tags) ? tags : [],
      owner_id: formatAsUUID(req.user.id),
      audit_trail: [{
        action: 'create',
        user_id: formatAsUUID(req.user.id),
        timestamp: new Date().toISOString()
      }]
    });
    
    // Emit socket event (handled in socket service)
    req.app.get('io').emit('disaster_updated', { 
      action: 'create',
      disaster: {
        id: disaster.id,
        title: disaster.title,
        location_name: disaster.location_name
      }
    });
    
    console.log(`Disaster created: ${title} at ${locationNameToUse}`);
    res.status(201).json(disaster);
  } catch (error) {
    console.error('Error creating disaster:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
};

// Get all disasters with optional filtering
export const getDisasters = async (req, res) => {
  try {
    const { tag, location, radius } = req.query;
    let whereClause = {};
    
    // Filter by tag if provided - using ILIKE for partial matches with any tag
    if (tag && tag.trim() !== '') {
      // Sanitize the tag input to prevent SQL injection
      const sanitizedTag = tag.replace(/[%_'"\\\x00-\x1F\x7F]/g, '').trim().toLowerCase();
      
      // Use a safer parametrized query pattern to avoid SQL injection issues
      whereClause = {
        [Op.and]: [
          sequelize.literal(`EXISTS (SELECT 1 FROM unnest(tags) AS t WHERE LOWER(t) LIKE '%${sanitizedTag}%')`)
        ]
      };
    }
    
    // Filter by location radius if provided
    if (location && radius) {
      const [lng, lat] = location.split(',').map(Number);
      const radiusInMeters = parseFloat(radius) * 1000; // Convert km to meters
      
      // Use Sequelize's raw query for geospatial filtering
      const disasters = await Disaster.findAll({
        where: sequelize.literal(
          `ST_DWithin(location, ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326), ${radiusInMeters})`
        )
      });
      
      return res.json(disasters);
    }
    
    // Regular query without geospatial filtering
    const disasters = await Disaster.findAll({ where: whereClause });
    res.json(disasters);
  } catch (error) {
    console.error('Error fetching disasters:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get a specific disaster by ID
export const getDisasterById = async (req, res) => {
  try {
    const disaster = await Disaster.findByPk(req.params.id);
    
    if (!disaster) {
      return res.status(404).json({ error: 'Disaster not found' });
    }
    
    res.json(disaster);
  } catch (error) {
    console.error('Error fetching disaster:', error);
    res.status(500).json({ error: error.message });
  }
};

// Update a disaster
export const updateDisaster = async (req, res) => {
  try {
    const { title, location_name, description, tags } = req.body;
    
    // Find the disaster first
    const disaster = await Disaster.findByPk(req.params.id);
    
    if (!disaster) {
      return res.status(404).json({ error: 'Disaster not found' });
    }
    
    // Check if location has changed and needs geocoding
    let coordinates = null;
    if (location_name && location_name !== disaster.location_name) {
      try {
        const geocodedLocation = await geocodeLocation(location_name);
        coordinates = { 
          type: 'Point', 
          coordinates: [geocodedLocation.longitude, geocodedLocation.latitude]
        };
      } catch (error) {
        return res.status(400).json({ error: `Geocoding failed: ${error.message}` });
      }
    }
    
    // Prepare update data
    const updateData = {};
    if (title) updateData.title = title;
    if (location_name) updateData.location_name = location_name;
    if (coordinates) updateData.location = coordinates;
    if (description) updateData.description = description;
    if (tags) updateData.tags = tags;    // Update the audit trail
    const currentAuditTrail = disaster.audit_trail || [];
    updateData.audit_trail = [
      ...currentAuditTrail,
      {
        action: 'update',
        user_id: formatAsUUID(req.user.id),
        timestamp: new Date().toISOString()
      }
    ];
    
    // Update the disaster
    await disaster.update(updateData);
    
    // Emit socket event
    req.app.get('io').emit('disaster_updated', { 
      action: 'update',
      disaster: {
        id: disaster.id,
        title: disaster.title,
        location_name: disaster.location_name
      }
    });
    
    console.log(`Disaster updated: ${disaster.id}`);
    res.json(disaster);
  } catch (error) {
    console.error('Error updating disaster:', error);
    res.status(500).json({ error: error.message });
  }
};

// Delete a disaster
export const deleteDisaster = async (req, res) => {
  try {
    const disaster = await Disaster.findByPk(req.params.id);
    
    if (!disaster) {
      return res.status(404).json({ error: 'Disaster not found' });
    }
    
    const disasterInfo = {
      id: disaster.id,
      title: disaster.title,
      location_name: disaster.location_name
    };
    
    await disaster.destroy();
    
    // Emit socket event
    req.app.get('io').emit('disaster_updated', { 
      action: 'delete',
      disaster: disasterInfo
    });
    
    console.log(`Disaster deleted: ${disaster.id}`);
    res.json({ message: 'Disaster deleted successfully' });
  } catch (error) {
    console.error('Error deleting disaster:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get social media posts for a disaster
export const getSocialMediaPosts = async (req, res) => {
  try {
    const disasterId = req.params.id;
    const disaster = await Disaster.findByPk(disasterId);
    
    if (!disaster) {
      return res.status(404).json({ error: 'Disaster not found' });
    }
    
    // Get mock social media posts
    const posts = await getMockSocialMediaPosts(disasterId, disaster);
    
    // Emit socket event with the high priority posts
    const highPriorityPosts = posts.filter(post => post.priority === 'high');
    if (highPriorityPosts.length > 0) {
      req.app.get('io').emit('social_media_updated', { 
        disasterId,
        priorityPosts: highPriorityPosts
      });
    }
    
    res.json(posts);
  } catch (error) {
    console.error('Error fetching social media posts:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get official updates for a disaster
export const getOfficialDisasterUpdates = async (req, res) => {
  try {
    const disasterId = req.params.id;
    const disaster = await Disaster.findByPk(disasterId);
    
    if (!disaster) {
      return res.status(404).json({ error: 'Disaster not found' });
    }
    
    // Get official updates
    const updates = await getOfficialUpdates(disasterId, disaster);
    
    res.json(updates);
  } catch (error) {
    console.error('Error fetching official updates:', error);
    res.status(500).json({ error: error.message });
  }
};

// Verify disaster image
export const verifyDisasterImage = async (req, res) => {
  try {
    const { image_url } = req.body;
    const disasterId = req.params.id;
    
    if (!image_url) {
      return res.status(400).json({ error: 'Image URL is required' });
    }
    
    const disaster = await Disaster.findByPk(disasterId);
    if (!disaster) {
      return res.status(404).json({ error: 'Disaster not found' });
    }
    
    // Verify the image
    const verificationResult = await verifyImage(image_url, disaster.description);
    
    // Update report if provided
    if (req.body.report_id) {
      await Report.update(
        { verification_status: verificationResult.verification },
        { where: { id: req.body.report_id } }
      );
    }
    
    res.json(verificationResult);
  } catch (error) {
    console.error('Error verifying image:', error);
    res.status(500).json({ error: error.message });
  }
};

// Extract location and geocode
export const geocodeRequest = async (req, res) => {
  try {
    const { text } = req.body;
    
    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }
    
    console.log('Attempting to extract location from text:', text.substring(0, 50) + '...');
    
    try {
      // Extract location from text
      const result = await extractLocationFromText(text);
      const { location } = result;
      
      if (location === 'Unknown location') {
        return res.status(400).json({ error: 'Could not extract location from text' });
      }
      
      console.log('Successfully extracted location:', location);
      
      // Geocode the location
      const coordinates = await geocodeLocation(location);
      
      res.json({
        location_name: location,
        coordinates
      });
    } catch (extractError) {
      console.error('Location extraction error:', extractError);
      return res.status(400).json({ error: 'Failed to extract location from text. Please provide a location name directly.' });
    }
  } catch (error) {
    console.error('Error in geocode request:', error);
    res.status(500).json({ error: 'Server error occurred while processing your request.' });
  }
};