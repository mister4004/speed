import { useState, useMemo } from 'react';
import { calculateSubnetDetails } from '../utils/ipCalculations';
import { useValidation } from './useValidation';
import { useLocalStorage } from './useLocalStorage';

export const useIPCalculator = () => {
  const [ip, setIp] = useLocalStorage('ipcalc_ip', '192.168.1.0');
  const [cidr, setCidr] = useLocalStorage('ipcalc_cidr', '24');
  const [maskMode, setMaskMode] = useLocalStorage('ipcalc_maskMode', 'cidr'); // 'cidr' or 'mask'

  const { ipError, cidrError, isValidInput } = useValidation(ip, cidr, maskMode);

  const results = useMemo(() => {
    if (isValidInput) {
      return calculateSubnetDetails(ip, cidr);
    }
    return null;
  }, [ip, cidr, isValidInput]);

  const handleIpChange = (e) => {
    setIp(e.target.value);
  };

  const handleCidrChange = (e) => {
    setCidr(e.target.value);
  };

  const handleMaskModeToggle = () => {
    setMaskMode(prevMode => (prevMode === 'cidr' ? 'mask' : 'cidr'));
  };

  const clearInputs = () => {
    setIp('');
    setCidr('');
  };

  return {
    ip,
    setIp, // Expose setIp for advanced sections
    cidr,
    setCidr, // Expose setCidr for advanced sections
    maskMode,
    handleIpChange,
    handleCidrChange,
    handleMaskModeToggle,
    clearInputs,
    ipError,
    cidrError,
    isValidInput,
    results,
  };
};
