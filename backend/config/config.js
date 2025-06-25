import dotenv from 'dotenv';

dotenv.config();

const config = {
  port: process.env.PORT || 3001,
  host: process.env.HOST || '0.0.0.0', // Изменено на '0.0.0.0' для поддержки внешних подключений

  // Rate limiting
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 минут
    max: 100, // Максимум 100 запросов с одного IP
    message: 'Too many requests from this IP',
  },

  // Heavy operations rate limiting (ping, traceroute, speedtest, ports scan)
  heavyRateLimit: {
    windowMs: 15 * 60 * 1000, // 15 минут
    max: 10, // Максимум 10 тяжелых операций с одного IP
    message: 'Too many heavy operations from this IP',
  },

  // Безопасные хосты для ping, traceroute, ports scan
  allowedHosts: [
    '8.8.8.8', // Google DNS
    '1.1.1.1', // Cloudflare DNS
    '208.67.222.222', // OpenDNS
    '77.88.8.8', // Яндекс DNS
    'google.com',
    'cloudflare.com',
    'yandex.ru',
    'github.com',
    'example.com', // Добавлен для тестирования
  ],

  // Максимальные значения для безопасности
  limits: {
    pingCount: 4, // Максимальное количество пингов
    tracerouteMaxHops: 30, // Максимальное количество хопов для traceroute
    timeout: 30000, // Таймаут для операций (30 секунд)
    maxPorts: 10, // Максимальное количество портов для сканирования
  },

  // Кеширование
  cache: {
    ttl: 300, // 5 минут
    checkperiod: 120, // Проверка каждые 2 минуты
  },

  // WebSocket настройки
  websocket: {
    maxConnections: 100, // Максимальное количество одновременных WebSocket-соединений
    pingInterval: 30000, // Интервал пинга для поддержания соединения (30 секунд)
  },
};

export default config;
