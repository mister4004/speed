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
 * /api/v1/ping:
 *   post:
 *     summary: Perform ICMP ping
 *     tags: [Ping]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               host:
 *                 type: string
 *               count:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 4
 *     responses:
 *       200:
 *         description: Ping result
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 host:
 *                   type: string
 *                 packets:
 *                   type: object
 *                   properties:
 *                     transmitted:
 *                       type: integer
 *                     received:
 *                       type: integer
 *                     lossPercentage:
 *                       type: number
 *                 timing:
 *                   type: object
 *                   properties:
 *                     min:
 *                       type: number
 *                     avg:
 *                       type: number
 *                     max:
 *                       type: number
 *                     mdev:
 *                       type: number
 *                 responses:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       raw:
 *                         type: string
 *                 cached:
 *                   type: boolean
 *                 timestamp:
 *                   type: string
 *       400:
 *         description: Invalid input
 *       500:
 *         description: Server error
 */
const runPing = async (req, res, next) => {
  const { host, count = config.limits.pingCount } = req.body;

  try {
    const cacheKey = `ping_${host}_${count}`;
    let result = cache.get(cacheKey);

    if (result) {
      logger.info(`Ping to ${host} (${count}) served from cache.`);
      return res.json({ ...result, cached: true });
    }

    result = await NetworkUtils.ping(host, count);
    result.timestamp = new Date().toISOString();
    cache.set(cacheKey, result);

    res.json({ ...result, cached: false });
  } catch (error) {
    logger.error(`Error in runPing for ${host}:`, error);
    next(error);
  }
};

export default { runPing };
