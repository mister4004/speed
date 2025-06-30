import React from 'react';
import { Info } from 'lucide-react';

const tooltipsData = [
  { title: 'CIDR (Classless Inter-Domain Routing)', description: 'A method for allocating IP addresses and IP routing. It replaces the old system of Class A, B, and C networks. A CIDR value (e.g., /24) indicates the number of bits in the IP address that represent the network portion.' },
  { title: 'Subnet Mask', description: 'A 32-bit number that masks an IP address and divides it into a network address and a host address. It works hand-in-hand with CIDR.' },
  { title: 'Network Address', description: 'The first IP address in a subnet. It identifies the network itself and cannot be assigned to a device.' },
  { title: 'Broadcast Address', description: 'The last IP address in a subnet. It is used to send data to all devices on the network simultaneously.' },
  { title: 'Usable Hosts', description: 'The number of IP addresses within a subnet that can be assigned to devices (total addresses minus network and broadcast addresses).' },
  { title: 'Wildcard Mask', description: 'The inverse of a subnet mask, commonly used in Access Control Lists (ACLs) on routers to specify a range of IP addresses.' },
];

const Tooltips = () => {
  return (
    <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
      <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
        <Info size={24} className="mr-2 text-blue-500" />
        Key Terms Explained
      </h3>
      <div className="space-y-4 text-sm text-gray-700">
        {tooltipsData.map((item, index) => (
          <div key={index} className="border-b border-gray-200 pb-3 last:border-b-0 last:pb-0">
            <p className="font-semibold text-gray-900 mb-1">{item.title}</p>
            <p>{item.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Tooltips;
