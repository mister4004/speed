import logger from '../utils/logger.js';
import { exec } from 'child_process';
import { promisify } from 'util';
import NodeCache from 'node-cache';
import config from '../config/config.js';

const execAsync = promisify(exec);
const cache = new NodeCache({
  stdTTL: config.cache.ttl,
  checkperiod: config.cache.checkperiod,
});

/**
 * @swagger
 * /api/v1/ports/scan:
 *   post:
 *     summary: Scan open ports on a host
 *     tags: [Ports]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               host:
 *                 type: string
 *               ports:
 *                 type: array
 *                 items:
 *                   type: integer
 *                   minimum: 1
 *                   maximum: 65535
 *     responses:
 *       200:
 *         description: Port scan result
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 host:
 *                   type: string
 *                 results:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       port:
 *                         type: integer
 *                       open:
 *                         type: boolean
 *                 cached:
 *                   type: boolean
 *                 timestamp:
 *                   type: string
 *       400:
 *         description: Invalid input
 *       500:
 *         description: Server error
 */
const scanPorts = async (req, res, next) => {
  const { host, ports } = req.body;

  try {
    const cacheKey = `ports_${host}_${ports.join('_')}`;
    let result = cache.get(cacheKey);

    if (result) {
      logger.info(`Port scan for ${host} served from cache.`);
      return res.json({ ...result, cached: true });
    }

    const results = [];
    for (const port of ports) {
      try {
        const { stdout } = await execAsync(`nmap -p ${port} ${host} -Pn --open`);
        const open = stdout.includes('open');
        results.push({ port, open });
      } catch (error) {
        results.push({ port, open: false, error: error.message });
      }
    }

    result = { host, results, timestamp: new Date().toISOString() };
    cache.set(cacheKey, result);

    res.json({ ...result, cached: false });
  } catch (error) {
    logger.error(`Error in scanPorts for ${host}:`, error);
    next(error);
  }
};

export default { scanPorts };
