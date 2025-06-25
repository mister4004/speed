import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import logger from '../utils/logger.js';
import config from '../config/config.js';

/**
 * Creates a rate limiter with specified window and max requests.
 * @param {number} [windowMs=config.rateLimit.windowMs] - Window in milliseconds
 * @param {number} [max=config.rateLimit.max] - Max requests per window
 * @returns {import('express-rate-limit').RateLimit} - Rate limit middleware
 */
const createRateLimit = (windowMs = config.rateLimit.windowMs, max = config.rateLimit.max) => {
  return rateLimit({
    windowMs,
    max,
    message: {
      error: 'Too many requests',
      retryAfter: Math.ceil(windowMs / 1000),
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      logger.warn(`Rate limit exceeded for IP: ${req.ip}`, {
        url: req.url,
        method: req.method,
        body: req.body,
        query: req.query,
        userAgent: req.get('User-Agent'),
      });
      res.status(429).json({
        error: 'Too many requests',
        retryAfter: Math.ceil(windowMs / 1000),
      });
    },
  });
};

/**
 * Rate limiter for general requests.
 */
const generalRateLimit = createRateLimit();

/**
 * Rate limiter for heavy operations (ping, traceroute, speedtest, ports scan).
 */
const heavyOperationsLimit = createRateLimit(config.heavyRateLimit.windowMs, config.heavyRateLimit.max);

/**
 * Middleware to detect suspicious requests.
 * @param {import('express').Request} req - Express request object
 * @param {import('express').Response} res - Express response object
 * @param {import('express').NextFunction} next - Express next function
 */
const securityLogger = (req, res, next) => {
  const suspiciousPatterns = [
    /\.\./, // Path traversal
    /<script/i, // XSS attempts
    /union.*select/i, // SQL injection
    /\|\|/, // Command injection
    /&&/, // Command injection
  ];

  const requestData = JSON.stringify({
    body: req.body,
    query: req.query,
    params: req.params,
    url: req.originalUrl,
  });

  if (suspiciousPatterns.some((pattern) => pattern.test(requestData))) {
    logger.warn(`Suspicious request detected from IP: ${req.ip}`, {
      url: req.url,
      method: req.method,
      body: req.body,
      query: req.query,
      userAgent: req.get('User-Agent'),
    });
  }

  // Проверка на слишком длинные запросы
  if (requestData.length > 10000) {
    logger.warn(`Oversized request detected from IP: ${req.ip}`, {
      url: req.url,
      method: req.method,
      size: requestData.length,
    });
    return res.status(413).json({ error: 'Request entity too large' });
  }

  next();
};

/**
 * Middleware to limit WebSocket connections.
 * @param {import('ws').Server} wss - WebSocket server
 */
const websocketLimit = (wss) => {
  wss.on('connection', (ws, req) => {
    if (wss.clients.size > config.websocket.maxConnections) {
      logger.warn(`WebSocket connection limit exceeded from IP: ${req.socket.remoteAddress}`);
      ws.close(1008, 'Too many connections');
    }
  });
};

export { helmet, generalRateLimit, heavyOperationsLimit, securityLogger, websocketLimit };
