import { body } from 'express-validator';
import config from '../config/config.js';

const isValidIP = (ip) => {
  const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  const ipv6Regex = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$|^(?:[0-9a-fA-F]{1,4}:){1,7}:$|^(?:[0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}$|^(?:[0-9a-fA-F]{1,4}:){1,5}(?::[0-9a-fA-F]{1,4}){1,2}$|^(?:[0-9a-fA-F]{1,4}:){1,4}(?::[0-9a-fA-F]{1,4}){1,3}$|^(?:[0-9a-fA-F]{1,4}:){1,3}(?::[0-9a-fA-F]{1,4}){1,4}$|^(?:[0-9a-fA-F]{1,4}:){1,2}(?::[0-9a-fA-F]{1,4}){1,5}$|^[0-9a-fA-F]{1,4}:(?::[0-9a-fA-F]{1,4}){1,6}$|^:(?::[0-9a-fA-F]{1,4}){1,7}$/;
  return ipv4Regex.test(ip) || ipv6Regex.test(ip);
};

const isValidDomain = (domain) => {
  const domainRegex = /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)*[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?$/;

  // Проверка длины каждой части домена
  const labels = domain.split('.');
  const allLabelsValid = labels.every(label =>
    label.length > 0 &&
    label.length <= 63 &&
    !label.startsWith('-') &&
    !label.endsWith('-')
  );

  return domainRegex.test(domain) &&
         domain.length <= 253 &&
         allLabelsValid;
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

// Функция для очистки домена от протокола и пути
export const cleanDomain = (input) => {
  // Удаляем протокол (http://, https://) и www
  let cleaned = input.replace(/^(https?:\/\/)?(www\.)?/i, '');
  
  // Удаляем путь (всё после первого /)
  cleaned = cleaned.split('/')[0];
  
  // Удаляем порт (всё после :)
  cleaned = cleaned.split(':')[0];
  
  // Удаляем пробелы и спецсимволы
  cleaned = cleaned.trim();
  
  return cleaned;
};

// Улучшенный валидатор для MAC-адресов
const validateMacAddress = [
  body('mac')
    .trim()
    .notEmpty()
    .withMessage('MAC address is required')
    .custom(value => {
      // Удаляем все не-шестнадцатеричные символы
      const cleaned = value.replace(/[^a-fA-F0-9]/g, '');

      // Проверяем длину
      if (cleaned.length !== 12) {
        throw new Error('MAC address must contain exactly 12 hexadecimal characters');
      }

      // Проверяем что все символы валидные hex
      if (!/^[0-9A-Fa-f]{12}$/.test(cleaned)) {
        throw new Error('MAC address contains invalid characters');
      }

      return true;
    })
    .withMessage('Invalid MAC address format. Valid formats: 00:1A:2B:3C:4D:5E, 00-1A-2B-3C-4D-5E, 001A2B3C4D5E')
];

export const validateClientInfo = [
  body('sessionId')
    .trim()
    .notEmpty()
    .withMessage('Session ID is required')
    .isLength({ min: 10, max: 50 })
    .withMessage('Session ID must be between 10 and 50 characters'),

  body('timestamp')
    .trim()
    .notEmpty()
    .withMessage('Timestamp is required')
    .matches(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/)
    .withMessage('Invalid timestamp format. Use ISO 8601 format.'),

  body('ipInfo').optional().isObject().withMessage('ipInfo must be an object'),
  body('deviceInfo').optional().isObject().withMessage('deviceInfo must be an object'),
  body('localIp').optional().isIP().withMessage('Invalid local IP format'),
  body('localIpError').optional().isString().withMessage('localIpError must be a string')
];

export const validatePing = [
  body('host')
    .trim()
    .notEmpty()
    .withMessage('Host is required')
    .custom((value) => {
      const cleanedValue = cleanDomain(value);
      if (!isValidIP(cleanedValue) && !isValidDomain(cleanedValue)) {
        throw new Error('Invalid IP address or domain name');
      }
      if (!isAllowedHost(cleanedValue)) {
        throw new Error('Host not allowed for security reasons');
      }
      return true;
    })
    .customSanitizer(value => cleanDomain(value)),
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
      const cleanedValue = cleanDomain(value);
      if (!isValidIP(cleanedValue) && !isValidDomain(cleanedValue)) {
        throw new Error('Invalid IP address or domain name');
      }
      if (!isAllowedHost(cleanedValue)) {
        throw new Error('Host not allowed for security reasons');
      }
      return true;
    })
    .customSanitizer(value => cleanDomain(value)),
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
      const cleanedValue = cleanDomain(value);
      if (!isValidDomain(cleanedValue) && !isValidIP(cleanedValue)) {
        throw new Error('Invalid domain name or IP address');
      }
      return true;
    })
    .customSanitizer(value => cleanDomain(value)),
  body('type')
    .optional()
    .isIn(['A', 'AAAA', 'MX', 'TXT', 'NS', 'CNAME', 'PTR'])
    .withMessage('Invalid DNS record type'),
];

// ИСПРАВЛЕННЫЙ ВАЛИДАТОР ДЛЯ ПОРТОВ
export const validatePorts = [
  body('host')
    .trim()
    .notEmpty()
    .withMessage('Host is required')
    .custom((value) => {
      // Для сканирования портов НЕ очищаем значение от порта
      if (!isValidIP(value) && !isValidDomain(value)) {
        throw new Error('Invalid IP address or domain name');
      }
      if (!isAllowedHost(value)) {
        throw new Error('Host not allowed for security reasons');
      }
      return true;
    }),
    // УДАЛЕНО: .customSanitizer(value => cleanDomain(value))
  
  body('ports')
    .isArray({ min: 1, max: 10 })
    .withMessage('Ports must be an array with 1 to 10 ports')
    .custom((ports) => {
      return ports.every((port) => Number.isInteger(port) && port >= 1 && port <= 65535);
    })
    .withMessage('Each port must be an integer between 1 and 65535')
];

export const validateWhois = [
  body('host')
    .trim()
    .notEmpty()
    .withMessage('Host is required')
    .custom((value) => {
      const cleanedValue = cleanDomain(value);
      if (!isValidDomain(cleanedValue) && !isValidIP(cleanedValue)) {
        throw new Error('Invalid domain name or IP address');
      }
      return true;
    })
    .customSanitizer(value => cleanDomain(value)),
];

export const validateDoH = [
  body('host')
    .trim()
    .notEmpty()
    .withMessage('Host is required')
    .custom((value) => {
      const cleanedValue = cleanDomain(value);
      if (!isValidDomain(cleanedValue)) {
        throw new Error('Invalid domain name');
      }
      return true;
    })
    .customSanitizer(value => cleanDomain(value)),
];

// Экспорт вспомогательных функций
export { isValidIP, isValidDomain, isAllowedHost, validateMacAddress };
