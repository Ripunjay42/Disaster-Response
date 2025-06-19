import { Resource, Disaster } from '../models/index.js';
import { geocodeLocation } from '../services/geocodingService.js';
import { sequelize } from '../models/index.js';

// Create a new resource
export const createResource = async (req, res) => {
  try {
    const { disaster_id, name, location_name, type } = req.body;
    
    // Validate input
    if (!disaster_id || !name || !location_name || !type) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Check if disaster exists
    const disaster = await Disaster.findByPk(disaster_id);
    if (!disaster) {
      return res.status(404).json({ error: 'Disaster not found' });
    }
    
    // Geocode the location
    let coordinates = null;
    try {
      const geocodedLocation = await geocodeLocation(location_name);
      coordinates = { 
        type: 'Point', 
        coordinates: [geocodedLocation.longitude, geocodedLocation.latitude]
      };
    } catch (error) {
      return res.status(400).json({ error: `Geocoding failed: ${error.message}` });
    }
    
    // Create the resource
    const resource = await Resource.create({
      disaster_id,
      name,
      location_name,
      location: coordinates,
      type
    });
    
    // Emit socket event
    req.app.get('io').emit('resources_updated', { 
      action: 'create',
      disaster_id,
      resource: {
        id: resource.id,
        name: resource.name,
        type: resource.type,
        location_name: resource.location_name
      }
    });
    
    console.log(`Resource created: ${name} at ${location_name}`);
    res.status(201).json(resource);
  } catch (error) {
    console.error('Error creating resource:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get all resources for a disaster
export const getResourcesForDisaster = async (req, res) => {
  try {
    const { id } = req.params;
    const { lat, lon, radius = 10 } = req.query; // radius in km, default 10km
    
    // Check if disaster exists
    const disaster = await Disaster.findByPk(id);
    if (!disaster) {
      return res.status(404).json({ error: 'Disaster not found' });
    }
    
    // If lat and lon are provided, find resources within radius
    if (lat && lon) {
      const radiusInMeters = parseFloat(radius) * 1000; // Convert km to meters
      
      const resources = await Resource.findAll({
        where: {
          disaster_id: id,
          ...sequelize.literal(
            `ST_DWithin(location, ST_SetSRID(ST_MakePoint(${lon}, ${lat}), 4326), ${radiusInMeters})`
          )
        }
      });
      
      return res.json(resources);
    }
    
    // If no coordinates provided, return all resources for the disaster
    const resources = await Resource.findAll({
      where: { disaster_id: id }
    });
    
    res.json(resources);
  } catch (error) {
    console.error('Error fetching resources:', error);
    res.status(500).json({ error: error.message });
  }
};

// Update a resource
export const updateResource = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, location_name, type } = req.body;
    
    // Find the resource
    const resource = await Resource.findByPk(id);
    if (!resource) {
      return res.status(404).json({ error: 'Resource not found' });
    }
    
    // Check if location has changed and needs geocoding
    let coordinates = null;
    if (location_name && location_name !== resource.location_name) {
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
    if (name) updateData.name = name;
    if (location_name) updateData.location_name = location_name;
    if (coordinates) updateData.location = coordinates;
    if (type) updateData.type = type;
    
    // Update the resource
    await resource.update(updateData);
    
    // Emit socket event
    req.app.get('io').emit('resources_updated', { 
      action: 'update',
      disaster_id: resource.disaster_id,
      resource: {
        id: resource.id,
        name: resource.name,
        type: resource.type,
        location_name: resource.location_name
      }
    });
    
    console.log(`Resource updated: ${resource.id}`);
    res.json(resource);
  } catch (error) {
    console.error('Error updating resource:', error);
    res.status(500).json({ error: error.message });
  }
};

// Delete a resource
export const deleteResource = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Find the resource
    const resource = await Resource.findByPk(id);
    if (!resource) {
      return res.status(404).json({ error: 'Resource not found' });
    }
    
    const resourceInfo = {
      id: resource.id,
      name: resource.name,
      type: resource.type,
      location_name: resource.location_name,
      disaster_id: resource.disaster_id
    };
    
    // Delete the resource
    await resource.destroy();
    
    // Emit socket event
    req.app.get('io').emit('resources_updated', { 
      action: 'delete',
      disaster_id: resourceInfo.disaster_id,
      resource: resourceInfo
    });
    
    console.log(`Resource deleted: ${id}`);
    res.json({ message: 'Resource deleted successfully' });
  } catch (error) {
    console.error('Error deleting resource:', error);
    res.status(500).json({ error: error.message });
  }
};