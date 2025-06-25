import { body } from 'express-validator';
import config from '../config/config.js';

const isValidIP = (ip) => {
  const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  const ipv6Regex = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$|^(?:[0-9a-fA-F]{1,4}:){1,7}:$|^(?:[0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}$|^(?:[0-9a-fA-F]{1,4}:){1,5}(?::[0-9a-fA-F]{1,4}){1,2}$|^(?:[0-9a-fA-F]{1,4}:){1,4}(?::[0-9a-fA-F]{1,4}){1,3}$|^(?:[0-9a-fA-F]{1,4}:){1,3}(?::[0-9a-fA-F]{1,4}){1,4}$|^(?:[0-9a-fA-F]{1,4}:){1,2}(?::[0-9a-fA-F]{1,4}){1,5}$|^[0-9a-fA-F]{1,4}:(?::[0-9a-fA-F]{1,4}){1,6}$|^:(?::[0-9a-fA-F]{1,4}){1,7}$/;
  return ipv4Regex.test(ip) || ipv6Regex.test(ip);
};

const isValidDomain = (domain) => {
  const domainRegex = /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)*[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?$/;
  return domainRegex.test(domain) && domain.length <= 253;
};

const isAllowedHost = (host) => {
  if (isValidIP(host) || config.allowedHosts.includes(host)) {
    return true;
  }
  return config.allowedHosts.some((allowedHost) => {
    if (!allowedHost.includes('.')) return false;
    return host.endsWith(allowedHost) || host === allowedHost;
  });
};

export const validatePing = [
  body('host')
    .trim()
    .notEmpty()
    .withMessage('Host is required')
    .custom((value) => {
      if (!isValidIP(value) && !isValidDomain(value)) {
        throw new Error('Invalid IP address or domain name');
      }
      if (!isAllowedHost(value)) {
        throw new Error('Host not allowed for security reasons');
      }
      return true;
    }),
  body('count')
    .optional()
    .isInt({ min: 1, max: config.limits.pingCount })
    .withMessage(`Count must be between 1 and ${config.limits.pingCount}`),
];

export const validateTraceroute = [
  body('host')
    .trim()
    .notEmpty()
    .withMessage('Host is required')
    .custom((value) => {
      if (!isValidIP(value) && !isValidDomain(value)) {
        throw new Error('Invalid IP address or domain name');
      }
      if (!isAllowedHost(value)) {
        throw new Error('Host not allowed for security reasons');
      }
      return true;
    }),
  body('maxHops')
    .optional()
    .isInt({ min: 1, max: config.limits.tracerouteMaxHops })
    .withMessage(`Max hops must be between 1 and ${config.limits.tracerouteMaxHops}`),
];

export const validateDNS = [
  body('host')
    .trim()
    .notEmpty()
    .withMessage('Host is required')
    .custom((value) => {
      if (!isValidDomain(value) && !isValidIP(value)) {
        throw new Error('Invalid domain name or IP address');
      }
      return true;
    }),
  body('type')
    .optional()
    .isIn(['A', 'AAAA', 'MX', 'TXT', 'NS', 'CNAME', 'PTR'])
    .withMessage('Invalid DNS record type'),
];

export const validatePorts = [
  body('host')
    .trim()
    .notEmpty()
    .withMessage('Host is required')
    .custom((value) => {
      if (!isValidIP(value) && !isValidDomain(value)) {
        throw new Error('Invalid IP address or domain name');
      }
      if (!isAllowedHost(value)) {
        throw new Error('Host not allowed for security reasons');
      }
      return true;
    }),
  body('ports')
    .isArray({ min: 1, max: 10 })
    .withMessage('Ports must be an array with 1 to 10 ports')
    .custom((ports) => {
      return ports.every((port) => Number.isInteger(port) && port >= 1 && port <= 65535);
    })
    .withMessage('Each port must be an integer between 1 and 65535'),
];

export const validateWhois = [
  body('host')
    .trim()
    .notEmpty()
    .withMessage('Host is required')
    .custom((value) => {
      if (!isValidDomain(value) && !isValidIP(value)) {
        throw new Error('Invalid domain name or IP address');
      }
      return true;
    }),
];

export const validateDoH = [
  body('host')
    .trim()
    .notEmpty()
    .withMessage('Host is required')
    .custom((value) => {
      if (!isValidDomain(value)) {
        throw new Error('Invalid domain name');
      }
      return true;
    }),
];

export { isValidIP, isValidDomain, isAllowedHost };
