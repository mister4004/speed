import whois from 'whois';
import NodeCache from 'node-cache';
import logger from '../utils/logger.js';
import config from '../config/config.js';
import { promisify } from 'util';

const whoisLookup = promisify(whois.lookup);
const cache = new NodeCache({
  stdTTL: config.cache.ttl,
  checkperiod: config.cache.checkperiod,
});

/**
 * @swagger
 * /api/v1/whois:
 *   post:
 *     summary: Perform WHOIS lookup
 *     tags: [WHOIS]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               host:
 *                 type: string
 *     responses:
 *       200:
 *         description: WHOIS lookup result
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 host:
 *                   type: string
 *                 data:
 *                   type: object
 *                 cached:
 *                   type: boolean
 *                 timestamp:
 *                   type: string
 *       400:
 *         description: Invalid input
 *       500:
 *         description: Server error
 */
const getWhois = async (req, res, next) => {
  const { host } = req.body;

  try {
    const cacheKey = `whois_${host}`;
    let result = cache.get(cacheKey);

    if (result) {
      logger.info(`WHOIS lookup for ${host} served from cache.`);
      return res.json({ ...result, cached: true });
    }

    const data = await whoisLookup(host);
    result = { host, data, timestamp: new Date().toISOString() };
    cache.set(cacheKey, result);

    res.json({ ...result, cached: false });
  } catch (error) {
    logger.error(`Error in getWhois for ${host}:`, error);
    next(error);
  }
};

export default { getWhois };
