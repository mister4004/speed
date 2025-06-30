import { useState, useEffect } from 'react';
import { isValidIP, isValidCIDR } from '../utils/validators';

export const useValidation = (ip, cidr, mode) => {
  const [ipError, setIpError] = useState('');
  const [cidrError, setCidrError] = useState('');

  useEffect(() => {
    // Validate IP
    if (ip === '') {
      setIpError('IP address is required');
    } else if (!isValidIP(ip)) {
      setIpError('Invalid IP address format');
    } else {
      setIpError('');
    }
  }, [ip]);

  useEffect(() => {
    // Validate CIDR (only if mode is 'cidr' or for VLSM/Subnet Splitter)
    if (mode === 'cidr') {
      if (cidr === '') {
        setCidrError('CIDR is required');
      } else if (!isValidCIDR(cidr)) {
        setCidrError('CIDR must be between 0 and 32');
      } else {
        setCidrError('');
      }
    } else {
      setCidrError(''); // Clear error if not in CIDR mode
    }
  }, [cidr, mode]);

  const isValidInput = !ipError && !cidrError && isValidIP(ip) && isValidCIDR(cidr);

  return { ipError, cidrError, isValidInput };
};
