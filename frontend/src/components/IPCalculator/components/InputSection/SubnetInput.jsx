import React from 'react';

const SubnetInput = ({ value, onChange, error, maskMode }) => {
  const placeholder = maskMode === 'cidr' ? 'e.g., 24' : 'e.g., 255.255.255.0';
  const label = maskMode === 'cidr' ? 'CIDR' : 'Subnet Mask';
  const inputType = maskMode === 'cidr' ? 'number' : 'text'; // Используем text для маски, чтобы пользователь мог вводить точки

  return (
    <div>
      <label htmlFor="subnet-mask" className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      <input
        type={inputType}
        id="subnet-mask"
        className={`input-field ${error ? 'border-red-500 focus:ring-red-500' : ''}`}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        aria-invalid={!!error}
        aria-describedby={error ? "subnet-mask-error" : undefined}
        min={inputType === 'number' ? "0" : undefined}
        max={inputType === 'number' ? "32" : undefined}
      />
      {error && <p id="subnet-mask-error" className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
};

export default SubnetInput;
