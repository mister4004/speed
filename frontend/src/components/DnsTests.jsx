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

  // Функция для преобразования кодов статуса DNS в текст
  const getDnsStatusText = (status) => {
    const statusCodes = {
      0: "No Error",
      1: "Format Error",
      2: "Server Failure",
      3: "Non-Existent Domain",
      4: "Not Implemented",
      5: "Query Refused"
    };
    return statusCodes[status] || `Unknown (${status})`;
  };

  const handleGetDnsServers = async () => {
    setLoadingDnsServers(true);
    setErrorDnsServers(null);
    try {
      const result = await api.getDNSServers();
      setDnsServersResult(result.data);
    } catch (err) {
      setErrorDnsServers(err.message || 'Error fetching DNS servers.');
    } finally {
      setLoadingDnsServers(false);
    }
  };

  const handleRunDnsLookup = async () => {
    if (!dnsLookupHost) {
      setErrorDnsLookup('Please enter a host for DNS query.');
      return;
    }
    setLoadingDnsLookup(true);
    setErrorDnsLookup(null);
    try {
      const result = await api.dnsLookup({ host: dnsLookupHost, type: dnsLookupType });
      setDnsLookupResult(result.data);
    } catch (err) {
      setErrorDnsLookup(err.message || 'Error performing DNS Lookup.');
    } finally {
      setLoadingDnsLookup(false);
    }
  };

  const handleRunClientDns = async () => {
    if (!dnsLookupHost) {
      setErrorClientDns('Please enter a host for client DNS test.');
      return;
    }
    setLoadingClientDns(true);
    setErrorClientDns(null);
    try {
      console.log('Starting client DNS lookup for', dnsLookupHost, dnsLookupType);
      
      // ИСПРАВЛЕНИЕ 1: Получаем data из ответа
      const response = await api.clientDnsLookup(dnsLookupHost, dnsLookupType);
      const resultData = response.data; // Исправлено здесь
      console.log('Client DNS lookup result:', resultData);
      
      // ИСПРАВЛЕНИЕ 2: Проверяем наличие ответа
      if (resultData && resultData.Answer) {
        setClientDnsResult(resultData);
      } else {
        console.warn('No valid Answer in response:', resultData);
        setClientDnsResult({ 
          Question: [{ name: dnsLookupHost, type: dnsLookupType }], 
          Answer: [],
          Status: resultData?.Status || 3 // Non-Existent Domain
        });
      }
    } catch (err) {
      console.error('Client DNS lookup error:', err);
      setErrorClientDns(
        err.message ||
          'Error performing client DNS test. Check connection or try another host.'
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
        DNS Tests
      </h2>
      <p className="text-sm text-gray-600 mb-3 text-center">
        Tests DNS servers and records. Includes tests from the diagnostic server and client device.
      </p>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-purple-50 p-4 rounded-md shadow-sm">
          <h3 className="text-xl font-medium text-purple-800 mb-2">
            Diagnostic Server DNS Servers
          </h3>
          <p className="text-sm text-gray-600 mb-3">
            These are the DNS servers used by the application server.
          </p>
          <button
            onClick={handleGetDnsServers}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-md shadow-md transition duration-300 ease-in-out flex items-center justify-center"
            disabled={loadingDnsServers}
          >
            {loadingDnsServers ? <Spinner /> : 'Show DNS Servers'}
          </button>
          {errorDnsServers && (
            <p className="text-red-500 mt-2">Error: {errorDnsServers}</p>
          )}
          {dnsServersResult && (
            <div className="mt-4 bg-gray-50 p-2 rounded-md text-sm overflow-auto max-h-48">
              <p>
                <strong>Servers:</strong>
              </p>
              <ul className="list-disc list-inside ml-4">
                {dnsServersResult.servers.map((server, index) => (
                  <li key={index}>{server}</li>
                ))}
              </ul>
              <p className="text-xs text-gray-500 mt-2">
                Updated: {new Date(dnsServersResult.timestamp).toLocaleTimeString()}
              </p>
            </div>
          )}
        </div>

        <div className="bg-yellow-50 p-4 rounded-md shadow-sm">
          <h3 className="text-xl font-medium text-yellow-800 mb-2">
            DNS Lookup (Server & Client)
          </h3>
          <div className="space-y-3">
            <div>
              <label htmlFor="dnsHost" className="block text-sm font-medium text-gray-700">
                Host:
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
                Record Type:
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
                {loadingDnsLookup ? <Spinner /> : 'Run DNS Lookup (Server)'}
              </button>
              <button
                onClick={handleRunClientDns}
                className="w-full bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 px-4 rounded-md shadow-md transition duration-300 ease-in-out flex items-center justify-center"
                disabled={loadingClientDns}
              >
                {loadingClientDns ? <Spinner /> : 'Run DNS Lookup (Client)'}
              </button>
            </div>
          </div>
          {errorDnsLookup && (
            <p className="text-red-500 mt-2">Error: {errorDnsLookup}</p>
          )}
          {dnsLookupResult && (
            <div className="mt-4 bg-gray-50 p-2 rounded-md text-sm overflow-auto max-h-48">
              <p>
                <strong>Host:</strong> {dnsLookupResult.host}
              </p>
              <p>
                <strong>Type:</strong> {dnsLookupResult.type}
              </p>
              <p>
                <strong>Records (Server):</strong>
              </p>
              <ul className="list-disc list-inside ml-4">
                {dnsLookupResult.records.map((record, index) => (
                  <li key={index}>{typeof record === 'object' ? JSON.stringify(record) : record}</li>
                ))}
              </ul>
              <p className="text-xs text-gray-500 mt-2">
                Updated: {new Date(dnsLookupResult.timestamp).toLocaleTimeString()}
              </p>
            </div>
          )}
          {errorClientDns && (
            <p className="text-red-500 mt-2">Error: {errorClientDns}</p>
          )}
          {clientDnsResult && (
            <div className="mt-4 bg-gray-50 p-2 rounded-md text-sm overflow-auto max-h-48">
              {/* ИСПРАВЛЕНИЕ 3: Улучшенное отображение результатов */}
              <p>
                <strong>Status:</strong> {clientDnsResult.Status} ({getDnsStatusText(clientDnsResult.Status)})
              </p>
              <p>
                <strong>Host:</strong> {clientDnsResult.Question?.[0]?.name || dnsLookupHost}
              </p>
              <p>
                <strong>Type:</strong> {clientDnsResult.Question?.[0]?.type || dnsLookupType}
              </p>
              
              <p>
                <strong>Records (Client):</strong>
              </p>
              <ul className="list-disc list-inside ml-4">
                {clientDnsResult.Answer?.length > 0 ? (
                  clientDnsResult.Answer.map((record, index) => (
                    <li key={index}>
                      {record.data || record.name} 
                      <span className="text-xs text-gray-500 ml-2">(TTL: {record.TTL})</span>
                    </li>
                  ))
                ) : (
                  <li>No DNS records found</li>
                )}
              </ul>
              <p className="text-xs text-gray-500 mt-2">
                Updated: {new Date().toLocaleTimeString()}
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default DnsTests;
