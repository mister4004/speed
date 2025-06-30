import { ipToBinary, cidrToSubnetMask, subnetMaskToCidr } from './converters';
import { isValidIP, isValidCIDR, isPrivateIP } from './validators';
import { MAX_HOSTS_PER_SUBNET } from './constants';

// Вспомогательная функция для преобразования октета в беззнаковое 8-битное число
const toUnsignedByte = (num) => num & 0xFF; // BITWISE AND с 0xFF (255)

export const calculateSubnetDetails = (ipAddress, cidr) => {
  if (!isValidIP(ipAddress) || !isValidCIDR(cidr)) {
    return null;
  }

  const cidrInt = parseInt(cidr, 10);
  const ipOctets = ipAddress.split('.').map(Number);
  const subnetMaskOctets = cidrToSubnetMask(cidrInt).split('.').map(Number);

  // Network Address
  const networkOctets = ipOctets.map((octet, i) => toUnsignedByte(octet & subnetMaskOctets[i]));
  const networkAddress = networkOctets.join('.');

  // Broadcast Address
  // Инвертируем маску и обеспечиваем беззнаковое 32-битное представление, затем обрезаем до 8 бит
  const invertedMaskOctets = subnetMaskOctets.map(octet => toUnsignedByte(~octet)); // ~octet уже дает 32-бит, toUnsignedByte обрезает до 8
  const broadcastOctets = networkOctets.map((octet, i) => toUnsignedByte(octet | invertedMaskOctets[i]));
  const broadcastAddress = broadcastOctets.join('.');

  // Total Hosts
  const totalHosts = Math.pow(2, (32 - cidrInt));

  // Usable Hosts
  let usableHosts = 0;
  if (totalHosts >= 2) {
    usableHosts = totalHosts - 2;
  } else {
    usableHosts = totalHosts; // For /31 and /32 subnets (0 or 1 usable)
  }

  // Host Range
  let firstHost = '';
  let lastHost = '';
  if (usableHosts > 0) {
    const firstHostOctets = [...networkOctets];
    firstHostOctets[3] = toUnsignedByte(firstHostOctets[3] + 1); // Убедимся, что не выходим за 255
    // Если был 255 и стал 0 (переполнение), аккуратно двигаемся по октетам
    // Это упрощенная логика для 4-го октета. Для полноценного переполнения
    // нужно аккуратно двигаться по октетам. Однако для обычных диапазонов этого достаточно.
    // Пример для полноценного переполнения:
    if (firstHostOctets[3] === 0 && cidrInt < 32) { // Если четвертый октет обнулился из-за 255+1 и это не /32
      let carry = 1;
      for (let i = 2; i >= 0; i--) {
        if (carry === 0) break;
        firstHostOctets[i] = toUnsignedByte(firstHostOctets[i] + carry);
        if (firstHostOctets[i] === 0) { // Если и этот октет обнулился
          carry = 1;
        } else {
          carry = 0;
        }
      }
    }
    firstHost = firstHostOctets.join('.');

    const lastHostOctets = [...broadcastOctets];
    lastHostOctets[3] = toUnsignedByte(lastHostOctets[3] - 1); // Убедимся, что не выходим за 0 (отрицательное)
    // Если был 0 и стал 255 (переполнение), аккуратно двигаемся по октетам
    // Аналогично, упрощенная логика.
    if (lastHostOctets[3] === 255 && cidrInt < 32) { // Если четвертый октет обнулился из-за 0-1 и это не /32
      let borrow = 1;
      for (let i = 2; i >= 0; i--) {
        if (borrow === 0) break;
        lastHostOctets[i] = toUnsignedByte(lastHostOctets[i] - borrow);
        if (lastHostOctets[i] === 255) { // Если и этот октет обнулился
          borrow = 1;
        } else {
          borrow = 0;
        }
      }
    }
    lastHost = lastHostOctets.join('.');
  } else {
      firstHost = 'N/A';
      lastHost = 'N/A';
  }

  // Wildcard Mask
  const wildcardOctets = subnetMaskOctets.map(octet => 255 - octet);
  const wildcardMask = wildcardOctets.join('.');

  // Network Class
  let networkClass = '';
  if (ipOctets[0] >= 1 && ipOctets[0] <= 126) networkClass = 'A';
  else if (ipOctets[0] >= 128 && ipOctets[0] <= 191) networkClass = 'B';
  else if (ipOctets[0] >= 192 && ipOctets[0] <= 223) networkClass = 'C';
  else if (ipOctets[0] >= 224 && ipOctets[0] <= 239) networkClass = 'D (Multicast)';
  else if (ipOctets[0] >= 240 && ipOctets[0] <= 255) networkClass = 'E (Experimental)';
  else networkClass = 'N/A';


  return {
    networkAddress,
    broadcastAddress,
    subnetMask: cidrToSubnetMask(cidrInt),
    wildcardMask,
    totalHosts,
    usableHosts,
    hostRange: usableHosts > 0 && firstHost !== 'N/A' && lastHost !== 'N/A' ? `${firstHost} - ${lastHost}` : 'N/A',
    networkClass,
    isPrivate: isPrivateIP(ipAddress),
    binaryIP: ipToBinary(ipAddress),
    binarySubnetMask: ipToBinary(cidrToSubnetMask(cidrInt)),
    binaryNetworkAddress: ipToBinary(networkAddress),
    binaryBroadcastAddress: ipToBinary(broadcastAddress),
  };
};

