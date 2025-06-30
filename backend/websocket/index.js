// backend/websocket/index.js
import { WebSocketServer } from 'ws';
import TracerouteController from '../controllers/tracerouteController.js';
import { websocketLimit } from '../middleware/security.js';
import logger from '../utils/logger.js';

const setupWebSocket = (httpServer) => {
  const wss = new WebSocketServer({ server: httpServer });
  websocketLimit(wss); // Применяем лимит на количество подключений

  // Обработчик для всех входящих WebSocket-соединений
  wss.on('connection', (ws, req) => {
    logger.info(`WebSocket connected from IP: ${req.socket.remoteAddress}, Path: ${req.url}`);

    // Определяем путь запроса для маршрутизации WebSocket-сообщений
    const url = new URL(req.url, `http://${req.headers.host}`); // Создаем URL объект для удобного парсинга
    const pathname = url.pathname;

    // Проверяем, является ли это запросом на трассировку
    if (pathname === '/ws/traceroute') {
      // Извлекаем параметры из URL-запроса, а не из тела сообщения
      const host = url.searchParams.get('host');
      const maxHops = url.searchParams.get('maxHops');

      // Проверяем обязательные параметры
      if (!host) {
        ws.send(JSON.stringify({ type: 'error', message: 'Host parameter is required for traceroute stream in URL.' }));
        ws.close();
        return;
      }

      // Запускаем потоковую трассировку
      // Передаем ws и объект req с хостом и maxHops в runTracerouteStream
      TracerouteController.runTracerouteStream(ws, { url: req.url, body: { host, maxHops } });

    } else {
      // Если путь не соответствует известным WebSocket-службам
      ws.send(JSON.stringify({ type: 'error', message: 'Unknown WebSocket path.' }));
      ws.close();
    }

    // Обработчик сообщений от клиента (если бы были другие типы взаимодействий, не только по URL)
    // В данном случае для трассировки, все параметры передаются в URL, поэтому on('message') не нужен для старта теста
    ws.on('message', async (message) => {
      logger.warn(`Received unexpected WebSocket message on ${pathname}: ${message.toString()}`);
      // Возможно, здесь могут быть другие типы команд, если в будущем добавится функционал
    });

    ws.on('close', () => {
      logger.info(`WebSocket disconnected from IP: ${req.socket.remoteAddress}, Path: ${req.url}`);
    });

    ws.on('error', (err) => {
      logger.error(`WebSocket error for IP: ${req.socket.remoteAddress}, Path: ${req.url}:`, err);
      ws.close();
    });
  });
};

export default setupWebSocket;
