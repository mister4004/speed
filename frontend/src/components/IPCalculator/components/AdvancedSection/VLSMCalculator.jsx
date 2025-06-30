import React, { useState } from 'react';
import { calculateVLSMSubnets } from '../../utils/ipCalculations';
import IPInput from '../InputSection/IPInput';
import SubnetInput from '../InputSection/SubnetInput';
import { useValidation } from '../../hooks/useValidation';
import { PlusCircle, XCircle, ChevronDown, ChevronUp } from 'lucide-react'; // Убедитесь, что lucide-react установлен

const VLSMCalculator = ({ initialIP, initialCIDR }) => {
  const [initialIp, setInitialIp] = useState(initialIP || '192.168.0.0');
  const [initialCidr, setInitialCidr] = useState(initialCIDR || '22');
  const [requiredSubnets, setRequiredSubnets] = useState([
    { id: 1, name: 'Main Office', hosts: 500 },
    { id: 2, name: 'Branch A', hosts: 200 },
    { id: 3, name: 'Branch B', hosts: 100 },
  ]);
  const [vlsmResults, setVlsmResults] = useState(null);
  const [nextId, setNextId] = useState(requiredSubnets.length + 1);
  const [isExpanded, setIsExpanded] = useState(false); // Состояние для сворачивания/разворачивания

  const { ipError, cidrError, isValidInput } = useValidation(initialIp, initialCidr, 'cidr');

  const handleAddSubnet = () => {
    setRequiredSubnets([...requiredSubnets, { id: nextId, name: '', hosts: '' }]);
    setNextId(nextId + 1);
  };

  const handleRemoveSubnet = (id) => {
    setRequiredSubnets(requiredSubnets.filter(subnet => subnet.id !== id));
  };

  const handleSubnetChange = (id, field, value) => {
    setRequiredSubnets(requiredSubnets.map(subnet =>
      subnet.id === id ? { ...subnet, [field]: value } : subnet
    ));
  };

  const handleCalculateVLSM = () => {
    if (isValidInput) {
      const cleanSubnets = requiredSubnets
        .filter(s => s.name && s.hosts !== '')
        .map(s => ({ name: s.name, hosts: parseInt(s.hosts, 10) }));

      if (cleanSubnets.length === 0) {
        setVlsmResults({ error: 'Please add at least one subnet requirement.' });
        return;
      }

      const results = calculateVLSMSubnets(initialIp, parseInt(initialCidr, 10), cleanSubnets);
      setVlsmResults(results);
    } else {
      setVlsmResults({ error: 'Please correct initial IP and CIDR errors.' });
    }
  };

  return (
    <div className="diagnostic-card">
      <div
        className="flex justify-between items-center cursor-pointer mb-4"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <h2 className="text-2xl font-bold text-gray-800">VLSM Calculator</h2>
        {isExpanded ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
      </div>

      {isExpanded && (
        <div className="flex flex-col gap-4 mt-4">
          <p className="text-gray-600">
            Design efficient subnets by dividing a network into variable-sized subnets based on host requirements.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <IPInput value={initialIp} onChange={(e) => setInitialIp(e.target.value)} error={ipError} />
            <SubnetInput value={initialCidr} onChange={(e) => setInitialCidr(e.target.value)} error={cidrError} maskMode="cidr" />
          </div>

          <h3 className="text-xl font-semibold text-gray-800 mt-4 mb-2">Subnet Requirements:</h3>
          <div className="space-y-4">
            {requiredSubnets.map((subnet) => (
              <div key={subnet.id} className="flex flex-col md:flex-row gap-4 items-end">
                <div className="flex-grow w-full">
                  <label htmlFor={`subnet-name-${subnet.id}`} className="block text-sm font-medium text-gray-700 mb-1">
                    Subnet Name
                  </label>
                  <input
                    type="text"
                    id={`subnet-name-${subnet.id}`}
                    className="input-field"
                    placeholder="e.g., Sales Dept."
                    value={subnet.name}
                    onChange={(e) => handleSubnetChange(subnet.id, 'name', e.target.value)}
                  />
                </div>
                <div className="flex-grow w-full">
                  <label htmlFor={`subnet-hosts-${subnet.id}`} className="block text-sm font-medium text-gray-700 mb-1">
                    Required Hosts
                  </label>
                  <input
                    type="number"
                    id={`subnet-hosts-${subnet.id}`}
                    className="input-field"
                    placeholder="e.g., 50"
                    value={subnet.hosts}
                    onChange={(e) => handleSubnetChange(subnet.id, 'hosts', Math.max(0, parseInt(e.target.value, 10) || 0))}
                    min="0"
                  />
                </div>
                <button
                  onClick={() => handleRemoveSubnet(subnet.id)}
                  className="btn-primary p-2 flex-shrink-0 bg-red-600 hover:bg-red-700"
                  aria-label="Remove subnet requirement"
                >
                  <XCircle size={20} />
                </button>
              </div>
            ))}
          </div>
          <button
            onClick={handleAddSubnet}
            className="btn-primary mt-4 flex items-center justify-center gap-2 w-full md:w-auto"
          >
            <PlusCircle size={20} /> Add Subnet
          </button>

          <button
            onClick={handleCalculateVLSM}
            disabled={!isValidInput || requiredSubnets.length === 0}
            className="btn-primary w-full md:w-auto mt-6"
          >
            Calculate VLSM
          </button>

          {vlsmResults && (
            <div className="mt-6 bg-gray-50 p-6 rounded-lg border border-gray-200">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">VLSM Calculation Results:</h3>
              {vlsmResults.error ? (
                <p className="text-red-600">{vlsmResults.error}</p>
              ) : (
                <div className="space-y-4">
                  {vlsmResults.subnets.map((subnet, index) => (
                    <div key={index} className="border-b pb-4 last:border-b-0">
                      <p className="font-medium text-lg text-primary-700 mb-2">{subnet.name}</p>
                      <ul className="text-sm text-gray-700 space-y-1">
                        <li>Network: <code className="bg-gray-100 p-0.5 rounded">{subnet.network}/{subnet.cidr}</code></li>
                        <li>Mask: <code className="bg-gray-100 p-0.5 rounded">{subnet.subnetMask}</code></li>
                        <li>Host Range: <code className="bg-gray-100 p-0.5 rounded">{subnet.hostRange}</code></li>
                        <li>Usable Hosts: <code className="bg-gray-100 p-0.5 rounded">{subnet.usableHosts.toLocaleString()}</code></li>
                        <li>Broadcast: <code className="bg-gray-100 p-0.5 rounded">{subnet.broadcast}</code></li>
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

export default VLSMCalculator;
