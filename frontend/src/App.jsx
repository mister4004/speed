import React, { useState } from 'react';
import ClientInfo from './components/ClientInfo';
import HttpPing from './components/HttpPing';
import DnsTests from './components/DnsTests';
import IcmpPing from './components/IcmpPing';
import Traceroute from './components/Traceroute';
import SpeedTest from './components/SpeedTest';
import PortsScan from './components/PortsScan';
import Whois from './components/Whois';
import VpnCheck from './components/VpnCheck';
import ExportResults from './components/ExportResults';
import Charts from './components/Charts';
import './App.css';

const App = () => {
  const [results, setResults] = useState({});

  const updateResults = (key, data) => {
    setResults((prev) => ({ ...prev, [key]: data }));
  };

  return (
    <div className="app">
      <h1>Network Diagnostics Tool</h1>
      <ClientInfo onResult={(data) => updateResults('clientInfo', data)} />
      <HttpPing onResult={(data) => updateResults('httpPing', data)} />
      <DnsTests onResult={(data) => updateResults('dnsTests', data)} />
      <IcmpPing onResult={(data) => updateResults('icmpPing', data)} />
      <Traceroute onResult={(data) => updateResults('traceroute', data)} />
      <SpeedTest onResult={(data) => updateResults('speedTest', data)} />
      <PortsScan onResult={(data) => updateResults('portsScan', data)} />
      <Whois onResult={(data) => updateResults('whois', data)} />
      <VpnCheck onResult={(data) => updateResults('vpnCheck', data)} />
      <Charts results={results} />
      <ExportResults results={results} />
    </div>
  );
};

export default App;
