export const ipToBinary = (ipAddress) => {
  if (!ipAddress) return '';
  return ipAddress.split('.').map(octet => {
    const num = parseInt(octet, 10);
    // Добавим проверку, чтобы убедиться, что num - это число от 0 до 255
    if (isNaN(num) || num < 0 || num > 255) {
      console.warn(`Invalid octet in ipToBinary: "${octet}". Defaulting to '00000000'.`);
      return '00000000'; // Возвращаем 8 нулей для некорректного октета
    }
    const binary = num.toString(2);
    // Использование Math.max(0, ...) гарантирует, что количество повторений не будет отрицательным
    const padding = Math.max(0, 8 - binary.length);
    return '0'.repeat(padding) + binary;
  }).join('.');
};

export const cidrToSubnetMask = (cidr) => {
  if (cidr === undefined || cidr === null || cidr < 0 || cidr > 32) {
    return '';
  }
  let mask = '';
  for (let i = 0; i < 4; i++) {
    let octet = 0;
    for (let j = 0; j < 8; j++) {
      if (cidr > 0) {
        octet = (octet << 1) | 1;
        cidr--;
      } else {
        octet = (octet << 1) | 0;
      }
    }
    mask += octet.toString(10);
    if (i < 3) {
      mask += '.';
    }
  }
  return mask;
};

export const subnetMaskToCidr = (subnetMask) => {
  if (!subnetMask) return '';
  const binaryMask = ipToBinary(subnetMask).replace(/\./g, '');
  // Возвращает количество последовательных единиц с начала
  let cidr = 0;
  for (let i = 0; i < binaryMask.length; i++) {
    if (binaryMask[i] === '1') {
      cidr++;
    } else {
      break; // Прекращаем подсчет при первой же '0'
    }
  }
  return cidr;
};
