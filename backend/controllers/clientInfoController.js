import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import logger from '../utils/logger.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '../logs/client-info');

export const saveClientInfo = async (req, res) => {
  try {
    const data = req.body;
    logger.debug(`Received data to save: ${JSON.stringify(data)}`);
    
    // Создаем директорию, если ее нет
    if (!fs.existsSync(DATA_DIR)) {
      logger.info(`Creating directory: ${DATA_DIR}`);
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    
    // Форматируем дату для имени файла
    const today = new Date();
    const dateString = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;
    
    // Имя файла содержит дату
    const filename = `client-info-${dateString}.json`;
    const filePath = path.join(DATA_DIR, filename);
    logger.debug(`File path: ${filePath}`);
    
    // Подготовка данных для сохранения
    const saveData = {
      timestamp: new Date().toISOString(),
      sessionId: data.sessionId,
      ipInfo: data.ipInfo || null,
      deviceInfo: data.deviceInfo || null,
      localIp: data.localIp || null,
      localIpError: data.localIpError || null
    };
    
    // Читаем существующие данные или инициализируем новый массив
    let allData = [];
    if (fs.existsSync(filePath)) {
      logger.debug(`File exists, reading: ${filePath}`);
      try {
        allData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      } catch (error) {
        logger.error(`Error parsing JSON from ${filePath}: ${error.message}`);
        allData = [];
      }
    }
    
    // Добавляем новые данные
    allData.push(saveData);
    logger.debug(`New data to save: ${JSON.stringify(saveData)}`);
    
    // Сохраняем обновленные данные
    fs.writeFileSync(filePath, JSON.stringify(allData, null, 2));
    logger.info(`Client info saved to ${filename}`);
    
    res.status(200).json({ message: 'Client info saved' });
  } catch (error) {
    logger.error(`Error saving client info: ${error.message}`);
    res.status(500).json({ message: 'Internal server error' });
  }
};
