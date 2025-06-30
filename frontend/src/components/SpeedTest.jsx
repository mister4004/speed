import React, { useState, useRef, useEffect } from 'react';

// Импортируем наш веб-воркер
// const speedTestWorker = new Worker(new URL('../workers/speedTestWorker.js', import.meta.url));
// Если Vite некорректно обрабатывает import.meta.url для воркеров,
// может потребоваться более простой путь или настройка vite.config.js
// Или используйте Webpack/Rollup, если это другой бандлер.
// Если это React без специфичного бандлера, может быть так:
import SpeedTestWorker from '../workers/speedTestWorker?worker'; // Vite-специфичный импорт для воркеров

const SpeedTest = () => {
  const [downloadSpeed, setDownloadSpeed] = useState(null);
  const [uploadSpeed, setUploadSpeed] = useState(null);
  const [pingLatency, setPingLatency] = useState(null); // Добавляем состояние для пинга
  // ИЗМЕНЕНО: Установите начальное значение speedTestSizeMb на 15, если хотите, чтобы это был минимум
  const [speedTestSizeMb, setSpeedTestSizeMb] = useState(15);
  // ИЗМЕНЕНО: Установите начальное значение parallelStreams на 1, если хотите, чтобы это был минимум
  const [parallelStreams, setParallelStreams] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [debugInfo, setDebugInfo] = useState({}); // Инициализируем как объект
  const [statusMessage, setStatusMessage] = useState(''); // Сообщение о текущем статусе теста

  const lastTestTime = useRef(0);
  const workerRef = useRef(null); // Ref для хранения экземпляра воркера

  useEffect(() => {
    // Инициализация воркера один раз
    if (!workerRef.current) {
        workerRef.current = new SpeedTestWorker();

        workerRef.current.onmessage = (event) => {
            const { type, phase, value, unit, message, debug, current, total, latency } = event.data;

            switch (type) {
                case 'status':
                    setStatusMessage(message);
                    break;
                case 'progress':
                    if (phase === 'ping') {
                        setStatusMessage(`Ping: ${current}/${total} (${latency} ms)`);
                    } else if (phase === 'download') {
                        setStatusMessage(`Downloading: ${current}/${total} streams...`);
                    } else if (phase === 'upload') {
                        setStatusMessage(`Uploading: ${current}/${total} streams...`);
                    }
                    break;
                case 'result':
                    if (phase === 'ping') {
                        setPingLatency(value);
                        setDebugInfo(prev => ({ ...prev, pingLatency: value + ' ' + unit }));
                    } else if (phase === 'download') {
                        setDownloadSpeed(parseFloat(value));
                        setDebugInfo(prev => ({ ...prev, downloadedBytes: (debug.totalBytes / 1024 / 1024).toFixed(2) + ' MB', downloadDuration: debug.duration.toFixed(2) + 's' }));
                    } else if (phase === 'upload') {
                        setUploadSpeed(parseFloat(value));
                        setDebugInfo(prev => ({ ...prev, uploadedBytes: (debug.totalBytes / 1024 / 1024).toFixed(2) + ' MB', uploadDuration: debug.duration.toFixed(2) + 's' }));
                    }
                    break;
                case 'error':
                    setError(message);
                    setLoading(false);
                    setStatusMessage('Test failed.');
                    break;
                case 'completed':
                    setLoading(false);
                    setStatusMessage('Test completed!');
                    lastTestTime.current = Date.now();
                    break;
                default:
                    console.log('Unknown message from worker:', event.data);
            }
        };

        workerRef.current.onerror = (e) => {
            console.error('Worker error:', e);
            setError('Worker error occurred during speed test.');
            setLoading(false);
            setStatusMessage('Test failed.');
        };
    }

    // Очистка при размонтировании компонента
    return () => {
        if (workerRef.current) {
            // workerRef.current.terminate(); // Может быть полезно, если воркер не нужен
        }
    };
  }, []); // Пустой массив зависимостей означает, что эффект запустится один раз при монтировании

  const runTest = async () => {
    const now = Date.now();
    const timeSinceLastTest = now - lastTestTime.current;
    const minDelay = 5000;

    if (timeSinceLastTest < minDelay) {
      const remainingTime = Math.ceil((minDelay - timeSinceLastTest) / 1000);
      setError(`Please wait ${remainingTime} seconds before running another test`);
      return;
    }

    setDownloadSpeed(null);
    setUploadSpeed(null);
    setPingLatency(null); // Сброс пинга
    setError(null);
    setDebugInfo({}); // Сброс отладочной информации
    setLoading(true);
    setStatusMessage('Initializing test...');

    // Отправляем сообщение воркеру для начала теста
    if (workerRef.current) {
      workerRef.current.postMessage({
        type: 'startTest',
        payload: { speedTestSizeMb, parallelStreams },
      });
    } else {
        setError('Speed test worker not initialized.');
        setLoading(false);
    }
  };

  const Spinner = () => (
    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-teal-600"></div>
  );

  return (
    <section className="bg-gray-50 p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-semibold text-teal-600 mb-4 text-center">
        Internet Speed Test
      </h2>
      <p className="text-sm text-gray-600 mb-4 text-center">
        Measures your connection's speed with rate limiting protection.
      </p>

      <div className="space-y-4">
        {/* Настройка размера данных */}
        <div>
          <label htmlFor="speedTestSize" className="block text-sm font-medium text-gray-700">
            Test Data Size (MB): <span className="font-bold">{speedTestSizeMb} MB</span>
            {speedTestSizeMb > 150 && ( // ИЗМЕНЕНО: Порог для предупреждения
              <span className="text-orange-500 text-xs ml-2">
                (High values may trigger rate limiting)
              </span>
            )}
          </label>
          <input
            id="speedTestSize"
            type="range"
            value={speedTestSizeMb}
            onChange={(e) => setSpeedTestSizeMb(parseInt(e.target.value))}
            min="15" max="300" step="5" // ИЗМЕНЕНО: min="15", max="300"
            disabled={loading}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>15 MB</span> {/* ИЗМЕНЕНО */}
            <span>150 MB</span> {/* ИЗМЕНЕНО */}
            <span>300 MB</span> {/* ИЗМЕНЕНО */}
          </div>
        </div>

        {/* Настройка параллельных потоков */}
        <div>
          <label htmlFor="parallelStreams" className="block text-sm font-medium text-gray-700">
            Parallel Streams: <span className="font-bold">{parallelStreams}</span>
            {parallelStreams > 5 && ( // ИЗМЕНЕНО: Порог для предупреждения
              <span className="text-orange-500 text-xs ml-2">
                (More streams = higher rate limiting risk)
              </span>
            )}
          </label>
          <input
            id="parallelStreams"
            type="range"
            value={parallelStreams}
            onChange={(e) => setParallelStreams(parseInt(e.target.value))}
            min="1" max="8" step="1" // ИЗМЕНЕНО: max="8"
            disabled={loading}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>1</span>
            <span>4</span> {/* ИЗМЕНЕНО */}
            <span>8</span> {/* ИЗМЕНЕНО */}
          </div>
        </div>

        <div className="pt-2">
          <button
            onClick={runTest}
            className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-2 px-4 rounded-md shadow-md transition duration-300 ease-in-out flex items-center justify-center disabled:opacity-50"
            disabled={loading}
          >
            {loading ? <Spinner /> : 'Run Speed Test'}
          </button>
          {error && (
            <div className="text-red-500 mt-2 text-sm p-2 bg-red-50 rounded">
              <strong>Error:</strong> {error}
            </div>
          )}

          {(downloadSpeed !== null || uploadSpeed !== null || pingLatency !== null) && !loading && (
            <div className="text-center mt-4 grid grid-cols-1 md:grid-cols-3 gap-4"> {/* Изменено на md:grid-cols-3 */}
              {pingLatency !== null && (
                <div>
                  <p className="text-2xl font-semibold">
                    <strong>{pingLatency}</strong> <span className="text-lg">ms</span>
                  </p>
                  <p className="text-xs text-gray-500">Ping Latency</p>
                </div>
              )}
              {downloadSpeed !== null && (
                <div>
                  <p className="text-2xl font-semibold">
                    <strong>{downloadSpeed.toFixed(2)}</strong> <span className="text-lg">Mbps</span>
                  </p>
                  <p className="text-xs text-gray-500">Download</p>
                </div>
              )}
              {uploadSpeed !== null && (
                <div>
                  <p className="text-2xl font-semibold">
                    <strong>{uploadSpeed.toFixed(2)}</strong> <span className="text-lg">Mbps</span>
                  </p>
                  <p className="text-xs text-gray-500">Upload</p>
                </div>
              )}
            </div>
          )}
        </div>

        {loading && (
          <div className="text-center pt-4">
            <p className="text-xs text-gray-500 mt-2">
              {statusMessage || 'Running full speed test... Please wait.'} {/* Динамическое сообщение о статусе */}
            </p>
            {/* Можно добавить прогресс-бар здесь, если воркер будет отправлять детальный прогресс */}
          </div>
        )}

        {Object.keys(debugInfo).length > 0 && ( // Показываем debugInfo только если в нем что-то есть
          <div className="mt-4 p-3 bg-blue-50 rounded-md">
            <h4 className="text-sm font-medium text-blue-800 mb-2">Debug Info:</h4>
            <div className="text-xs text-blue-600 space-y-1">
              {debugInfo.pingLatency && <p>Ping: {debugInfo.pingLatency}</p>}
              {debugInfo.downloadedBytes && <p>Downloaded: {debugInfo.downloadedBytes} in {debugInfo.downloadDuration}</p>}
              {debugInfo.uploadedBytes && <p>Uploaded: {debugInfo.uploadedBytes} in {debugInfo.uploadedDuration}</p>}
              {debugInfo.successfulStreams && <p>Successful Streams: {debugInfo.successfulStreams}/{debugInfo.totalStreams}</p>}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default SpeedTest;
