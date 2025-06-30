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
    setResult(null);

    try {
      const response = await api.getWhois({ host });
      setResult(response.data);
      if (onResult) onResult(response.data);
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'WHOIS lookup failed');
      if (onResult) onResult({ error: err.message });
    } finally {
      setLoading(false);
    }
  };

  const groupInfo = (data) => {
    const groups = {
      dates: [],
      contacts: [],
      network: [],
      other: []
    };

    const dateFields = ['Updated Date', 'Created Date', 'Expires Date'];
    const contactFields = ['Registrar', 'Organization', 'Registrant', 'Abuse Contact'];
    const networkFields = ['IP Range', 'Network Name', 'Country', 'ASN', 'Name Servers'];

    [...(data.summary || []), ...(data.details || [])].forEach(item => {
      if (!item.value || item.value === 'N/A') return;
      
      if (dateFields.includes(item.key)) {
        groups.dates.push(item);
      } else if (contactFields.includes(item.key)) {
        groups.contacts.push(item);
      } else if (networkFields.includes(item.key)) {
        groups.network.push(item);
      } else {
        groups.other.push(item);
      }
    });

    return groups;
  };

  const renderInfoGroup = (title, items) => {
    if (!items || items.length === 0) return null;

    const groupIcons = {
      'Dates': '📅',
      'Contacts': '👤',
      'Network Info': '🌐',
      'Additional Info': 'ℹ️'
    };

    return (
      <div className="mb-6">
        <h4 className="text-lg font-semibold text-purple-600 mb-3 border-b pb-2 flex items-center">
          <span className="mr-2 text-xl">{groupIcons[title] || '•'}</span>
          {title}
        </h4>
        <ul className="space-y-2">
          {items.map((item, index) => (
            <li key={index} className="flex flex-col sm:flex-row sm:items-start">
              <span className="w-48 flex-shrink-0 text-gray-700 font-medium">
                {item.key}:
              </span>
              <span className="flex-grow text-gray-900 break-words">
                {item.key.includes('Contact') && item.value.includes('@') ? (
                  <a 
                    href={`mailto:${item.value}`} 
                    className="text-blue-600 hover:underline flex items-center"
                  >
                    <span className="mr-1">✉️</span> {item.value}
                  </a>
                ) : item.key === 'Name Servers' ? (
                  <div className="flex flex-col">
                    {item.value.split(', ').map((ns, i) => (
                      <span key={i} className="font-mono text-sm flex items-center">
                        <span className="mr-2">🔗</span> {ns}
                      </span>
                    ))}
                  </div>
                ) : item.key === 'ASN' ? (
                  <span className="font-mono bg-blue-50 px-2 py-1 rounded text-sm">
                    {item.value}
                  </span>
                ) : (
                  item.value
                )}
              </span>
            </li>
          ))}
        </ul>
      </div>
    );
  };

  return (
    <section className="diagnostic-card">
      <h2 className="text-2xl font-semibold text-purple-700 mb-6 text-center">
        WHOIS Lookup
      </h2>

      <div className="flex gap-2 mb-6">
        <input
          type="text"
          value={host}
          onChange={(e) => setHost(e.target.value)}
          placeholder="Enter domain or IP (e.g., google.com)"
          className="input-field flex-grow"
          onKeyPress={(e) => e.key === 'Enter' && handleLookup()}
        />
        <button
          onClick={handleLookup}
          disabled={loading || !host.trim()}
          className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed min-w-[140px]"
        >
          {loading ? (
            <span className="flex items-center justify-center">
              <span className="loading-spinner mr-2"></span>
              Looking up...
            </span>
          ) : 'Lookup WHOIS'}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6">
          <div className="flex items-center">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span className="font-medium">Error:</span>
            <span className="ml-1">{error}</span>
          </div>
        </div>
      )}

      {result && (
        <div className="space-y-4">
          <div className="text-center">
            <h3 className="text-xl font-semibold text-purple-700 mb-2">
              WHOIS Results for <span className="text-primary-600">{result.host}</span>
            </h3>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
            {result.data && (
              <>
                {renderInfoGroup('Dates', groupInfo(result.data).dates)}
                {renderInfoGroup('Contacts', groupInfo(result.data).contacts)}
                {renderInfoGroup('Network Info', groupInfo(result.data).network)}
                
                {/* Новый раздел: IP Addresses */}
                {result.ipAddresses && result.ipAddresses.length > 0 && (
                  <div className="mb-6">
                    <h4 className="text-lg font-semibold text-purple-600 mb-3 border-b pb-2 flex items-center">
                      <span className="mr-2 text-xl">🔢</span>
                      IP Addresses
                    </h4>
                    <div className="flex flex-col">
                      {result.ipAddresses.map((ip, index) => (
                        <div key={index} className="font-mono text-sm flex items-center mb-1">
                          <span className="mr-2">•</span> {ip}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {renderInfoGroup('Additional Info', groupInfo(result.data).other)}
              </>
            )}
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-center bg-gray-50 p-4 rounded-xl border border-gray-200">
            <div className="flex items-center mb-2 sm:mb-0">
              <span className="bg-gray-200 p-2 rounded-lg mr-2">🕒</span>
              <div>
                <span className="font-medium">Timestamp:</span>
                <span className="ml-2">{new Date(result.timestamp).toLocaleString()}</span>
              </div>
            </div>
            
            <div className="flex items-center">
              <span className={`px-3 py-1 rounded-full text-sm flex items-center ${
                result.cached ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
              }`}>
                <span className="mr-1">{result.cached ? '♻️' : '🆕'}</span>
                {result.cached ? 'Cached result' : 'Fresh lookup'}
              </span>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default Whois;
