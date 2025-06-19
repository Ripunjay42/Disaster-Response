import { Report, Disaster } from '../models/index.js';
import { verifyImage } from '../services/geminiService.js';
import { formatAsUUID } from '../utils/uuidHelper.js';

// Create a new report
export const createReport = async (req, res) => {
  try {
    const { disaster_id, content, image_url } = req.body;
    
    // Validate input
    if (!disaster_id || !content) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Check if disaster exists
    const disaster = await Disaster.findByPk(disaster_id);
    if (!disaster) {
      return res.status(404).json({ error: 'Disaster not found' });
    }    // Create the report with pending verification status
    const report = await Report.create({
      disaster_id,
      user_id: formatAsUUID(req.user.id),
      content,
      image_url: image_url || null,
      verification_status: image_url ? 'pending' : 'not_applicable'
    });
    
    // If image URL is provided, verify it in the background
    if (image_url) {
      verifyImage(image_url, disaster.description)
        .then(async (result) => {
          // Update report with verification result
          await report.update({ verification_status: result.verification });
          
          // Emit socket event
          req.app.get('io').emit('report_updated', {
            report_id: report.id,
            disaster_id,
            verification_status: result.verification,
            score: result.score
          });
        })
        .catch(error => {
          console.error('Error verifying image:', error);
        });
    }
    
    console.log(`Report created for disaster: ${disaster_id}`);
    res.status(201).json(report);
  } catch (error) {
    console.error('Error creating report:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get all reports for a disaster
export const getReportsForDisaster = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if disaster exists
    const disaster = await Disaster.findByPk(id);
    if (!disaster) {
      return res.status(404).json({ error: 'Disaster not found' });
    }
    
    // Get reports for the disaster
    const reports = await Report.findAll({
      where: { disaster_id: id },
      order: [['created_at', 'DESC']]
    });
    
    res.json(reports);
  } catch (error) {
    console.error('Error fetching reports:', error);
    res.status(500).json({ error: error.message });
  }
};

// Update a report
export const updateReport = async (req, res) => {
  try {
    const { id } = req.params;
    const { content, image_url } = req.body;
    
    // Find the report
    const report = await Report.findByPk(id);
    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }
    
    // Check if user owns the report
    if (report.user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized to update this report' });
    }
    
    // Prepare update data
    const updateData = {};
    if (content) updateData.content = content;
    
    // If image URL is updated, reset verification status
    if (image_url && image_url !== report.image_url) {
      updateData.image_url = image_url;
      updateData.verification_status = 'pending';
      
      // Get disaster for verification
      const disaster = await Disaster.findByPk(report.disaster_id);
      
      // Verify image in the background
      if (disaster) {
        verifyImage(image_url, disaster.description)
          .then(async (result) => {
            // Update report with verification result
            await report.update({ verification_status: result.verification });
            
            // Emit socket event
            req.app.get('io').emit('report_updated', {
              report_id: report.id,
              disaster_id: report.disaster_id,
              verification_status: result.verification,
              score: result.score
            });
          })
          .catch(error => {
            console.error('Error verifying image:', error);
          });
      }
    }
    
    // Update the report
    await report.update(updateData);
    
    console.log(`Report updated: ${id}`);
    res.json(report);
  } catch (error) {
    console.error('Error updating report:', error);
    res.status(500).json({ error: error.message });
  }
};

// Delete a report
export const deleteReport = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Find the report
    const report = await Report.findByPk(id);
    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }
    
    // Check if user owns the report or is an admin
    if (report.user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized to delete this report' });
    }
    
    // Delete the report
    await report.destroy();
    
    console.log(`Report deleted: ${id}`);
    res.json({ message: 'Report deleted successfully' });
  } catch (error) {
    console.error('Error deleting report:', error);
    res.status(500).json({ error: error.message });
  }
};