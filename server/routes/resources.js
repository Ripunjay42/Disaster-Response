import express from 'express';
import * as resourceController from '../controllers/resourceController.js';
import { authenticate, isAdmin } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.get('/disaster/:id', resourceController.getResourcesForDisaster); // Get resources for a disaster

// Protected routes
router.post('/', authenticate, resourceController.createResource); // Create new resource
router.put('/:id', authenticate, resourceController.updateResource); // Update resource
router.delete('/:id', authenticate, isAdmin, resourceController.deleteResource); // Delete resource (admin only)

export default router;