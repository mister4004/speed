import React from 'react';

const VisualSubnet = ({ cidr, binaryIP, binarySubnetMask }) => {
  if (!cidr || !binaryIP || !binarySubnetMask) return null;

  const cidrInt = parseInt(cidr, 10);
  const totalBits = 32;
  const networkBits = cidrInt;
  const hostBits = totalBits - cidrInt;

  const ipParts = binaryIP.split('.');
  const maskParts = binarySubnetMask.split('.');

  return (
    <div className="bg-white p-6 rounded-2xl shadow-inner-light mt-4">
      <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
        <span className="mr-2">Visual Bit Representation</span>
      </h3>
      <div className="flex flex-wrap text-xs font-mono select-none">
        {ipParts.map((octet, octetIndex) => (
          <React.Fragment key={octetIndex}>
            {octet.split('').map((bit, bitIndex) => {
              const globalBitIndex = octetIndex * 8 + bitIndex;
              const isNetworkBit = globalBitIndex < networkBits;
              return (
                <span
                  key={`${octetIndex}-${bitIndex}`}
                  className={`
                    w-4 h-5 flex items-center justify-center
                    ${isNetworkBit ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}
                    ${bitIndex === 0 && octetIndex > 0 ? 'ml-2' : ''} /* Отступ между октетами */
                    rounded-sm
                  `}
                  title={isNetworkBit ? 'Network Bit' : 'Host Bit'}
                >
                  {bit}
                </span>
              );
            })}
            {octetIndex < 3 && (
              <span className="w-4 h-5 flex items-center justify-center text-gray-500">.</span>
            )}
          </React.Fragment>
        ))}
      </div>
      <div className="mt-2 text-sm text-gray-600">
        <span className="inline-block w-3 h-3 bg-blue-100 rounded-sm mr-1 border border-blue-200"></span> Network Bits ({networkBits})
        <span className="inline-block w-3 h-3 bg-green-100 rounded-sm ml-4 mr-1 border border-green-200"></span> Host Bits ({hostBits})
      </div>
    </div>
  );
};

export default VisualSubnet;
