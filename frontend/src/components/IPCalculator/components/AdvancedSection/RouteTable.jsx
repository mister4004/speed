import React from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react'; // Убедитесь, что lucide-react установлен

const RouteTable = () => {
  const [isExpanded, setIsExpanded] = React.useState(false);

  return (
    <div className="diagnostic-card">
      <div
        className="flex justify-between items-center cursor-pointer mb-4"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <h2 className="text-2xl font-bold text-gray-800">Route Table Generator (Future Feature)</h2>
        {isExpanded ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
      </div>

      {isExpanded && (
        <div className="flex flex-col gap-4 mt-4">
          <p className="text-gray-600">
            This section will eventually allow generating basic routing table entries based on subnet calculations.
            (e.g., for Cisco, Juniper, or Linux).
          </p>
          <div className="bg-yellow-50 border-l-4 border-yellow-400 text-yellow-800 p-4 rounded" role="alert">
            <p className="font-bold">Coming Soon!</p>
            <p>This feature is under development and will be available in future updates.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default RouteTable;
