import React, { useState } from 'react';
import api from '../utils/api.js';

const Whois = ({ onResult }) => {
  const [host, setHost] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleLookup = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.getWhois({ host });
      setResult(response);
      if (onResult) onResult(response);
    } catch (err) {
      setError(err.message);
      if (onResult) onResult({ error: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-purple-50 p-4 rounded-lg shadow-md mb-6">
      <h2 className="text-xl font-semibold text-purple-800 mb-3">WHOIS Lookup</h2>
      
      <div className="flex mb-3">
        <input
          type="text"
          value={host}
          onChange={(e) => setHost(e.target.value)}
          placeholder="Enter domain or IP (e.g., google.com)"
          className="flex-grow p-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-purple-600"
        />
        <button
          onClick={handleLookup}
          disabled={loading || !host.trim()}
          className="bg-purple-600 text-white px-4 py-2 rounded-r-md hover:bg-purple-700 disabled:bg-purple-400 transition-colors"
        >
          {loading ? 'Looking up...' : 'Lookup WHOIS'}
        </button>
      </div>
      
      {error && (
        <div className="text-red-500 bg-red-50 p-2 rounded-md mb-3">
          Error: {error}
        </div>
      )}
      
      {result && (
        <div className="mt-4">
          <h3 className="text-lg font-medium text-purple-700 mb-2">
            WHOIS Results for <span className="font-bold">{result.host}</span>
          </h3>
          
          <div className="bg-white p-3 rounded-md shadow-sm mb-3">
            <pre className="text-xs overflow-x-auto p-2 bg-gray-50 rounded">
              {result.data}
            </pre>
          </div>
          
          <div className="text-sm text-gray-600">
            <p>Timestamp: {new Date(result.timestamp).toLocaleString()}</p>
            <p>Status: {result.cached ? 'Cached result' : 'Fresh lookup'}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Whois;
