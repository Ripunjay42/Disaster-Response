import express from 'express';
import * as authController from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Login route
router.post('/login', authController.login);

// Get user profile (protected route)
router.get('/profile', authenticate, authController.getProfile);

export default router;