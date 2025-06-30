import React, { useState } from 'react';
import { splitSubnet } from '../../utils/ipCalculations';
import IPInput from '../InputSection/IPInput';
import SubnetInput from '../InputSection/SubnetInput';
import { useValidation } from '../../hooks/useValidation';
import { ChevronDown, ChevronUp } from 'lucide-react'; // Убедитесь, что lucide-react установлен

const SubnetSplitter = ({ initialIP, initialCIDR }) => {
  const [ip, setIp] = useState(initialIP || '192.168.1.0');
  const [cidr, setCidr] = useState(initialCIDR || '24');
  const [numberOfSubnets, setNumberOfSubnets] = useState(2);
  const [splitResults, setSplitResults] = useState(null);
  const [isExpanded, setIsExpanded] = useState(false); // Состояние для сворачивания/разворачивания

  const { ipError, cidrError, isValidInput } = useValidation(ip, cidr, 'cidr');

  const handleSplit = () => {
    if (isValidInput) {
      const results = splitSubnet(ip, parseInt(cidr, 10), parseInt(numberOfSubnets, 10));
      setSplitResults(results);
    } else {
      setSplitResults({ error: 'Please correct initial IP and CIDR errors.' });
    }
  };

  return (
    <div className="diagnostic-card">
      <div
        className="flex justify-between items-center cursor-pointer mb-4"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <h2 className="text-2xl font-bold text-gray-800">Subnet Splitter</h2>
        {isExpanded ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
      </div>

      {isExpanded && (
        <div className="flex flex-col gap-4 mt-4">
          <p className="text-gray-600">
            Divide a larger network into a specified number of smaller, equal-sized subnets.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <IPInput value={ip} onChange={(e) => setIp(e.target.value)} error={ipError} />
            <SubnetInput value={cidr} onChange={(e) => setCidr(e.target.value)} error={cidrError} maskMode="cidr" />
          </div>

          <div>
            <label htmlFor="num-subnets" className="block text-sm font-medium text-gray-700 mb-1">
              Number of Subnets to Create
            </label>
            <input
              type="number"
              id="num-subnets"
              className="input-field"
              value={numberOfSubnets}
              onChange={(e) => setNumberOfSubnets(Math.max(1, parseInt(e.target.value, 10) || 1))}
              min="1"
              max="256" // Примерное разумное ограничение
            />
          </div>

          <button
            onClick={handleSplit}
            disabled={!isValidInput}
            className="btn-primary w-full md:w-auto"
          >
            Split Subnet
          </button>

          {splitResults && (
            <div className="mt-6 bg-gray-50 p-6 rounded-lg border border-gray-200">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">Split Results:</h3>
              {splitResults.error ? (
                <p className="text-red-600">{splitResults.error}</p>
              ) : (
                <div className="space-y-4">
                  {splitResults.subnets.map((subnet, index) => (
                    <div key={index} className="border-b pb-4 last:border-b-0">
                      <p className="font-medium text-lg text-primary-700 mb-2">Subnet {index + 1}</p>
                      <ul className="text-sm text-gray-700 space-y-1">
                        <li>Network: <code className="bg-gray-100 p-0.5 rounded">{subnet.networkAddress}/{subnet.cidr}</code></li>
                        <li>Mask: <code className="bg-gray-100 p-0.5 rounded">{subnet.subnetMask}</code></li>
                        <li>Host Range: <code className="bg-gray-100 p-0.5 rounded">{subnet.hostRange}</code></li>
                        <li>Usable Hosts: <code className="bg-gray-100 p-0.5 rounded">{subnet.usableHosts.toLocaleString()}</code></li>
                        <li>Broadcast: <code className="bg-gray-100 p-0.5 rounded">{subnet.broadcastAddress}</code></li>
                      </ul>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SubnetSplitter;
