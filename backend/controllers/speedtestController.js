import logger from '../utils/logger.js';
import config from '../config/config.js';

/**
 * Обработка запросов на скачивание (Download Test)
 * Отправляет клиенту файл указанного размера для измерения скорости загрузки.
 */
export const handleDownloadRequest = (req, res) => {
  try {
    // Получаем размер файла из query-параметра 'size', по умолчанию используем значение из конфига
    const fileSizeMB = parseInt(req.query.size || config.limits.speedtest.defaultFileSize);

    // Проверяем, не превышает ли запрошенный размер максимальный допустимый
    if (fileSizeMB > config.limits.speedtest.maxFileSize) {
      logger.warn(`Download request for oversized file from IP: ${req.ip}. Requested: ${fileSizeMB}MB, Max: ${config.limits.speedtest.maxFileSize}MB`);
      return res.status(400).json({ error: `Requested file size exceeds maximum allowed (${config.limits.speedtest.maxFileSize}MB)` });
    }

    const buffer = Buffer.alloc(fileSizeMB * 1024 * 1024); // Создаем буфер нужного размера в MB

    res.setHeader('Content-Type', 'application/octet-stream'); // Тип контента для бинарных данных
    res.setHeader('Content-Length', buffer.length); // Устанавливаем длину контента
    // Запрещаем кэширование, чтобы каждый раз происходила реальная загрузка
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    res.send(buffer); // Отправляем буфер как ответ
    logger.info(`Download served: ${fileSizeMB}MB to IP: ${req.ip}`);
  } catch (error) {
    logger.error(`Error handling download request for IP: ${req.ip}: ${error.message}`, { error });
    res.status(500).json({ error: 'Failed to serve download file', details: error.message });
  }
};

/**
 * Обработка запросов на загрузку (Upload Test)
 * Принимает данные от клиента и измеряет скорость выгрузки.
 */
export const handleUploadRequest = (req, res) => {
  try {
    // Проверяем, что req.body существует и является Buffer
    if (!req.body || !(req.body instanceof Buffer)) {
      logger.warn(`Upload request with invalid or empty body from IP: ${req.ip}`);
      return res.status(400).json({ status: 'error', message: 'No data received or invalid format' });
    }

    const totalBytes = req.body.length; // Получаем размер данных из req.body
    logger.info(`Upload received: ${totalBytes} bytes from IP: ${req.ip}`);

    // Отправляем JSON-ответ, который ожидает клиент
    res.status(200).json({ status: 'success', receivedBytes: totalBytes });
  } catch (error) {
    logger.error(`Upload error from IP: ${req.ip}: ${error.message}`, { error });
    res.status(500).json({ status: 'error', message: 'Server error during upload', details: error.message });
  }
};

/**
 * Обработка запросов на пинг (Ping Test)
 * Просто быстро отвечает клиенту для измерения задержки (RTT).
 */
export const handlePingRequest = (req, res) => {
  try {
    res.status(200).json({ status: 'pong' }); // Отправляем простой ответ
    logger.info(`Ping request from IP: ${req.ip}`);
  } catch (error) {
    logger.error(`Error handling ping request for IP: ${req.ip}: ${error.message}`, { error });
    res.status(500).json({ error: 'Ping failed', details: error.message });
  }
};
