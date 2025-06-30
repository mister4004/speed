import logger from '../utils/logger.js';

export const lookupMacVendor = async (req, res) => {
  try {
    const { mac } = req.body;
    
    if (!mac) {
      logger.warn('MAC lookup request without MAC address');
      return res.status(400).json({ message: 'MAC address is required' });
    }

    // Нормализация MAC-адреса
    const cleanMac = mac.replace(/[^a-fA-F0-9]/g, '').toUpperCase();
    
    if (cleanMac.length !== 12) {
      return res.status(400).json({ message: 'Invalid MAC address length' });
    }

    // Форматирование в стандартный вид
    const formattedMac = cleanMac.match(/.{1,2}/g).join(':');
    
    // Используем публичный API
    let vendor = 'Vendor not found';
    try {
      const apiResponse = await fetch(`https://api.macvendors.com/${formattedMac}`);
      if (apiResponse.ok) {
        vendor = await apiResponse.text();
        logger.info(`API lookup for ${formattedMac}: ${vendor}`);
      } else {
        logger.warn(`API lookup failed for ${formattedMac}: ${apiResponse.status}`);
      }
    } catch (error) {
      logger.error(`API request failed: ${error.message}`);
    }
    
    res.json({ 
      vendor,
      normalizedMac: formattedMac
    });
    
  } catch (error) {
    logger.error(`MAC lookup error: ${error.message}`);
    res.status(500).json({ 
      message: 'Internal server error',
      details: error.message
    });
  }
};
