import jwt from 'jsonwebtoken';
import { formatAsUUID } from '../utils/uuidHelper.js';

// Authenticate JWT token
export const authenticate = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ message: 'Authentication failed: No token provided' });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Format the user ID as UUID if necessary
    if (decoded.id) {
      decoded.id = formatAsUUID(decoded.id);
    }
    
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Authentication failed: Invalid token' });
  }
};

// Check if user has admin role
export const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Access denied: Admin role required' });
  }
};

// Check if user is admin or the resource owner
export const isAdminOrOwner = (ownerId) => {
  return (req, res, next) => {
    if (req.user && (req.user.role === 'admin' || req.user.id === formatAsUUID(ownerId))) {
      next();
    } else {
      res.status(403).json({ message: 'Access denied: Insufficient permissions' });
    }
  };
};