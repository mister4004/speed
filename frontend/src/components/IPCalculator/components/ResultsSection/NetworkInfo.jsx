import React from 'react';

const NetworkInfo = ({ details }) => {
  if (!details) {
    return null; // Или placeholder, если нет деталей
  }

  return (
    <div className="bg-white p-6 rounded-2xl shadow-inner-light">
      <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
        <span className="mr-2">Network Details</span>
      </h3>
      <div className="space-y-2">
        <p className="text-gray-700">
          <span className="font-medium">Network Address:</span> {details.networkAddress}
        </p>
        <p className="text-gray-700">
          <span className="font-medium">Subnet Mask:</span> {details.subnetMask}
        </p>
        <p className="text-gray-700">
          <span className="font-medium">Broadcast Address:</span> {details.broadcastAddress}
        </p>
        <p className="text-gray-700">
          <span className="font-medium">Wildcard Mask:</span> {details.wildcardMask}
        </p>
        <p className="text-gray-700">
          <span className="font-medium">Network Class:</span> {details.networkClass}
        </p>
        <p className={`text-gray-700 ${details.isPrivate ? 'text-warning-700' : 'text-success-700'}`}>
          <span className="font-medium">Type:</span> {details.isPrivate ? 'Private IP' : 'Public IP'}
        </p>
      </div>
    </div>
  );
};

export default NetworkInfo;
