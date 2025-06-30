import React from 'react';
import { useIPCalculator } from './hooks/useIPCalculator';
import { RotateCcw } from 'lucide-react';

// Input Section
import IPInput from './components/InputSection/IPInput';
import SubnetInput from './components/InputSection/SubnetInput';
import FormatToggle from './components/InputSection/FormatToggle';

// Results Section
import NetworkInfo from './components/ResultsSection/NetworkInfo';
import HostRange from './components/ResultsSection/HostRange';
import BinaryView from './components/ResultsSection/BinaryView';
import VisualSubnet from './components/ResultsSection/VisualSubnet';

// Advanced Section
import VLSMCalculator from './components/AdvancedSection/VLSMCalculator';
import SubnetSplitter from './components/AdvancedSection/SubnetSplitter';
import RouteTable from './components/AdvancedSection/RouteTable';

// Help Section
import Tutorial from './components/HelpSection/Tutorial';
import Examples from './components/HelpSection/Examples';
import Tooltips from './components/HelpSection/Tooltips';

// UI Components
import Collapsible from './UI/Collapsible';

const IPCalculator = () => {
  const {
    ip,
    setIp,
    cidr,
    setCidr,
    maskMode,
    handleIpChange,
    handleCidrChange,
    handleMaskModeToggle,
    clearInputs,
    ipError,
    cidrError,
    isValidInput,
    results,
  } = useIPCalculator();

  const handleApplyExample = (exampleIp, exampleCidr) => {
    setIp(exampleIp);
    setCidr(exampleCidr);
  };

  return (
    <div className="diagnostic-card flex flex-col gap-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-800 mb-2">IP Subnet Calculator</h1>
        <p className="text-lg text-gray-600">
          Calculate network details, manage subnets with VLSM, and split networks efficiently.
        </p>
      </div>

      {/* Collapsible Calculator Section */}
      <Collapsible title="IP Calculator">
        {/* Main Input Section */}
        <div className="bg-white p-6 rounded-2xl shadow-inner-light">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <IPInput value={ip} onChange={handleIpChange} error={ipError} />
            <SubnetInput value={cidr} onChange={handleCidrChange} error={cidrError} maskMode={maskMode} />
          </div>
          <div className="flex justify-between items-center flex-wrap gap-4">
            <FormatToggle maskMode={maskMode} onToggle={handleMaskModeToggle} />
            <button
              onClick={clearInputs}
              className="btn-primary bg-gray-200 text-gray-700 hover:bg-gray-300 flex items-center justify-center gap-2"
            >
              <RotateCcw size={18} /> Clear
            </button>
          </div>
        </div>

        {/* Results Section */}
        {isValidInput && results && (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <NetworkInfo details={results} />
              <HostRange hostRange={results.hostRange} usableHosts={results.usableHosts} totalHosts={results.totalHosts} />
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-inner-light">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">Binary Representation</h3>
              <BinaryView label="IP Address" binaryValue={results.binaryIP} bitLength={32} />
              <BinaryView label="Subnet Mask" binaryValue={results.binarySubnetMask} bitLength={parseInt(cidr, 10)} />
              <BinaryView label="Network Address" binaryValue={results.binaryNetworkAddress} bitLength={parseInt(cidr, 10)} />
              <BinaryView label="Broadcast Address" binaryValue={results.binaryBroadcastAddress} bitLength={parseInt(cidr, 10)} />
              <VisualSubnet cidr={cidr} binaryIP={results.binaryIP} binarySubnetMask={results.binarySubnetMask} />
            </div>
          </>
        )}

        {/* Advanced Tools Section */}
        <div className="flex flex-col gap-8">
          <Collapsible title="Advanced Tools" defaultOpen={true}>
            <VLSMCalculator initialIP={ip} initialCIDR={cidr} />
            <SubnetSplitter initialIP={ip} initialCIDR={cidr} />
            <RouteTable />
          </Collapsible>
        </div>
      </Collapsible>

      {/* Help and Examples Section */}
      <Collapsible title="Help & Examples" defaultOpen={true}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Tutorial />
          <Examples onApplyExample={handleApplyExample} />
        </div>
        <Tooltips />
      </Collapsible>
    </div>
  );
};

export default IPCalculator;
