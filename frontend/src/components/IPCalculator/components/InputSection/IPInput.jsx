import React from 'react';

const IPInput = ({ value, onChange, error }) => {
  return (
    <div>
      <label htmlFor="ip-address" className="block text-sm font-medium text-gray-700 mb-1">
        IP Address
      </label>
      <input
        type="text"
        id="ip-address"
        className={`input-field ${error ? 'border-red-500 focus:ring-red-500' : ''}`}
        placeholder="e.g., 192.168.1.0"
        value={value}
        onChange={onChange}
        aria-invalid={!!error}
        aria-describedby={error ? "ip-address-error" : undefined}
      />
      {error && <p id="ip-address-error" className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
};

export default IPInput;
