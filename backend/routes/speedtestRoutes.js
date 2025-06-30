import express from 'express';
import {
  handleDownloadRequest,
  handleUploadRequest,
  handlePingRequest
} from '../controllers/speedtestController.js'; // Импортируем новые обработчики
import { speedtestLimit } from '../middleware/security.js'; // Импортируем лимитер скорости
import logger from '../utils/logger.js'; // Добавляем импорт логгера

const router = express.Router();

// Применяем лимитер скорости ко всем маршрутам в этом роутере.
// Это поможет предотвратить злоупотребления.
router.use(speedtestLimit);

/**
 * @swagger
 * /api/v1/speedtest/download:
 * get:
 * summary: Serve a file for download speed test
 * tags: [SpeedTest]
 * parameters:
 * - in: query
 * name: size
 * schema:
 * type: integer
 * default: 50
 * description: File size in MB to serve for download.
 * responses:
 * '200':
 * description: Binary file for download.
 * content:
 * application/octet-stream:
 * schema:
 * type: string
 * format: binary
 * '400':
 * description: Invalid or oversized file request.
 * '500':
 * description: Server error during file generation.
 */
router.get('/download', handleDownloadRequest);

/**
 * @swagger
 * /api/v1/speedtest/upload:
 * post:
 * summary: Receive data for upload speed test
 * tags: [SpeedTest]
 * requestBody:
 * required: true
 * content:
 * application/octet-stream:
 * schema:
 * type: string
 * format: binary
 * description: Data stream for upload.
 * responses:
 * '200':
 * description: Upload received successfully.
 * content:
 * application/json:
 * schema:
 * type: object
 * properties:
 * status:
 * type: string
 * example: "success"
 * receivedBytes:
 * type: integer
 * '500':
 * description: Server error during upload.
 */
router.post('/upload', (req, res, next) => {
    console.log('[DEBUG-UPLOAD] Маршрут /upload вызван!');
    console.log('[DEBUG-UPLOAD] Content-Type:', req.headers['content-type']); // Должно быть application/octet-stream
    console.log('[DEBUG-UPLOAD] Размер req.body:', req.body ? req.body.length : 'пусто');

    if (req.body instanceof Buffer) {
        console.log('[DEBUG-UPLOAD] req.body — это Buffer. Размер:', req.body.length);
    } else if (req.body) {
        console.log('[DEBUG-UPLOAD] req.body существует, но НЕ Buffer. Тип:', typeof req.body);
    } else {
        console.log('[DEBUG-UPLOAD] req.body пустой или undefined.');
    }

    try {
        handleUploadRequest(req, res, next); // Вызываем оригинальный обработчик
    } catch (error) {
        logger.error('[DEBUG-UPLOAD] Ошибка при обработке загрузки:', error);
        res.status(500).json({
            status: 'error',
            message: 'Ошибка сервера при обработке загрузки',
            error: error.message
        });
    }
});

/**
 * @swagger
 * /api/v1/speedtest/ping:
 * get:
 * summary: Respond for ping test
 * tags: [SpeedTest]
 * responses:
 * '200':
 * description: Pong response.
 * content:
 * application/json:
 * schema:
 * type: object
 * properties:
 * status:
 * type: string
 * example: "pong"
 * '500':
 * description: Server error during ping response.
 */
router.get('/ping', handlePingRequest);

export default router;
