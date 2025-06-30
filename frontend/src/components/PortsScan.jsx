// frontend/src/components/PortsScan.jsx

import React, { useState } from 'react';
import api from '../utils/api';

const PortsScan = ({ onResult }) => {
  const [host, setHost] = useState('');
  const [ports, setPorts] = useState('80,443');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleScan = async () => {
    setLoading(true);
    setError(null);

    // Input validation
    if (!host.trim()) {
      setError('Please enter a valid IP address.');
      setLoading(false);
      return;
    }

    // Convert ports to an array of numbers
    let portArray;
    try {
      portArray = ports.split(',')
        .map(p => p.trim())
        .filter(p => p)
        .map(p => {
          const port = parseInt(p);
          if (isNaN(port) || port < 1 || port > 65535) {
            throw new Error(`Invalid port: ${p}`);
          }
          return port;
        });

      if (portArray.length === 0) {
        throw new Error('Please enter at least one valid port.');
      }

      // Limit the number of ports
      if (portArray.length > 100) {
        throw new Error('Maximum 100 ports allowed.');
      }
    } catch (err) {
      setError(err.message);
      setLoading(false);
      return;
    }

    try {
      const response = await api.scanPorts({ host, ports: portArray });
      setResult(response.data);
      if (onResult) onResult(response.data);
    } catch (err) {
      let displayError = 'An unknown error occurred.'; // Дефолтное сообщение

      // *** ИЗМЕНЕНИЯ ЗДЕСЬ: ПРОСТО ЗАМЕНЯЕМ ТЕКСТ ***
      if (error === 'API Error: 400 - Unknown error') { // Проверяем, если текущая ошибка - это именно та, которую нужно заменить
        displayError = 'Host not allowed for security reasons. Please enter an IP address.'; // Ваше новое сообщение
      } else if (err.message) {
        // Для других ошибок используем сообщение из объекта ошибки
        displayError = err.message;
      }

      // Устанавливаем ошибку для отображения
      setError(displayError);

      if (onResult) onResult({ error: displayError });
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="bg-gray-50 p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-semibold text-yellow-800 mb-4 text-center">Port Scanner</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
        <input
          type="text"
          value={host}
          onChange={(e) => setHost(e.target.value)}
          placeholder="Enter IP (e.g., 8.8.8.8)"
          className="col-span-2 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-600"
        />
        <input
          type="text"
          value={ports}
          onChange={(e) => setPorts(e.target.value)}
          placeholder="Enter ports (e.g., 80,443)"
          className="p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-600"
        />
      </div>

      <button
        onClick={handleScan}
        disabled={loading}
        className="bg-yellow-600 text-white px-4 py-2 rounded-md hover:bg-yellow-700 disabled:bg-yellow-400 transition-colors w-full flex items-center justify-center"
      >
        {loading ? (
          <span className="flex items-center">
            <span className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></span>
            Scanning...
          </span>
        ) : 'Scan Ports'}
      </button>

      {error && (
        <div className="text-red-500 bg-red-50 p-2 rounded-md mt-3 text-center">
          Error: {error}
        </div>
      )}

      {result && (
        <div className="mt-4">
          <h3 className="text-lg font-medium text-yellow-700 mb-2 text-center">
            Scan Results for <span className="font-bold">{result.host}</span>
          </h3>

          <div className="bg-white p-3 rounded-md shadow-sm">
            <ul className="space-y-1">
              {result.results && result.results.length > 0 ? (
                result.results.map(({ port, open }) => (
                  <li key={port} className="flex items-center">
                    <span className="inline-block w-16">Port {port}:</span>
                    <span className={`px-2 py-1 rounded text-xs font-bold ${open ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {open ? 'Open' : 'Closed'}
                    </span>
                  </li>
                ))
              ) : (
                <li>No results found or all ports are closed/filtered.</li>
              )}
            </ul>
          </div>

          <div className="text-sm text-gray-600 mt-2 text-center">
            <p>Timestamp: {new Date(result.timestamp).toLocaleString()}</p>
            <p>Status: {result.cached ? 'Cached result' : 'Fresh scan'}</p>
          </div>
        </div>
      )}
    </section>
  );
};

export default PortsScan;
