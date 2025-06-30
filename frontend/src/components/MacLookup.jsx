import React, { useState } from 'react';
import api from '../utils/api';

const MacLookup = () => {
  const [macAddress, setMacAddress] = useState('');
  const [vendorInfo, setVendorInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Функция для нормализации MAC-адреса
  const normalizeMac = (input) => {
    // Удаляем все не-шестнадцатеричные символы (кроме A-F, a-f, 0-9)
    let cleaned = input.replace(/[^0-9A-Fa-f]/g, '');
    
    // Форматируем MAC в стандартный вид (XX:XX:XX:XX:XX:XX)
    if (cleaned.length > 12) cleaned = cleaned.substring(0, 12);
    let formatted = '';
    for (let i = 0; i < cleaned.length; i += 2) {
      if (i > 0) formatted += ':';
      formatted += cleaned.substring(i, i + 2);
    }
    return formatted;
  };

  const handleLookup = async () => {
    // Нормализуем MAC-адрес перед проверкой
    const normalizedMac = normalizeMac(macAddress);
    
    // Проверяем длину (должно быть 12 символов после очистки)
    if (!normalizedMac || normalizedMac.replace(/:/g, '').length !== 12) {
      setError('Please enter a valid MAC Address (e.g., 00:1A:2B:3C:4D:5E)');
      setVendorInfo(null);
      return;
    }

    setLoading(true);
    setError(null);
    setVendorInfo(null);

    try {
      const response = await api.lookupMacVendor(normalizedMac);
      
      if (response.data && response.data.vendor) {
        setVendorInfo(response.data.vendor);
      } else {
        setVendorInfo('Vendor not found.');
      }
    } catch (err) {
      setError(err.message || 'Error looking up MAC address.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const input = e.target.value;
    // Нормализуем ввод сразу при изменении
    const normalized = normalizeMac(input);
    setMacAddress(normalized);
    setError(null);
  };

  const Spinner = () => (
    <div className="flex justify-center items-center">
      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
    </div>
  );

  return (
    <section className="bg-gray-50 p-6 rounded-lg shadow-md h-full flex flex-col">
      <h2 className="text-3xl font-semibold text-indigo-600 mb-4 text-center">
        MAC Address Lookup
      </h2>
      <p className="text-base text-gray-600 mb-4 text-center flex-grow">
        Enter a MAC Address to find its associated vendor.
      </p>
      <div className="mb-4">
        <label htmlFor="macAddressInput" className="sr-only">
          Enter MAC Address
        </label>
        <input
          id="macAddressInput"
          type="text"
          value={macAddress}
          onChange={handleInputChange}
          placeholder="Enter MAC Address (e.g., 00:1A:2B:3C:4D:5E)"
          className="input-field text-base"
          disabled={loading}
        />
      </div>
      <button
        onClick={handleLookup}
        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-md shadow-md transition duration-300 ease-in-out flex items-center justify-center disabled:opacity-50"
        disabled={loading}
      >
        {loading ? <Spinner /> : 'Check Vendor'}
      </button>
      {error && (
        <p className="text-red-500 mt-2 text-center text-sm">
          Error: {error}
        </p>
      )}
      {vendorInfo && (
        <p className="text-center mt-2 text-lg font-medium">
          Vendor: <strong>{vendorInfo}</strong>
        </p>
      )}
    </section>
  );
};

export default MacLookup;
