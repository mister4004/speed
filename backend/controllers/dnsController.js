import NodeCache from 'node-cache';
import NetworkUtils from '../utils/networkUtils.js';
import logger from '../utils/logger.js';
import config from '../config/config.js';

const cache = new NodeCache({
  stdTTL: config.cache.ttl,
  checkperiod: config.cache.checkperiod,
});

/**
 * @swagger
 * /api/v1/dns/lookup:
 * post:
 * summary: Perform DNS lookup
 * tags: [DNS]
 * requestBody:
 * required: true
 * content:
 * application/json:
 * schema:
 * type: object
 * properties:
 * host:
 * type: string
 * example: 'google.com'
 * type:
 * type: string
 * enum: [A, AAAA, MX, TXT, NS, CNAME, PTR]
 * example: 'A'
 * responses:
 * '200':
 * description: DNS lookup result
 * content:
 * application/json:
 * schema:
 * type: object
 * properties:
 * host:
 * type: string
 * type:
 * type: string
 * records:
 * type: array
 * items:
 * type: string
 * cached:
 * type: boolean
 * timestamp:
 * type: string
 * format: date-time
 * '400':
 * description: Invalid input
 * '500':
 * description: Server error
 */
const dnsLookup = async (req, res, next) => {
  const { host, type = 'A' } = req.body;

  try {
    const cacheKey = `dnsLookup_${host}_${type}`;
    let result = cache.get(cacheKey);

    if (result) {
      logger.info(`DNS lookup for ${host} (${type}) served from cache.`);
      return res.json({ ...result, cached: true });
    }

    result = await NetworkUtils.dnsLookup(host, type);
    result.timestamp = new Date().toISOString();
    cache.set(cacheKey, result);

    res.json({ ...result, cached: false });
  } catch (error) {
    logger.error(`Error in dnsLookup for ${host}:`, error);
    next(error);
  }
};

/**
 * @swagger
 * /api/v1/dns/servers:
 * get:
 * summary: Get system DNS servers
 * tags: [DNS]
 * responses:
 * '200':
 * description: List of DNS servers
 * content:
 * application/json:
 * schema:
 * type: object
 * properties:
 * servers:
 * type: array
 * items:
 * type: string
 * cached:
 * type: boolean
 * timestamp:
 * type: string
 * '500':
 * description: Server error
 */
const getDNSServers = async (req, res, next) => {
  try {
    const cacheKey = 'dnsServers';
    let result = cache.get(cacheKey);

    if (result) {
      logger.info('DNS servers served from cache.');
      return res.json({ ...result, cached: true });
    }

    result = await NetworkUtils.getDNSServers();
    result.timestamp = new Date().toISOString();
    cache.set(cacheKey, result);

    res.json({ ...result, cached: false });
  } catch (error) {
    logger.error('Error in getDNSServers:', error);
    next(error);
  }
};

/**
 * @swagger
 * /api/v1/dns/doh:
 * post:
 * summary: Check DNS over HTTPS support
 * tags: [DNS]
 * requestBody:
 * required: true
 * content:
 * application/json:
 * schema:
 * type: object
 * properties:
 * host:
 * type: string
 * responses:
 * '200':
 * description: DoH check result
 * content:
 * application/json:
 * schema:
 * type: object
 * properties:
 * host:
 * type: string
 * dohSupported:
 * type: boolean
 * responseTime:
 * type: number
 * cached:
 * type: boolean
 * timestamp:
 * type: string
 * '400':
 * description: Invalid input
 * '500':
 * description: Server error
 */
const checkDoH = async (req, res, next) => {
  const { host } = req.body;

  try {
    const cacheKey = `doh_${host}`;
    let result = cache.get(cacheKey);

    if (result) {
      logger.info(`DoH check for ${host} served from cache.`);
      return res.json({ ...result, cached: true });
    }

    const startTime = performance.now();
    const response = await fetch(`https://dns.google/resolve?name=${host}&type=A`, {
      method: 'GET',
      headers: { 'Accept': 'application/dns-json' },
    });
    const endTime = performance.now();

    if (!response.ok) {
      const errorText = await response.text();
      logger.error(`Error from dns.google for ${host} (${type}): ${response.status} - ${errorText}`);
      throw new Error(`Failed to fetch from dns.google: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    result = {
      host,
      dohSupported: data.Status === 0,
      responseTime: (endTime - startTime).toFixed(2),
      timestamp: new Date().toISOString(),
    };
    cache.set(cacheKey, result);

    res.json({ ...result, cached: false });
  } catch (error) {
    logger.error(`Error in checkDoH for ${host}:`, error);
    next(error);
  }
};

/**
 * @swagger
 * /api/v1/dns/client-lookup-proxy:
 * get:
 * summary: Perform DNS lookup via server proxy for client-side tests
 * tags: [DNS]
 * parameters:
 * - in: query
 * name: host
 * schema:
 * type: string
 * required: true
 * description: The host to lookup
 * - in: query
 * name: type
 * schema:
 * type: string
 * enum: [A, AAAA, MX, TXT, NS, CNAME, PTR]
 * required: true
 * description: The DNS record type
 * responses:
 * '200':
 * description: Proxied DNS lookup result from dns.google
 * content:
 * application/json:
 * schema:
 * type: object
 * description: Raw response from dns.google/resolve
 * '400':
 * description: Invalid input
 * '500':
 * description: Server error or upstream API error
 */
const clientDnsLookupProxy = async (req, res, next) => {
  const { host, type } = req.query; // Получаем параметры из query

  if (!host || !type) {
    return res.status(400).json({ error: 'Host and type are required query parameters.' });
  }

  try {
    logger.info(`Proxying client DNS lookup for host: ${host}, type: ${type}`);
    const response = await fetch(`https://dns.google/resolve?name=${encodeURIComponent(host)}&type=${type}`);

    if (!response.ok) {
      const errorText = await response.text();
      logger.error(`Error from dns.google for ${host} (${type}): ${response.status} - ${errorText}`);
      throw new Error(`Failed to fetch from dns.google: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    res.status(200).json(data);
  } catch (error) {
    logger.error(`Error in clientDnsLookupProxy for ${host}:`, error);
    next(error); // Передаем ошибку в центральный обработчик ошибок
  }
};


export default { dnsLookup, getDNSServers, checkDoH, clientDnsLookupProxy };
