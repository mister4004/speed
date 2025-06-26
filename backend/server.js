import express from 'express';
import cors from 'cors';
import compression from 'compression';
import morgan from 'morgan';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import swaggerUi from 'swagger-ui-express';
import swaggerJSDoc from 'swagger-jsdoc';
import NodeCache from 'node-cache';
import { validationResult } from 'express-validator';
import { helmet, generalRateLimit, heavyOperationsLimit, securityLogger, websocketLimit } from './middleware/security.js';
import { validateDNS, validatePing, validateTraceroute, validatePorts, validateWhois, validateDoH } from './utils/validators.js';
import DnsController from './controllers/dnsController.js';
import PingController from './controllers/pingController.js';
import TracerouteController from './controllers/tracerouteController.js';
import PortsController from './controllers/portsController.js';
import WhoisController from './controllers/whoisController.js';
import VpnController from './controllers/vpnController.js';
import ExportController from './controllers/exportController.js';
import config from './config/config.js';
import logger from './utils/logger.js';

// Добавлен импорт
import infoRouter from './routes/infoRoutes.js';

const app = express();
const httpServer = createServer(app);
const cache = new NodeCache(config.cache);

const DOWNLOAD_FILE_SIZE_MB = 50;
const DOWNLOAD_BUFFER = Buffer.alloc(
  DOWNLOAD_FILE_SIZE_MB * 1024 * 1024,
  '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map(c => c.charCodeAt(0))
);

const SpeedTestController = {
  downloadTest: (req, res) => {
    logger.info(`Download test initiated from IP: ${req.ip}`);
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Length', DOWNLOAD_BUFFER.length);
    res.setHeader('Content-Disposition', 'attachment; filename="testfile.bin"');
    res.send(DOWNLOAD_BUFFER);
  },
  uploadTest: (req, res) => {
    let receivedSize = 0;
    req.on('data', (chunk) => {
      receivedSize += chunk.length;
    });
    req.on('end', () => {
      logger.info(`Upload test completed from IP: ${req.ip}, size: ${receivedSize} bytes`);
      res.status(200).json({ message: 'Upload received', size: receivedSize });
    });
  },
};

const swaggerOptions = {
  definition: (await import('./docs/swagger.js')).default,
  apis: ['./controllers/*.js'],
};
const swaggerSpec = swaggerJSDoc(swaggerOptions);

app.set('trust proxy', 1);
app.use(helmet());
app.use(compression());
app.use(cors({
  origin: ['https://cloud-hosts.org', 'https://www.cloud-hosts.org', 'http://localhost:3000'],
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));
app.use(generalRateLimit);
app.use(securityLogger);

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    logger.warn(`Validation errors for IP: ${req.ip}`, errors.array());
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

const wss = new WebSocketServer({ server: httpServer });
websocketLimit(wss);

wss.on('connection', (ws, req) => {
  logger.info(`WebSocket connected from IP: ${req.socket.remoteAddress}`);
  ws.on('message', async (message) => {
    try {
      const { host, maxHops } = JSON.parse(message);
      if (!host || !maxHops) {
        ws.send(JSON.stringify({ error: 'Host and maxHops are required' }));
        return;
      }
      await TracerouteController.runTracerouteStream(ws, { body: { host, maxHops } });
    } catch (err) {
      ws.send(JSON.stringify({ error: err.message }));
    }
  });
  ws.on('close', () => {
    logger.info(`WebSocket disconnected from IP: ${req.socket.remoteAddress}`);
  });
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

app.get('/api/v1/dns/servers', DnsController.getDNSServers);
app.post('/api/v1/dns/lookup', validateDNS, validate, DnsController.dnsLookup);
app.post('/api/v1/dns/doh', validateDoH, validate, DnsController.checkDoH);
app.post('/api/v1/ping', heavyOperationsLimit, validatePing, validate, PingController.runPing);
app.post('/api/v1/traceroute', heavyOperationsLimit, validateTraceroute, validate, TracerouteController.runTraceroute);
app.get('/api/v1/speedtest/download', heavyOperationsLimit, SpeedTestController.downloadTest);
app.post('/api/v1/speedtest/upload', heavyOperationsLimit, SpeedTestController.uploadTest);
app.post('/api/v1/ports/scan', heavyOperationsLimit, validatePorts, validate, PortsController.scanPorts);
app.post('/api/v1/whois', validateWhois, validate, WhoisController.getWhois);
app.get('/api/v1/info/vpn', VpnController.checkVpnProxy);
app.post('/api/v1/export', ExportController.exportResults);

// Добавлен новый роут
app.use('/api/v1/info', infoRouter);

app.use('/api/v1/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use((err, req, res, next) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong',
  });
});

app.use((req, res) => {
  res.status(404).json({
    error: 'Not found',
    message: 'API endpoint not found',
  });
});

httpServer.listen(config.port, config.host, () => {
  logger.info(`Server running on ${config.host}:${config.port}`);
  console.log(`🚀 Server running on ${config.host}:${config.port}`);
});

process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  httpServer.close(() => {
    logger.info('Process terminated');
    process.exit(0);
  });
});

export default app;
