import React, { useState } from 'react';
import ClientInfo from './components/ClientInfo';
import HttpPing from './components/HttpPing';
import DnsTests from './components/DnsTests';
import SpeedTest from './components/SpeedTest';
import PortsScan from './components/PortsScan';
import Whois from './components/Whois';
import MacLookup from './components/MacLookup';
import Traceroute from './components/Traceroute';
import IPCalculator from './components/IPCalculator/IPCalculator';
import NetworkUnitConverter from './components/NetworkUnitConverter';
import './App.css';

const App = () => {
  const [results, setResults] = useState({});

  const updateResults = (key, data) => {
    setResults((prev) => ({ ...prev, [key]: data }));
  };

  return (
    <div className="min-h-screen bg-gradient-light">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-4 -right-4 w-72 h-72 bg-primary-200/30 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 -left-4 w-72 h-72 bg-success-200/30 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-4 right-1/3 w-72 h-72 bg-warning-200/30 rounded-full blur-3xl"></div>
      </div>

      <div className="relative">
        <div className="text-center pt-12 pb-8 px-4">
          <h1 className="text-5xl font-bold text-gray-800 mb-4 text-balance">
            Network Diagnostics Tool
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto text-balance">
            Comprehensive network testing and analysis platform for diagnosing connectivity issues
          </p>
        </div>

        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
          <div className="grid gap-8 lg:gap-10">
            {/* Информация о клиенте */}
            <div className="w-full">
              <ClientInfo onResult={(data) => updateResults('clientInfo', data)} />
            </div>

            {/* Конвертер сетевых величин */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-10">
              <NetworkUnitConverter />
              {/* Заглушка для будущего компонента */}
              <div className="bg-gray-100 rounded-2xl p-6 flex items-center justify-center">
                <p className="text-gray-500 text-center">
                  Additional network tools<br />coming soon...
                </p>
              </div>
            </div>

            {/* SpeedTest и PortsScan */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-10">
              <SpeedTest onResult={(data) => updateResults('speedTest', data)} />
              <PortsScan onResult={(data) => updateResults('portsScan', data)} />
            </div>

            {/* HttpPing и DnsTests */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-10">
              <HttpPing onResult={(data) => updateResults('httpPing', data)} />
              <DnsTests onResult={(data) => updateResults('dnsTests', data)} />
            </div>

            {/* Whois и MacLookup */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-10 items-stretch">
              <Whois onResult={(data) => updateResults('whois', data)} className="h-full flex flex-col" />
              <MacLookup onResult={(data) => updateResults('macLookup', data)} className="h-full flex flex-col" />
            </div>

            {/* Traceroute */}
            <div className="w-full">
              <Traceroute onResult={(data) => updateResults('traceroute', data)} />
            </div>

            {/* IP Calculator */}
            <div className="w-full">
              <IPCalculator />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
