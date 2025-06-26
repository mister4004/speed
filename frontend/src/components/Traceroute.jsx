import React, { useState } from 'react';
import api from "../utils/api";

const Traceroute = () => {
  const [tracerouteHost, setTracerouteHost] = useState('google.com');
  const [tracerouteMaxHops, setTracerouteMaxHops] = useState(5);
  const [tracerouteResult, setTracerouteResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const validateHost = (host) => {
    const hostRegex = /^(?:(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}|(?:\d{1,3}\.){3}\d{1,3})$/;
    return hostRegex.test(host);
  };

  const handleRunTraceroute = async () => {
    if (!tracerouteHost) {
      setError('Введите хост для traceroute.');
      return;
    }
    if (!validateHost(tracerouteHost)) {
      setError('Некорректный хост. Введите домен (example.com) или IP (8.8.8.8).');
      return;
    }
    if (tracerouteMaxHops < 1 || tracerouteMaxHops > 30) {
      setError('Количество хопов должно быть от 1 до 30.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await api.post('/traceroute', {
        host: tracerouteHost,
        maxHops: parseInt(tracerouteMaxHops),
      });
      setTracerouteResult(result.data);
    } catch (err) {
      setError(err.message || 'Ошибка при выполнении traceroute.');
    } finally {
      setLoading(false);
    }
  };

  const Spinner = () => (
    <div className="flex justify-center items-center">
      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
    </div>
  );

  return (
    <section className="bg-gray-50 p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-semibold text-indigo-600 mb-4 text-center">
        Traceroute Тест (с сервера)
      </h2>
      <p className="text-sm text-gray-600 mb-3 text-center">
        Этот тест выполняет Traceroute с диагностического сервера до указанного хоста.
      </p>
      <div className="space-y-3">
        <div>
          <label
            htmlFor="tracerouteHost"
            className="block text-sm font-medium text-gray-700"
          >
            Хост:
          </label>
          <input
            type="text"
            id="tracerouteHost"
            value={tracerouteHost}
            onChange={(e) => setTracerouteHost(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 px-3 py-2"
            placeholder="google.com"
          />
        </div>
        <div>
          <label
            htmlFor="tracerouteMaxHops"
            className="block text-sm font-medium text-gray-700"
          >
            Макс. хопов (1-30):
          </label>
          <input
            type="number"
            id="tracerouteMaxHops"
            value={tracerouteMaxHops}
            onChange={(e) => setTracerouteMaxHops(e.target.value)}
            min="1"
            max="30"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 px-3 py-2"
          />
        </div>
        <button
          onClick={handleRunTraceroute}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-md shadow-md transition duration-300 ease-in-out flex items-center justify-center"
          disabled={loading}
        >
          {loading ? <Spinner /> : 'Запустить Traceroute'}
        </button>
      </div>
      {error && <p className="text-red-500 mt-2">Ошибка: {error}</p>}
      {tracerouteResult && (
        <div className="mt-4 bg-gray-50 p-2 rounded-md text-sm overflow-auto max-h-48">
          <p>
            <strong>Хост:</strong> {tracerouteResult.host}
          </p>
          <p className="font-semibold mt-2">Хопы:</p>
          <ul className="list-disc list-inside ml-4">
            {tracerouteResult.hops.map((hop, index) => (
              <li key={index}>
                {hop.hop}: {hop.ip || 'N/A'}{' '}
                {hop.times.length > 0 ? `(${hop.times.join(' ms, ')} ms)` : ''}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
};

export default Traceroute;
