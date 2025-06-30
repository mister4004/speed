import React from 'react';

const HostRange = ({ hostRange, usableHosts, totalHosts }) => {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-inner-light">
      <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
        <span className="mr-2">Hosts Information</span>
      </h3>
      <div className="space-y-2">
        <p className="text-gray-700">
          <span className="font-medium">Host Range:</span> {hostRange}
        </p>
        <p className="text-gray-700">
          <span className="font-medium">Usable Hosts:</span> {usableHosts.toLocaleString()}
        </p>
        <p className="text-gray-700">
          <span className="font-medium">Total Hosts:</span> {totalHosts.toLocaleString()}
        </p>
      </div>
    </div>
  );
};

export default HostRange;
