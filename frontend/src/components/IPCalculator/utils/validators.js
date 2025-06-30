import { IP_ADDRESS_REGEX, CIDR_REGEX, PRIVATE_IP_RANGES } from './constants';

export const isValidIP = (ip) => IP_ADDRESS_REGEX.test(ip);
export const isValidCIDR = (cidr) => CIDR_REGEX.test(cidr) && parseInt(cidr, 10) >= 0 && parseInt(cidr, 10) <= 32;

export const isPrivateIP = (ip) => {
  if (!isValidIP(ip)) return false;
  const ipLong = ip.split('.').reduce((acc, octet) => (acc << 8) + parseInt(octet, 10), 0);

  for (const range of PRIVATE_IP_RANGES) {
    const startLong = range.start.split('.').reduce((acc, octet) => (acc << 8) + parseInt(octet, 10), 0);
    const endLong = range.end.split('.').reduce((acc, octet) => (acc << 8) + parseInt(octet, 10), 0);
    if (ipLong >= startLong && ipLong <= endLong) {
      return true;
    }
  }
  return false;
};
