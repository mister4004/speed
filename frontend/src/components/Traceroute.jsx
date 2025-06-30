import React, { useState, useEffect, useRef } from 'react';

const Traceroute = () => {
  const [tracerouteHost, setTracerouteHost] = useState('google.com');
  const [tracerouteMaxHops, setTracerouteMaxHops] = useState(15);
  const [tracerouteResultHops, setTracerouteResultHops] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [statusMessage, setStatusMessage] = useState('');
  const wsRef = useRef(null);

  const validateHost = (host) => {
    const hostRegex = /^(?:(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}|(?:\d{1,3}\.){3}\d{1,3})$/;
    return hostRegex.test(host);
  };

  useEffect(() => {
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  const handleRunTraceroute = async () => {
    if (!tracerouteHost) {
      setError('Please enter a host for traceroute.');
      return;
    }
    if (!validateHost(tracerouteHost)) {
      setError('Invalid host. Please enter a domain (example.com) or IP (8.8.8.8).');
      return;
    }
    if (tracerouteMaxHops < 1 || tracerouteMaxHops > 30) {
      setError('Max hops must be between 1 and 30.');
      return;
    }

    setLoading(true);
    setError(null);
    setTracerouteResultHops([]);
    setStatusMessage('Initializing traceroute...');

    if (wsRef.current) {
      wsRef.current.close();
    }

    try {
      const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${wsProtocol}//${window.location.host}/ws/traceroute?host=${tracerouteHost}&maxHops=${tracerouteMaxHops}`;

      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        setStatusMessage('Connection established. Starting traceroute...');
      };

      wsRef.current.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === 'hop') {
          setTracerouteResultHops((prevHops) => [...prevHops, data.data]);
          setStatusMessage(`Received hop ${data.data.hop}...`);
        } else if (data.type === 'completed') {
          setStatusMessage('Traceroute completed!');
          if (data.data.cached && data.data.hops) {
            setTracerouteResultHops(data.data.hops);
            setStatusMessage('Traceroute loaded from cache.');
          }
          setLoading(false);
        } else if (data.type === 'error') {
          setError(data.message || 'WebSocket Error.');
          setLoading(false);
          setStatusMessage('Traceroute failed.');
        }
      };

      wsRef.current.onclose = () => {
        if (loading) {
          setError('WebSocket connection closed before traceroute completion.');
          setLoading(false);
          setStatusMessage('Traceroute interrupted.');
        }
      };

      wsRef.current.onerror = (wsError) => {
        console.error('WebSocket Error:', wsError);
        setError('A WebSocket error occurred. Check console for details.');
        setLoading(false);
        setStatusMessage('Connection error.');
      };

    } catch (err) {
      setError(err.message || 'Failed to establish WebSocket connection.');
      setLoading(false);
      setStatusMessage('Connection error.');
    }
  };

  const Spinner = () => (
    <div className="flex justify-center items-center">
      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
    </div>
  );

  // Функция для форматирования вывода одного хопа
  const formatHopOutput = (hop) => {
    const hasTimes = hop.times && hop.times.length > 0;
    
    // Если нет ответа
    if (!hasTimes) {
      return <span className="text-gray-500">* * * (No response)</span>;
    }

    // Вычисляем среднее время
    const avgTime = (hop.times.reduce((sum, val) => sum + val, 0) / hop.times.length).toFixed(2);
    
    // Форматируем отдельные времена
    const timesFormatted = hop.times.map(t => t.toFixed(2)).join(', ');
    
    // Определяем отображаемое имя
    const displayName = hop.hostname || hop.ip || 'Unknown';
    
    return (
      <div className="flex flex-col">
        <span className="font-medium">
          {displayName} {hop.ip && hop.ip !== hop.hostname && <span className="text-gray-600">({hop.ip})</span>}
        </span>
        <div className="text-sm text-gray-600">
          Avg: <span className="font-medium">{avgTime}ms</span> [
          <span className="text-gray-500">{timesFormatted}ms</span>]
        </div>
      </div>
    );
  };

  return (
    <section className="bg-gray-50 p-6 rounded-lg shadow-md h-full flex flex-col">
      <h2 className="text-2xl font-semibold text-indigo-600 mb-4 text-center">
        Traceroute Test (from server)
      </h2>
      <p className="text-sm text-gray-600 mb-3 text-center">
        This test performs a Traceroute from the diagnostic server to the specified host, showing intermediate nodes.
      </p>
      <div className="space-y-3 mb-4">
        <div>
          <label
            htmlFor="tracerouteHost"
            className="block text-sm font-medium text-gray-700"
          >
            Host:
          </label>
          <input
            type="text"
            id="tracerouteHost"
            value={tracerouteHost}
            onChange={(e) => setTracerouteHost(e.target.value)}
            className="input-field"
            placeholder="google.com"
            disabled={loading}
          />
        </div>
        <div>
          <label
            htmlFor="tracerouteMaxHops"
            className="block text-sm font-medium text-gray-700"
          >
            Max Hops (1-30):
          </label>
          <input
            type="number"
            id="tracerouteMaxHops"
            value={tracerouteMaxHops}
            onChange={(e) => setTracerouteMaxHops(e.target.value)}
            min="1"
            max="30"
            className="input-field"
            disabled={loading}
          />
        </div>
        <button
          onClick={handleRunTraceroute}
          className="btn-primary"
          disabled={loading}
        >
          {loading ? <Spinner /> : 'Run Traceroute'}
        </button>
      </div>

      {error && <p className="text-red-500 mt-2 text-center text-sm">Error: {error}</p>}

      {loading && statusMessage && (
        <p className="text-gray-600 mt-2 text-center text-sm">{statusMessage}</p>
      )}

      {tracerouteResultHops.length > 0 && (
        <div className="mt-4 bg-gray-100 p-4 rounded-md text-sm overflow-auto max-h-80 flex-grow">
          <p className="font-semibold mb-2">Traceroute Results:</p>
          <ul className="list-decimal list-inside ml-4 space-y-2">
            {tracerouteResultHops.map((hop, index) => (
              <li key={hop.hop || index} className="break-all">
                <div className="flex items-start">
                  <span className="font-bold min-w-[30px]">{hop.hop}:</span>
                  <div className="flex-1">
                    {formatHopOutput(hop)}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
};

export default Traceroute;
