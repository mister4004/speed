import React, { useState } from 'react';
import api from "../utils/api";

const DnsTests = () => {
  const [dnsServersResult, setDnsServersResult] = useState(null);
  const [dnsLookupResult, setDnsLookupResult] = useState(null);
  const [clientDnsResult, setClientDnsResult] = useState(null);
  const [dnsLookupHost, setDnsLookupHost] = useState('google.com');
  const [dnsLookupType, setDnsLookupType] = useState('A');
  const [loadingDnsServers, setLoadingDnsServers] = useState(false);
  const [loadingDnsLookup, setLoadingDnsLookup] = useState(false);
  const [loadingClientDns, setLoadingClientDns] = useState(false);
  const [errorDnsServers, setErrorDnsServers] = useState(null);
  const [errorDnsLookup, setErrorDnsLookup] = useState(null);
  const [errorClientDns, setErrorClientDns] = useState(null);

  const handleGetDnsServers = async () => {
    setLoadingDnsServers(true);
    setErrorDnsServers(null);
    try {
      const result = await api.post('/dns/servers');
      setDnsServersResult(result.data);
    } catch (err) {
      setErrorDnsServers(err.message || 'Ошибка при получении DNS-серверов.');
    } finally {
      setLoadingDnsServers(false);
    }
  };

  const handleRunDnsLookup = async () => {
    if (!dnsLookupHost) {
      setErrorDnsLookup('Введите хост для DNS-запроса.');
      return;
    }
    setLoadingDnsLookup(true);
    setErrorDnsLookup(null);
    try {
      const result = await api.post('/dns/lookup', { host: dnsLookupHost, type: dnsLookupType });
      setDnsLookupResult(result.data);
    } catch (err) {
      setErrorDnsLookup(err.message || 'Ошибка при выполнении DNS Lookup.');
    } finally {
      setLoadingDnsLookup(false);
    }
  };

  const handleRunClientDns = async () => {
    if (!dnsLookupHost) {
      setErrorClientDns('Введите хост для клиентского DNS-теста.');
      return;
    }
    setLoadingClientDns(true);
    setErrorClientDns(null);
    try {
      const response = await fetch(
        `https://dns.google/resolve?name=${encodeURIComponent(dnsLookupHost)}&type=${dnsLookupType}`
      );
      if (!response.ok) {
        throw new Error(`Client DNS error: ${response.status}`);
      }
      const data = await response.json();
      setClientDnsResult(data);
    } catch (err) {
      setErrorClientDns(
        err.message ||
          'Ошибка при выполнении клиентского DNS-теста. Проверьте соединение или попробуйте другой хост.'
      );
    } finally {
      setLoadingClientDns(false);
    }
  };

  const Spinner = () => (
    <div className="flex justify-center items-center">
      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
    </div>
  );

  return (
    <section className="bg-gray-50 p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-semibold text-purple-600 mb-4 text-center">
        DNS Тесты
      </h2>
      <p className="text-sm text-gray-600 mb-3 text-center">
        Тестирование DNS-серверов и записей. Включает тесты с диагностического сервера и клиентского устройства.
      </p>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-purple-50 p-4 rounded-md shadow-sm">
          <h3 className="text-xl font-medium text-purple-800 mb-2">
            DNS-серверы диагностического сервера
          </h3>
          <p className="text-sm text-gray-600 mb-3">
            Это DNS-серверы, используемые сервером приложения.
          </p>
          <button
            onClick={handleGetDnsServers}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-md shadow-md transition duration-300 ease-in-out flex items-center justify-center"
            disabled={loadingDnsServers}
          >
            {loadingDnsServers ? <Spinner /> : 'Показать DNS Серверы'}
          </button>
          {errorDnsServers && (
            <p className="text-red-500 mt-2">Ошибка: {errorDnsServers}</p>
          )}
          {dnsServersResult && (
            <div className="mt-4 bg-gray-50 p-2 rounded-md text-sm overflow-auto max-h-48">
              <p>
                <strong>Серверы:</strong>
              </p>
              <ul className="list-disc list-inside ml-4">
                {dnsServersResult.servers.map((server, index) => (
                  <li key={index}>{server}</li>
                ))}
              </ul>
              <p className="text-xs text-gray-500 mt-2">
                Обновлено: {new Date(dnsServersResult.timestamp).toLocaleTimeString()}
              </p>
            </div>
          )}
        </div>

        <div className="bg-yellow-50 p-4 rounded-md shadow-sm">
          <h3 className="text-xl font-medium text-yellow-800 mb-2">
            DNS Lookup (Сервер и Клиент)
          </h3>
          <div className="space-y-3">
            <div>
              <label htmlFor="dnsHost" className="block text-sm font-medium text-gray-700">
                Хост:
              </label>
              <input
                type="text"
                id="dnsHost"
                value={dnsLookupHost}
                onChange={(e) => setDnsLookupHost(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 px-3 py-2"
                placeholder="example.com or 8.8.8.8"
              />
            </div>
            <div>
              <label htmlFor="dnsType" className="block text-sm font-medium text-gray-700">
                Тип записи:
              </label>
              <select
                id="dnsType"
                value={dnsLookupType}
                onChange={(e) => setDnsLookupType(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 px-3 py-2"
              >
                {['A', 'AAAA', 'MX', 'TXT', 'NS', 'CNAME', 'PTR'].map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={handleRunDnsLookup}
                className="w-full bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded-md shadow-md transition duration-300 ease-in-out flex items-center justify-center"
                disabled={loadingDnsLookup}
              >
                {loadingDnsLookup ? <Spinner /> : 'Запустить DNS Lookup (Сервер)'}
              </button>
              <button
                onClick={handleRunClientDns}
                className="w-full bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 px-4 rounded-md shadow-md transition duration-300 ease-in-out flex items-center justify-center"
                disabled={loadingClientDns}
              >
                {loadingClientDns ? <Spinner /> : 'Запустить DNS Lookup (Клиент)'}
              </button>
            </div>
          </div>
          {errorDnsLookup && (
            <p className="text-red-500 mt-2">Ошибка: {errorDnsLookup}</p>
          )}
          {dnsLookupResult && (
            <div className="mt-4 bg-gray-50 p-2 rounded-md text-sm overflow-auto max-h-48">
              <p>
                <strong>Хост:</strong> {dnsLookupResult.host}
              </p>
              <p>
                <strong>Тип:</strong> {dnsLookupResult.type}
              </p>
              <p>
                <strong>Записи (Сервер):</strong>
              </p>
              <ul className="list-disc list-inside ml-4">
                {dnsLookupResult.records.map((record, index) => (
                  <li key={index}>{typeof record === 'object' ? JSON.stringify(record) : record}</li>
                ))}
              </ul>
              <p className="text-xs text-gray-500 mt-2">
                Обновлено: {new Date(dnsLookupResult.timestamp).toLocaleTimeString()}
              </p>
            </div>
          )}
          {errorClientDns && (
            <p className="text-red-500 mt-2">Ошибка: {errorClientDns}</p>
          )}
          {clientDnsResult && (
            <div className="mt-4 bg-gray-50 p-2 rounded-md text-sm overflow-auto max-h-48">
              <p>
                <strong>Хост:</strong> {clientDnsResult.Question[0].name}
              </p>
              <p>
                <strong>Тип:</strong> {clientDnsResult.Question[0].type}
              </p>
              <p>
                <strong>Записи (Клиент):</strong>
              </p>
              <ul className="list-disc list-inside ml-4">
                {clientDnsResult.Answer?.map((record, index) => (
                  <li key={index}>{record.data}</li>
                )) || <li>Нет данных</li>}
              </ul>
              <p className="text-xs text-gray-500 mt-2">
                Обновлено: {new Date().toLocaleTimeString()}
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default DnsTests;