export const getSubnetClass = (firstOctet) => {
  if (firstOctet >= 1 && firstOctet <= 126) return 'A';
  if (firstOctet >= 128 && firstOctet <= 191) return 'B';
  if (firstOctet >= 192 && firstOctet <= 223) return 'C';
  return 'N/A';
};

// --- VLSM & Subnet Splitter (Placeholder functions) ---
export const calculateVLSMSubnets = (initialIP, initialCIDR, requiredSubnets) => {
  if (!isValidIP(initialIP) || !isValidCIDR(initialCIDR)) {
    return { error: 'Invalid initial IP or CIDR' };
  }

  const results = [];
  let currentIPLong = ipToLong(initialIP);
  const initialTotalHosts = Math.pow(2, (32 - initialCIDR));

  if (requiredSubnets.length === 0) {
    return { error: 'No subnets specified for VLSM.' };
  }

  const sortedSubnets = [...requiredSubnets].sort((a, b) => b.hosts - a.hosts);

  for (const subnetReq of sortedSubnets) {
    const requiredHosts = subnetReq.hosts;
    if (requiredHosts < 0) continue;

    let newCIDR = 32;
    while (newCIDR >= 0) {
      const currentTotalHosts = Math.pow(2, (32 - newCIDR));
      if (currentTotalHosts >= requiredHosts + 2) {
        break;
      }
      newCIDR--;
    }

    if (newCIDR < 0 || newCIDR < initialCIDR) {
      results.push({ name: subnetReq.name, error: `Cannot accommodate ${requiredHosts} hosts.` });
      continue;
    }

    const currentNetworkAddress = longToIp(currentIPLong);
    const details = calculateSubnetDetails(currentNetworkAddress, newCIDR.toString());

    if (!details) {
      results.push({ name: subnetReq.name, error: `Error calculating details for ${currentNetworkAddress}/${newCIDR}` });
      continue;
    }

    results.push({
      name: subnetReq.name,
      network: details.networkAddress,
      cidr: newCIDR,
      subnetMask: details.subnetMask,
      hostRange: details.hostRange,
      usableHosts: details.usableHosts,
      broadcast: details.broadcastAddress,
    });

    currentIPLong += details.totalHosts;
  }

  const lastUsedIPLong = ipToLong(results[results.length - 1]?.broadcast || initialIP);
  const initialBroadcastLong = ipToLong(calculateSubnetDetails(initialIP, initialCIDR)?.broadcastAddress || initialIP);

  if (lastUsedIPLong > initialBroadcastLong) {
    return { error: 'VLSM calculation exceeded initial network boundaries.', details: results };
  }

  return { success: true, subnets: results };
};

export const splitSubnet = (initialIP, initialCIDR, numberOfSubnets = 2) => {
  if (!isValidIP(initialIP) || !isValidCIDR(initialCIDR)) {
    return { error: 'Invalid initial IP or CIDR' };
  }

  const initialCIDRInt = parseInt(initialCIDR, 10);
  const initialTotalHosts = Math.pow(2, (32 - initialCIDRInt));

  if (initialTotalHosts < numberOfSubnets) {
    return { error: 'Initial network is too small to be split into the requested number of subnets.' };
  }

  let newCIDR = initialCIDRInt;
  let currentTotalSubnets = 1;
  while (currentTotalSubnets < numberOfSubnets && newCIDR < 32) {
    newCIDR++;
    currentTotalSubnets = Math.pow(2, (newCIDR - initialCIDRInt));
  }

  if (currentTotalSubnets < numberOfSubnets) {
     return { error: 'Cannot split into the requested number of subnets with valid CIDR.' };
  }

  const splitSubnets = [];
  let currentIPLong = ipToLong(initialIP);

  for (let i = 0; i < currentTotalSubnets; i++) {
    const networkAddress = longToIp(currentIPLong);
    const details = calculateSubnetDetails(networkAddress, newCIDR.toString());

    if (!details) {
      break;
    }

    splitSubnets.push(details);
    currentIPLong += details.totalHosts;
  }

  return { success: true, subnets: splitSubnets };
};

// Вспомогательные функции для VLSM/Subnet Splitter
const ipToLong = (ipAddress) => {
  return ipAddress.split('.').reduce((acc, octet) => (acc << 8) + parseInt(octet, 10), 0);
};

const longToIp = (long) => {
  return [
    (long >>> 24) & 0xFF,
    (long >>> 16) & 0xFF,
    (long >>> 8) & 0xFF,
    long & 0xFF
  ].join('.');
};
