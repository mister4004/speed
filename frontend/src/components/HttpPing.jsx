import React, { useState } from 'react';
import api from "../utils/api";

const HttpPing = () => {
  const [latency, setLatency] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const measureHttpPing = async () => {
    setLoading(true);
    setError(null);
    setLatency(null);

    try {
      // Выполняем 3 измерения для точности
      const measurements = [];
      for (let i = 0; i < 3; i++) {
        const startTime = performance.now();
        await api.get('/health');
        const endTime = performance.now();
        measurements.push(endTime - startTime);
        // Задержка между измерениями
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
      // Вычисляем среднюю задержку
      const avgLatency = measurements.reduce((sum, val) => sum + val, 0) / measurements.length;
      setLatency(avgLatency.toFixed(2));
    } catch (err) {
      setError(err.message || 'Ошибка при измерении задержки.');
    } finally {
      setLoading(false);
    }
  };

  const Spinner = () => (
    <div className="flex justify-center items-center">
      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-600"></div>
    </div>
  );

  return (
    <section className="bg-gray-50 p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-semibold text-orange-600 mb-4 text-center">
        Тест Задержки до Сервера (HTTP Ping)
      </h2>
      <p className="text-sm text-gray-600 mb-3 text-center">
        Измеряет время, необходимое вашему браузеру для отправки запроса и получения ответа от
        диагностического сервера.
      </p>
      <button
        onClick={measureHttpPing}
        className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-2 px-4 rounded-md shadow-md transition duration-300 ease-in-out flex items-center justify-center"
        disabled={loading}
      >
        {loading ? <Spinner /> : 'Измерить задержку до сервера'}
      </button>
      {error && (
        <p className="text-red-500 mt-2 text-center">
          Ошибка: {error}. Проверьте соединение или попробуйте позже.
        </p>
      )}
      {latency && (
        <p className="text-center mt-2">
          Средняя задержка до сервера: <strong>{latency} ms</strong>
        </p>
      )}
    </section>
  );
};

export default HttpPing;
