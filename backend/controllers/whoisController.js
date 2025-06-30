import whois from 'whois';
import dns from 'dns';
import NodeCache from 'node-cache';
import logger from '../utils/logger.js';
import config from '../config/config.js';
import { promisify } from 'util';
import { isIP } from 'net';

const whoisLookup = promisify(whois.lookup);
const dnsResolve = promisify(dns.resolve4);
const dnsResolve6 = promisify(dns.resolve6);
const cache = new NodeCache({
  stdTTL: config.cache.ttl,
  checkperiod: config.cache.checkperiod,
});

const parseWhois = (rawData, host) => {
  const result = {
    summary: [],
    details: []
  };

  const isIp = isIP(host) > 0;

  try {
    const extractField = (patterns) => {
      for (const pattern of patterns) {
        const match = rawData.match(pattern);
        if (match && match[1]) return match[1].trim();
      }
      return null;
    };

    const importantFields = {
      'Updated Date': [
        /Updated Date:\s*(.+)/i,
        /last-modified:\s*(.+)/i,
        /changed:\s*(.+)/i
      ],
      'Created Date': [
        /Creation Date:\s*(.+)/i,
        /created:\s*(.+)/i,
        /Registered on:\s*(.+)/i
      ],
      'Expires Date': [
        /Registry Expiry Date:\s*(.+)/i,
        /Expiration Date:\s*(.+)/i,
        /Expires on:\s*(.+)/i
      ],
      'Registrar': [
        /Registrar:\s*(.+)/i,
        /Registered by:\s*(.+)/i
      ],
      'Organization': [
        /org-name:\s*(.+)/i,
        /OrgName:\s*(.+)/i
      ],
      'Registrant': [
        /Registrant Organization:\s*(.+)/i
      ],
      'Country': [
        /country:\s*(.+)/i,
        /Registrant Country:\s*(.+)/i
      ],
      'Abuse Contact': [
        /abuse-mailbox:\s*(.+)/i,
        /OrgAbuseEmail:\s*(.+)/i,
        /Registrar Abuse Contact Email:\s*(.+)/i
      ],
      'IP Range': [
        /inetnum:\s*(.+)/i,
        /NetRange:\s*(.+)/i,
        /CIDR:\s*(.+)/i
      ],
      'Network Name': [
        /netname:\s*(.+)/i,
        /NetName:\s*(.+)/i
      ],
      'ASN': [
        /origin:\s*(.+)/i,
        /aut-num:\s*(.+)/i
      ]
    };

    const formatDate = (dateStr) => {
      try {
        const date = new Date(dateStr);
        return isNaN(date) ? dateStr : date.toISOString().split('T')[0];
      } catch {
        return dateStr;
      }
    };

    for (const [key, patterns] of Object.entries(importantFields)) {
      const value = extractField(patterns);
      if (value && value !== 'DATA REDACTED') {
        const formattedValue = key.includes('Date') ? formatDate(value) : value;
        result.summary.push({ key, value: formattedValue });
      }
    }

    if (isIp) {
      const asn = extractField(/origin:\s*(.+)/i);
      if (asn) result.details.push({ key: 'ASN', value: asn });
    }

    if (!isIp) {
      const nameServers = [];
      const nsMatches = rawData.match(/Name Server:\s*(\S+)/gi) || [];
      nsMatches.forEach(ns => {
        const match = ns.match(/Name Server:\s*(\S+)/i);
        if (match && match[1]) nameServers.push(match[1].trim());
      });
      
      if (nameServers.length > 0) {
        result.details.push({ 
          key: 'Name Servers', 
          value: nameServers.join(', ') 
        });
      }

      const registrant = extractField(/Registrant Organization:\s*(.+)/i);
      if (registrant && registrant !== 'DATA REDACTED') {
        result.details.push({ key: 'Registrant', value: registrant });
      }
    }

    const hasAbuseContact = result.summary.some(item => item.key === 'Abuse Contact');
    if (!hasAbuseContact) {
      const emailMatch = rawData.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/i);
      if (emailMatch) {
        result.summary.push({ 
          key: 'Abuse Contact', 
          value: emailMatch[0] 
        });
      }
    }

  } catch (error) {
    logger.error('WHOIS parsing error:', error);
  }

  return result;
};

// Функция для получения IP-адресов домена
const resolveDomainIps = async (domain) => {
  try {
    const ipv4 = await dnsResolve(domain).catch(() => []);
    const ipv6 = await dnsResolve6(domain).catch(() => []);
    return [...ipv4, ...ipv6];
  } catch (error) {
    logger.error(`DNS resolution error for ${domain}:`, error);
    return [];
  }
};

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
 *                   properties:
 *                     summary:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           key:
 *                             type: string
 *                           value:
 *                             type: string
 *                     details:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           key:
 *                             type: string
 *                           value:
 *                             type: string
 *                 ipAddresses:
 *                   type: array
 *                   items:
 *                     type: string
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

    const rawData = await whoisLookup(host);
    const parsedData = parseWhois(rawData, host);
    
    // Получаем IP-адреса для доменов
    let ipAddresses = [];
    if (isIP(host) === 0) { // Если это домен, а не IP
      ipAddresses = await resolveDomainIps(host);
    }
    
    result = {
      host,
      data: parsedData,
      ipAddresses,
      timestamp: new Date().toISOString()
    };
    
    cache.set(cacheKey, result);
    res.json({ ...result, cached: false });
  } catch (error) {
    logger.error(`Error in getWhois for ${host}:`, error);
    next(error);
  }
};

export default { getWhois };
