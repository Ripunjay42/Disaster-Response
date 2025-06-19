// Simple structured logger

// Log levels
const LOG_LEVELS = {
  ERROR: 'ERROR',
  WARN: 'WARN',
  INFO: 'INFO',
  DEBUG: 'DEBUG'
};

// Log entry formatter
const formatLogEntry = (level, message, data = {}) => {
  const timestamp = new Date().toISOString();
  const logData = {
    timestamp,
    level,
    message,
    ...data
  };
  
  return JSON.stringify(logData);
};

// Log to console
const logToConsole = (formattedEntry, level) => {
  switch (level) {
    case LOG_LEVELS.ERROR:
      console.error(formattedEntry);
      break;
    case LOG_LEVELS.WARN:
      console.warn(formattedEntry);
      break;
    case LOG_LEVELS.DEBUG:
      console.debug(formattedEntry);
      break;
    case LOG_LEVELS.INFO:
    default:
      console.log(formattedEntry);
  }
};

// Logger methods
export const logger = {
  error: (message, data = {}) => {
    const entry = formatLogEntry(LOG_LEVELS.ERROR, message, data);
    logToConsole(entry, LOG_LEVELS.ERROR);
  },
  
  warn: (message, data = {}) => {
    const entry = formatLogEntry(LOG_LEVELS.WARN, message, data);
    logToConsole(entry, LOG_LEVELS.WARN);
  },
  
  info: (message, data = {}) => {
    const entry = formatLogEntry(LOG_LEVELS.INFO, message, data);
    logToConsole(entry, LOG_LEVELS.INFO);
  },
  
  debug: (message, data = {}) => {
    const entry = formatLogEntry(LOG_LEVELS.DEBUG, message, data);
    logToConsole(entry, LOG_LEVELS.DEBUG);
  },
  
  // Special structured log methods for specific actions
  disasterCreated: (disasterId, title, location) => {
    logger.info('Disaster created', { disasterId, title, location, action: 'disaster_create' });
  },
  
  resourceMapped: (resourceId, name, type, location) => {
    logger.info('Resource mapped', { resourceId, name, type, location, action: 'resource_map' });
  },
  
  reportProcessed: (reportId, disasterId, status) => {
    logger.info('Report processed', { reportId, disasterId, status, action: 'report_process' });
  },
  
  imageVerified: (imageUrl, status, score) => {
    logger.info('Image verified', { 
      imageUrl: imageUrl.substring(0, 100), // Truncate long URLs
      status, 
      score, 
      action: 'image_verify' 
    });
  },
  
  apiRequest: (endpoint, method, status) => {
    logger.debug('API request', { endpoint, method, status, action: 'api_request' });
  },
  
  externalApiCall: (service, endpoint, status) => {
    logger.debug('External API call', { service, endpoint, status, action: 'external_api' });
  },
  
  cacheHit: (key) => {
    logger.debug('Cache hit', { key, action: 'cache_hit' });
  },
  
  cacheMiss: (key) => {
    logger.debug('Cache miss', { key, action: 'cache_miss' });
  }
};