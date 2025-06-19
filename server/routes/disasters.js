import express from 'express';
import * as disasterController from '../controllers/disasterController.js';
import { authenticate, isAdmin } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.get('/', disasterController.getDisasters); // List all disasters with optional filtering
router.get('/:id', disasterController.getDisasterById); // Get specific disaster

// Protected routes
router.post('/', authenticate, disasterController.createDisaster); // Create new disaster
router.put('/:id', authenticate, disasterController.updateDisaster); // Update disaster
router.delete('/:id', authenticate, isAdmin, disasterController.deleteDisaster); // Delete disaster (admin only)

// Social media and official updates
router.get('/:id/social-media', disasterController.getSocialMediaPosts);
router.get('/:id/official-updates', disasterController.getOfficialDisasterUpdates);

// Image verification
router.post('/:id/verify-image', authenticate, disasterController.verifyDisasterImage);

// Geocoding
router.post('/geocode', authenticate, disasterController.geocodeRequest);

export default router;