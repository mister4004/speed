import { Router } from 'express';
import { validationResult } from 'express-validator';
import dns from 'dns';

// Импорт контроллеров
import DnsController from '../controllers/dnsController.js';
import { saveClientInfo } from '../controllers/clientInfoController.js';
import PingController from '../controllers/pingController.js';
import TracerouteController from '../controllers/tracerouteController.js';
import PortsController from '../controllers/portsController.js';
import WhoisController from '../controllers/whoisController.js';
import VpnController from '../controllers/vpnController.js';
import ExportController from '../controllers/exportController.js';
import { lookupMacVendor } from '../controllers/macController.js';

// Импорт валидаторов
import {
    validateDNS,
    validatePing,
    validateTraceroute,
    validatePorts,
    validateWhois,
    validateDoH,
    validateMacAddress,
    validateClientInfo,
    cleanDomain // Добавлена функция очистки
} from '../utils/validators.js';

// Импорт мидлваров
import { heavyOperationsLimit } from '../middleware/security.js';
import logger from '../utils/logger.js';

// Импорт под-роутеров
import infoRouter from './infoRoutes.js';
import speedtestRouter from './speedtestRoutes.js';

const router = Router();

// Middleware для валидации
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    logger.warn(`Validation errors for IP: ${req.ip}`, errors.array());
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// --- Роуты ---

router.post('/save-client-info', validateClientInfo, validate, saveClientInfo);

router.get('/dns/servers', DnsController.getDNSServers);
router.post('/dns/lookup', validateDNS, validate, DnsController.dnsLookup);
router.post('/dns/doh', validateDoH, validate, DnsController.checkDoH);

router.get('/dns/client-lookup-proxy', (req, res) => {
  let host = req.query.host;
  const type = req.query.type || 'A';

  if (!host) {
    logger.warn(`No host provided for client DNS lookup from IP: ${req.ip}`);
    return res.status(400).json({ error: 'Host parameter is required' });
  }

  // Очистка домена от протокола, пути и порта
  host = cleanDomain(host);
  
  // Дополнительная проверка после очистки
  if (!host) {
    logger.warn(`Host is empty after cleaning from IP: ${req.ip}`);
    return res.status(400).json({ error: 'Invalid host format after cleaning' });
  }

  dns.resolve(host, type, (err, records) => {
    if (err) {
      logger.error(`DNS resolution error for ${host} from IP: ${req.ip}`, { 
        error: err.message,
        originalHost: req.query.host,
        cleanedHost: host
      });
      return res.status(500).json({ 
        error: 'DNS resolution failed',
        details: err.message,
        original: req.query.host,
        cleaned: host
      });
    }
    
    logger.info(`DNS lookup successful for ${host} from IP: ${req.ip}`, { 
      original: req.query.host,
      cleaned: host,
      records: records || 'No records' 
    });
    
    const response = {
      Question: [{ name: host, type }],
      Answer: records ? records.map(record => ({ data: record })) : [],
    };
    res.json(response);
  });
});

router.post('/ping', heavyOperationsLimit, validatePing, validate, PingController.runPing);
router.post('/traceroute', heavyOperationsLimit, validateTraceroute, validate, TracerouteController.runTraceroute);
router.post('/ports/scan', heavyOperationsLimit, validatePorts, validate, PortsController.scanPorts);
router.post('/whois', validateWhois, validate, WhoisController.getWhois);
router.get('/info/vpn', VpnController.checkVpnProxy);
router.post('/export', ExportController.exportResults);

// Роут для MAC lookup
router.post('/mac-lookup', validateMacAddress, validate, lookupMacVendor);

// Подключаем под-роутеры
router.use('/info', infoRouter);
router.use('/speedtest', speedtestRouter);

export default router;
