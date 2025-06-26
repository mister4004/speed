import React, { useState } from 'react';
import api from "../utils/api";

const SpeedTest = () => {
  const [downloadSpeed, setDownloadSpeed] = useState(null);
  const [uploadSpeed, setUploadSpeed] = useState(null);
  const [speedTestSizeMb, setSpeedTestSizeMb] = useState(10);
  const [loadingDownload, setLoadingDownload] = useState(false);
  const [loadingUpload, setLoadingUpload] = useState(false);
  const [errorDownload, setErrorDownload] = useState(null);
  const [errorUpload, setErrorUpload] = useState(null);

  const handleRunDownloadTest = async () => {
    setLoadingDownload(true);
    setErrorDownload(null);
    setDownloadSpeed(null);
    try {
      const worker = new Worker(new URL('../workers/speedTestWorker.js', import.meta.url));
      worker.postMessage({ type: 'download', url: 'https://cloud-hosts.org/api/v1/speedtest/download' });
      worker.onmessage = (e) => {
        const { speedMbps, error } = e.data;
        if (error) {
          setErrorDownload(error);
        } else {
          setDownloadSpeed(speedMbps.toFixed(2));
        }
        setLoadingDownload(false);
        worker.terminate();
      };
    } catch (err) {
      setErrorDownload(err.message || 'Ошибка при выполнении теста загрузки.');
      setLoadingDownload(false);
    }
  };

  const handleRunUploadTest = async () => {
    setLoadingUpload(true);
    setErrorUpload(null);
    setUploadSpeed(null);
    try {
      const worker = new Worker(new URL('../workers/speedTestWorker.js', import.meta.url));
      worker.postMessage({
        type: 'upload',
        url: 'https://cloud-hosts.org/api/v1/speedtest/upload',
        sizeMb: speedTestSizeMb,
      });
      worker.onmessage = (e) => {
        const { speedMbps, error } = e.data;
        if (error) {
          setErrorUpload(error);
        } else {
          setUploadSpeed(speedMbps.toFixed(2));
        }
        setLoadingUpload(false);
        worker.terminate();
      };
    } catch (err) {
      setErrorUpload(err.message || 'Ошибка при выполнении теста отправки.');
      setLoadingUpload(false);
    }
  };

  const Spinner = () => (
    <div className="flex justify-center items-center">
      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-teal-600"></div>
    </div>
  );

  return (
    <section className="bg-gray-50 p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-semibold text-teal-600 mb-4 text-center">
        Тест Скорости Интернета
      </h2>
      <p className="text-sm text-gray-600 mb-3 text-center">
        Измеряет скорость загрузки и отправки данных между вашим браузером и диагностическим
        сервером.
      </p>
      <div className="space-y-4">
        <div>
          <label
            htmlFor="speedTestSize"
            className="block text-sm font-medium text-gray-700"
          >
            Размер тестовых данных (МБ):
          </label>
          <input
            type="number"
            id="speedTestSize"
            value={speedTestSizeMb}
            onChange={(e) => setSpeedTestSizeMb(Math.max(1, parseInt(e.target.value)))}
            min="1"
            max="100"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 px-3 py-2"
          />
          <p className="text-xs text-gray-500 mt-1">
            Рекомендуемый размер для теста: 10-50 МБ.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <button
              onClick={handleRunDownloadTest}
              className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-2 px-4 rounded-md shadow-md transition duration-300 ease-in-out flex items-center justify-center"
              disabled={loadingDownload}
            >
              {loadingDownload ? <Spinner /> : 'Запустить Тест Загрузки'}
            </button>
            {errorDownload && (
              <p className="text-red-500 mt-2">Ошибка: {errorDownload}</p>
            )}
            {downloadSpeed && (
              <p className="text-center mt-2">
                Скорость загрузки: <strong>{downloadSpeed} Мбит/с</strong>
              </p>
            )}
          </div>
          <div>
            <button
              onClick={handleRunUploadTest}
              className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-2 px-4 rounded-md shadow-md transition duration-300 ease-in-out flex items-center justify-center"
              disabled={loadingUpload}
            >
              {loadingUpload ? <Spinner /> : 'Запустить Тест Отправки'}
            </button>
            {errorUpload && <p className="text-red-500 mt-2">Ошибка: {errorUpload}</p>}
            {uploadSpeed && (
              <p className="text-center mt-2">
                Скорость отправки: <strong>{uploadSpeed} Мбит/с</strong>
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default SpeedTest;
