import React from 'react';

const BinaryView = ({ label, binaryValue, bitLength }) => {
  const parts = binaryValue.split('.');
  return (
    <div className="mb-2">
      <span className="font-semibold text-gray-700">{label}: </span>
      <code className="bg-gray-100 p-1 rounded-md text-sm font-mono text-gray-800 break-all">
        {parts.map((part, index) => (
          <React.Fragment key={index}>
            <span className={index < bitLength / 8 ? 'text-blue-700' : 'text-green-700'}>
              {part}
            </span>
            {index < parts.length - 1 && <span className="text-gray-500">.</span>}
          </React.Fragment>
        ))}
      </code>
    </div>
  );
};

export default BinaryView;
