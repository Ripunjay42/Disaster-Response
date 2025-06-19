import express from 'express';
import * as reportController from '../controllers/reportController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.get('/disaster/:id', reportController.getReportsForDisaster); // Get reports for a disaster

// Protected routes
router.post('/', authenticate, reportController.createReport); // Create new report
router.put('/:id', authenticate, reportController.updateReport); // Update report (if owner or admin)
router.delete('/:id', authenticate, reportController.deleteReport); // Delete report (if owner or admin)

export default router;