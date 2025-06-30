import dotenv from 'dotenv';

dotenv.config();

const config = {
  port: process.env.PORT || 3001,
  host: process.env.HOST || '0.0.0.0',

  // Rate limiting
  rateLimit: {
    windowMs: 15 * 60 * 1000,
    max: 300, // Увеличено для общего трафика
    message: 'Too many requests from this IP',
  },

  // Heavy operations rate limiting (только для ping/traceroute/ports scan)
  heavyRateLimit: {
    windowMs: 15 * 60 * 1000,
    max: 50, // Увеличено для тяжелых операций
    message: 'Too many heavy operations from this IP',
  },

  // Speedtest rate limiting
  speedtestRateLimit: {
    windowMs: 2 * 60 * 1000, // 2 минуты
    max: 500, // Увеличено: 500 запросов за 2 минуты (для поддержки 8 потоков)
    message: 'Too many speedtest requests from this IP',
  },

  // Безопасные хосты (оставьте ваши фактические значения)
  allowedHosts: ['https://cloud-hosts.org', 'https://www.cloud-hosts.org', 'http://localhost:3000'],

  // Максимальные значения
  limits: {
    pingCount: 4,
    tracerouteMaxHops: 30,
    timeout: 30000,
    maxPorts: 10,

    // Оптимизированные настройки для speedtest
    speedtest: {
      maxThreads: 8,             // ИЗМЕНЕНО: Макс. потоков до 8
      minThreads: 1,             // ИЗМЕНЕНО: Мин. потоков для гибкости
      dynamicThreading: false,   // ИЗМЕНЕНО: Пока выключено (не динамический тест)
      maxFileSize: 300,          // ИЗМЕНЕНО: Макс. размер файла до 300 MB
      minFileSize: 15,           // ДОБАВЛЕНО: Мин. размер файла 15 MB
      defaultFileSize: 50,       // Размер файла по умолчанию
      maxDuration: 15000,        // Макс. длительность теста (ms)
      defaultServerThreads: 4    // Оптимальное количество потоков для сервера (можно настроить)
    }
  },

  // Cache (оставьте ваши фактические значения)
  cache: {
    stdTTL: 100, // Default TTL in seconds for cache
    checkperiod: 120, // How often to check for expired keys
  },

  // WebSocket (оставьте ваши фактические значения)
  websocket: {
    maxConnections: 50,
    connectionTimeout: 30000,
  }
};

export default config;
