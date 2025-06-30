import React, { useState } from 'react';
import api from "../utils/api";

const IcmpPing = () => {
  const [pingHost, setPingHost] = useState('8.8.8.8');
  const [pingCount, setPingCount] = useState(2);
  const [pingResult, setPingResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const validateHost = (host) => {
    const hostRegex = /^(?:(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}|(?:\d{1,3}\.){3}\d{1,3})$/;
    return hostRegex.test(host);
  };

  const handleRunPing = async () => {
    if (!pingHost) {
      setError('Введите хост для пинга.');
      return;
    }
    if (!validateHost(pingHost)) {
      setError('Некорректный хост. Введите домен (example.com) или IP (8.8.8.8).');
      return;
    }
    if (pingCount < 1 || pingCount > 4) {
      setError('Количество пингов должно быть от 1 до 4.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      // ИСПРАВЛЕНО: Используем api.runPing вместо api.post
      const result = await api.runPing({ host: pingHost, count: parseInt(pingCount) });
      setPingResult(result.data);
    } catch (err) {
      setError(err.message || 'Ошибка при выполнении пинга.');
    } finally {
      setLoading(false);
    }
  };

  const Spinner = () => (
    <div className="flex justify-center items-center">
      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-red-600"></div>
    </div>
  );

  return (
    <section className="bg-gray-50 p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-semibold text-red-600 mb-4 text-center">
        Ping Тест (с сервера)
      </h2>
      <p className="text-sm text-gray-600 mb-3 text-center">
        Этот тест выполняет ICMP Ping с диагностического сервера до указанного хоста.
      </p>
      <div className="space-y-3">
        <div>
          <label htmlFor="pingHost" className="block text-sm font-medium text-gray-700">
            Хост:
          </label>
          <input
            type="text"
            id="pingHost"
            value={pingHost}
            onChange={(e) => setPingHost(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 px-3 py-2"
            placeholder="8.8.8.8 or google.com"
          />
        </div>
        <div>
          <label htmlFor="pingCount" className="block text-sm font-medium text-gray-700">
            Количество пингов (1-4):
          </label>
          <input
            type="number"
            id="pingCount"
            value={pingCount}
            onChange={(e) => setPingCount(e.target.value)}
            min="1"
            max="4"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 px-3 py-2"
          />
        </div>
        <button
          onClick={handleRunPing}
          className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-md shadow-md transition duration-300 ease-in-out flex items-center justify-center"
          disabled={loading}
        >
          {loading ? <Spinner /> : 'Запустить Ping'}
        </button>
      </div>
      {error && <p className="text-red-500 mt-2">Ошибка: {error}</p>}
      {pingResult && (
        <div className="mt-4 bg-gray-50 p-2 rounded-md text-sm overflow-auto max-h-48">
          <p>
            <strong>Хост:</strong> {pingResult.host}
          </p>
          <p>
            <strong>Передано:</strong> {pingResult.packets?.transmitted}
          </p>
          <p>
            <strong>Получено:</strong> {pingResult.packets?.received}
          </p>
          <p>
            <strong>Потери:</strong> {pingResult.packets?.lossPercentage}%
          </p>
          {pingResult.timing && (
            <p>
              <strong>Время (мин/ср/макс/откл):</strong>{' '}
              {pingResult.timing.min}/{pingResult.timing.avg}/{pingResult.timing.max}/
              {pingResult.timing.mdev} ms
            </p>
          )}
          <p className="font-semibold mt-2">Ответы:</p>
          <ul className="list-disc list-inside ml-4">
            {pingResult.responses.map((response, index) => (
              <li key={index}>{response.raw}</li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
};

export default IcmpPing;
