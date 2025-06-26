import axios from 'axios';

// Используем относительный путь для API
const api = axios.create({
  baseURL: '/api/v1',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Обработчик ошибок
const handleError = (error) => {
  if (error.response) {
    throw new Error(`API Error: ${error.response.status} - ${error.response.data?.message || 'Unknown error'}`);
  } else if (error.request) {
    throw new Error('No response from server. Check your network connection.');
  } else {
    throw new Error(`Request setup error: ${error.message}`);
  }
};

export default {
  getHealth: () => api.get('/health').catch(handleError),
  getDNSServers: () => api.get('/dns/servers').catch(handleError),
  dnsLookup: (data) => api.post('/dns/lookup', data).catch(handleError),
  checkDoH: (data) => api.post('/dns/doh', data).catch(handleError),
  runPing: (data) => api.post('/ping', data).catch(handleError),
  runTraceroute: (data) => api.post('/traceroute', data).catch(handleError),
  downloadTest: () => api.get('/speedtest/download', { responseType: 'blob' }).catch(handleError),
  uploadTest: (data) => api.post('/speedtest/upload', data).catch(handleError),
  scanPorts: (data) => api.post('/ports/scan', data).catch(handleError),
  getWhois: (data) => api.post('/whois', data).catch(handleError),
  checkVpnProxy: () => api.get('/info/vpn').catch(handleError),
  exportResults: (data) => api.post('/export', data, {
    responseType: data.format === 'pdf' ? 'blob' : 'json',
  }).catch(handleError),
  
  // Дополнительные методы, которые могут понадобиться
  getTracerouteWebSocketUrl: () => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${protocol}//${window.location.host}/api/v1/traceroute`;
  },
  
  // Метод для проверки доступности сервера
  checkServerStatus: async () => {
    try {
      const response = await api.get('/health');
      return response.status === 200;
    } catch {
      return false;
    }
  }
};
