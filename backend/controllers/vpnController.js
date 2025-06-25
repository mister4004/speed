import logger from '../utils/logger.js';

/**
 * @swagger
 * /api/v1/info/vpn:
 *   get:
 *     summary: Check if client is using VPN/Proxy
 *     tags: [VPN]
 *     responses:
 *       200:
 *         description: VPN/Proxy detection result
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ip:
 *                   type: string
 *                 vpn:
 *                   type: boolean
 *                 proxy:
 *                   type: boolean
 *                 hosting:
 *                   type: boolean
 *                 timestamp:
 *                   type: string
 *       500:
 *         description: Server error
 */
const checkVpnProxy = async (req, res, next) => {
  try {
    const clientIP = req.headers['x-forwarded-for']?.split(',')[0] ||
                     req.headers['x-real-ip'] ||
                     req.socket.remoteAddress.replace(/^::ffff:/, '');

    const response = await fetch(`http://ip-api.com/json/${clientIP}?fields=proxy,hosting`);
    if (!response.ok) {
      throw new Error(`IP-API request failed: ${response.status}`);
    }

    const data = await response.json();
    const result = {
      ip: clientIP,
      vpn: data.proxy || false,
      proxy: data.proxy || false,
      hosting: data.hosting || false,
      timestamp: new Date().toISOString(),
    };

    logger.info(`VPN/Proxy check for ${clientIP}: ${JSON.stringify(result)}`);
    res.json(result);
  } catch (error) {
    logger.error(`Error in checkVpnProxy for ${clientIP}:`, error);
    next(error);
  }
};

export default { checkVpnProxy };
