import axios from 'axios';
import NodeCache from 'node-cache';
import logger from '../utils/logger.js';

// Кэш на 5 минут
const cache = new NodeCache({ stdTTL: 300 });

export const getGeolocation = async () => {
  const cacheKey = 'geolocation';
  const cached = cache.get(cacheKey);
  
  if (cached) {
    logger.debug('Serving geolocation from cache');
    return cached;
  }

  try {
    // Основной API
    const response = await axios.get('http://ip-api.com/json', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36'
      }
    });

    if (response.data.status === 'success') {
      cache.set(cacheKey, response.data);
      return response.data;
    }
    
    throw new Error('Primary API returned non-success status');
  } catch (error) {
    logger.warn(`Primary geolocation API error: ${error.message}`);
    
    try {
      // Резервный API
      const backupResponse = await axios.get('https://ipinfo.io/json');
      cache.set(cacheKey, backupResponse.data);
      return backupResponse.data;
    } catch (backupError) {
      logger.error(`Backup geolocation API error: ${backupError.message}`);
      throw new Error('All geolocation services unavailable');
    }
  }
};
