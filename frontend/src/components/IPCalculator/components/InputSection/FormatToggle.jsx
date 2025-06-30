import React from 'react';
import { ToggleLeft, ToggleRight } from 'lucide-react'; // Убедитесь, что lucide-react установлен

const FormatToggle = ({ maskMode, onToggle }) => {
  return (
    <div
      className="flex items-center space-x-2 cursor-pointer select-none"
      onClick={onToggle}
      aria-label="Toggle between CIDR and Subnet Mask input"
    >
      {maskMode === 'cidr' ? (
        <ToggleRight size={24} className="text-primary-600" />
      ) : (
        <ToggleLeft size={24} className="text-gray-400" />
      )}
      <span className="font-medium text-gray-700">
        Input Format: {maskMode === 'cidr' ? 'CIDR (/24)' : 'Subnet Mask (255.255.255.0)'}
      </span>
    </div>
  );
};

export default FormatToggle;
