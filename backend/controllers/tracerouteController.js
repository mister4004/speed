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
 * /api/v1/traceroute:
 *   post:
 *     summary: Perform traceroute
 *     tags: [Traceroute]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               host:
 *                 type: string
 *               maxHops:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 30
 *     responses:
 *       200:
 *         description: Traceroute result
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 host:
 *                   type: string
 *                 hops:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       hop:
 *                         type: integer
 *                       ip:
 *                         type: string
 *                       times:
 *                         type: array
 *                         items:
 *                           type: number
 *                 cached:
 *                   type: boolean
 *                 timestamp:
 *                   type: string
 *       400:
 *         description: Invalid input
 *       500:
 *         description: Server error
 */
const runTraceroute = async (req, res, next) => {
  const { host, maxHops = config.limits.tracerouteMaxHops } = req.body;

  try {
    const cacheKey = `traceroute_${host}_${maxHops}`;
    let result = cache.get(cacheKey);

    if (result) {
      logger.info(`Traceroute to ${host} (${maxHops} hops) served from cache.`);
      return res.json({ ...result, cached: true });
    }

    result = await NetworkUtils.traceroute(host, maxHops);
    result.timestamp = new Date().toISOString();
    cache.set(cacheKey, result);

    res.json({ ...result, cached: false });
  } catch (error) {
    logger.error(`Error in runTraceroute for ${host}:`, error);
    next(error);
  }
};

/**
 * Stream traceroute results over WebSocket
 */
const runTracerouteStream = async (ws, req) => {
  // WebSocket req.url содержит параметры запроса
  // Мы будем парсить URL, чтобы получить хост и maxHops
  const urlParams = new URLSearchParams(req.url.split('?')[1]);
  const host = urlParams.get('host');
  const maxHops = parseInt(urlParams.get('maxHops')) || config.limits.tracerouteMaxHops;

  if (!host) {
    ws.send(JSON.stringify({ error: 'Host parameter is required for traceroute stream.' }));
    ws.close();
    return;
  }

  try {
    const cacheKey = `traceroute_${host}_${maxHops}`;
    let cachedResult = cache.get(cacheKey);

    if (cachedResult) {
      logger.info(`Traceroute to ${host} (${maxHops} hops) served from cache via WebSocket.`);
      ws.send(JSON.stringify({ type: 'completed', data: { ...cachedResult, cached: true } }));
      ws.close(); // Закрываем соединение после отправки кэшированных данных
      return;
    }

    const hops = []; // Будем собирать все хопы здесь
    await NetworkUtils.traceroute(host, maxHops, (hop) => {
      // Отправляем каждый хоп по мере его поступления
      ws.send(JSON.stringify({ type: 'hop', data: hop }));
      hops.push(hop); // Собираем хопы для полного результата
    });

    // После завершения трассировки, отправляем полный результат и кэшируем его
    const finalResult = {
      host,
      hops,
      timestamp: new Date().toISOString(),
    };
    cache.set(cacheKey, finalResult);
    ws.send(JSON.stringify({ type: 'completed', data: { ...finalResult, cached: false } }));
    ws.close(); // Закрываем соединение после завершения
  } catch (error) {
    logger.error(`Error in runTracerouteStream for ${host}:`, error);
    ws.send(JSON.stringify({ type: 'error', message: error.message || 'Unknown error during traceroute.' }));
    ws.close(); // Закрываем соединение в случае ошибки
  }
};

export default { runTraceroute, runTracerouteStream };
