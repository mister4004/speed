// backend/middleware/errorHandlers.js
import logger from '../utils/logger.js';

// 404 Not Found handler
export const notFoundHandler = (req, res) => {
  res.status(404).json({
    error: 'Not found',
    message: 'API endpoint not found',
  });
};

// Global error handler
export const errorHandler = (err, req, res, next) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong',
  });
};
