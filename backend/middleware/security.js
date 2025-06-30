import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import logger from '../utils/logger.js';
import config from '../config/config.js';

// Улучшенный лимитер с поддержкой разных типов
const createRateLimit = (options) => {
  return rateLimit({
    windowMs: options.windowMs,
    max: options.max,
    message: {
      error: options.message,
      retryAfter: Math.ceil(options.windowMs / 1000),
    },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => {
      // Пропускаем preflight-запросы
      return req.method === 'OPTIONS';
    },
    handler: (req, res) => {
      logger.warn(`[${options.type || 'GENERAL'}] Rate limit exceeded for IP: ${req.ip}`);
      res.status(429).json({
        error: options.message,
        retryAfter: Math.ceil(options.windowMs / 1000),
      });
    },
  });
};

// Лимитеры
const generalRateLimit = createRateLimit({
  ...config.rateLimit,
  type: 'GENERAL'
});

const heavyOperationsLimit = createRateLimit({
  ...config.heavyRateLimit,
  type: 'HEAVY_OPERATION'
});

const speedtestLimit = createRateLimit({
  ...config.speedtestRateLimit,
  type: 'SPEEDTEST'
});

// securityLogger (ОПРЕДЕЛЕНИЕ ДОБАВЛЕНО)
// Это базовый middleware. Вы можете добавить сюда вашу логику логгирования или безопасности.
const securityLogger = (req, res, next) => {
  // Пример: logger.info(`[SECURITY] Request received from IP: ${req.ip} to ${req.originalUrl}`);
  next(); // Обязательно вызвать next(), чтобы передать управление следующему middleware
};

// websocketLimit (ОПРЕДЕЛЕНИЕ ДОБАВЛЕНО)
// Это функция для настройки WebSocketServer. Ваша логика лимитирования будет здесь.
const websocketLimit = (wss) => {
  // Пример:
  // wss.on('connection', ws => {
  //   // Ваша логика проверки лимитов для каждого нового WebSocket-соединения
  //   logger.info(`WebSocket connection attempt from ${ws._socket.remoteAddress}`);
  // });
};

export {
  helmet,
  generalRateLimit,
  heavyOperationsLimit,
  speedtestLimit,
  securityLogger,   // Теперь это определено
  websocketLimit    // И это тоже
};
