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
    const status = error.response.status;
    const data = error.response.data; // Получаем данные из ответа об ошибке

    let errorMessage = `API Error: ${status} - ${data?.message || 'Unknown error'}`;

    // Специфическая обработка ошибки 400 для "Host not allowed"
    if (status === 400 && data) {
      if (data.metadata && data.metadata['0'] &&
          typeof data.metadata['0'].msg === 'string' &&
          data.metadata['0'].msg.includes('Host not allowed for security reasons')) {
        errorMessage = 'Host not allowed for security reasons. Please enter an IP address.';
      } else if (typeof data.message === 'string') {
          errorMessage = `API Error: ${status} - ${data.message}`;
      } else if (typeof data.msg === 'string') {
          errorMessage = `API Error: ${status} - ${data.msg}`;
      } else {
          errorMessage = `API Error: ${status} - Bad Request`;
      }
    }

    throw new Error(errorMessage); // Выбрасываем ошибку с новым сообщением
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

  // Метод для проксирования клиентского DNS-запроса
  clientDnsLookup: (host, type) =>
    api.get('/dns/client-lookup-proxy', {
      params: { host, type }
    }).catch(handleError),

  // ИСПРАВЛЕННЫЙ МЕТОД: для MAC lookup (использует POST)
  lookupMacVendor: (mac) => api.post('/mac-lookup', { mac }).catch(handleError), // Изменено с host на mac для ясности

  // Дополнительные методы, которые могут понадобиться
  getTracerouteWebSocketUrl: () => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${protocol}//${window.location.host}/api/v1/traceroute`;
  },
  checkServerStatus: async () => {
    try {
      const response = await api.get('/health');
      return response.status === 200;
    } catch {
      return false;
    }
  }
};
