import express from 'express';
import cors from 'cors';
import compression from 'compression';
import morgan from 'morgan';
import { createServer } from 'http';
import swaggerUi from 'swagger-ui-express';
import swaggerJSDoc from 'swagger-jsdoc';
import NodeCache from 'node-cache';

// Импорт мидлваров из вашей существующей директории
import {
  helmet,
  generalRateLimit,
  securityLogger,
} from './middleware/security.js';

// Импорт новых вынесенных модулей
import { disableCompressionForSpeedTest } from './middleware/speedtestMiddleware.js';
import { notFoundHandler, errorHandler } from './middleware/errorHandlers.js';
import setupWebSocket from './websocket/index.js';
import apiRoutes from './routes/apiRoutes.js';

import config from './config/config.js';
import logger from './utils/logger.js';

const app = express();
const httpServer = createServer(app);
const cache = new NodeCache(config.cache);

// Конфигурация Swagger
const swaggerOptions = {
  definition: (await import('./docs/swagger.js')).default,
  apis: ['./controllers/*.js'],
};
const swaggerSpec = swaggerJSDoc(swaggerOptions);

// Настройка Express и глобальные middleware
app.set('trust proxy', 1);
app.use(helmet());
app.use(compression());
app.use(cors({
  origin: ['https://cloud-hosts.org', 'https://www.cloud-hosts.org', 'http://localhost:3000'],
  credentials: true,
}));

// Парсеры тела запросов с увеличенными лимитами
// Сначала express.raw для бинарных данных (speedtest upload), чтобы избежать вмешательства других парсеров
app.use(express.raw({ type: 'application/octet-stream', limit: '300mb' })); // Перемещен вверх для приоритета
app.use(express.json({ limit: '300mb' }));
app.use(express.urlencoded({ extended: true, limit: '300mb' }));

app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));
app.use(generalRateLimit);
app.use(securityLogger);

// Middleware для speedtest (вынесен)
app.use(disableCompressionForSpeedTest);

// Инициализация WebSocket сервера (вынесен)
setupWebSocket(httpServer);

// Роуты API
app.get('/api/v1/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});
app.use('/api/v1', apiRoutes); // ВСЕ ваши остальные API роуты теперь подключены здесь!
app.use('/api/v1/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Обработчики ошибок (всегда в конце)
app.use(notFoundHandler);
app.use(errorHandler);

// Запуск HTTP сервера
httpServer.listen(config.port, config.host, () => {
  logger.info(`Server running on ${config.host}:${config.port}`);
  console.log(`🚀 Server running on ${config.host}:${config.port}`);
});

// Обработка сигнала завершения
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  httpServer.close(() => {
    logger.info('Process terminated');
    process.exit(0);
  });
});

export default app;
