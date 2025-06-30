import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

const Collapsible = ({ title, children, defaultOpen = true }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="w-full mb-6">
      <button
        className="w-full flex justify-between items-center p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100 hover:border-blue-300 transition-all"
        onClick={() => setIsOpen(!isOpen)}
      >
        <h2 className="text-xl font-bold text-gray-800">{title}</h2>
        {/* Иконка теперь справа */}
        {isOpen ? 
          <ChevronUp size={24} className="text-blue-500 ml-2" /> : 
          <ChevronDown size={24} className="text-blue-500 ml-2" />
        }
      </button>
      
      {isOpen && (
        <div className="mt-4 space-y-6">
          {children}
        </div>
      )}
    </div>
  );
};

export default Collapsible;
