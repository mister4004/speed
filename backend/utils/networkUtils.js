import { spawn } from 'child_process';
import { promises as dns } from 'dns';
import logger from './logger.js';
import config from '../config/config.js';

class NetworkUtils {
  static async ping(host, count = 4) {
    return new Promise((resolve, reject) => {
      const sanitizedHost = host.replace(/[^a-zA-Z0-9.-]/g, '');
      const sanitizedCount = Math.min(Math.max(parseInt(count) || 4, 1), config.limits.pingCount);

      logger.info(`Starting ping to ${sanitizedHost} with count ${sanitizedCount}`);

      const isWindows = process.platform === 'win32';
      const command = 'ping';
      const args = isWindows
        ? ['-n', sanitizedCount.toString(), sanitizedHost]
        : ['-c', sanitizedCount.toString(), sanitizedHost];

      const child = spawn(command, args, {
        stdio: ['ignore', 'pipe', 'pipe'],
        timeout: config.limits.timeout,
      });

      let stdout = '';
      let stderr = '';

      child.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      child.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      child.on('close', (code) => {
        if (code === 0 || stdout) {
          resolve(this.parsePingOutput(stdout, sanitizedHost));
        } else {
          logger.error(`Ping failed for ${sanitizedHost} (code: ${code}): ${stderr}`);
          reject(new Error(`Ping failed: ${stderr || 'Unknown error'}`));
        }
      });

      child.on('error', (error) => {
        logger.error(`Ping spawn error for ${sanitizedHost}:`, error);
        reject(new Error(`Failed to execute ping: ${error.message}`));
      });
    });
  }

  static parsePingOutput(output, host) {
    const lines = output.split('\n');
    const result = {
      host,
      packets: {
        transmitted: 0,
        received: 0,
        lost: 0,
        lossPercentage: 0,
      },
      timing: {
        min: null,
        avg: null,
        max: null,
        mdev: null,
      },
      responses: [],
      timestamp: new Date().toISOString(),
    };

    lines.forEach((line) => {
      const responseMatch = line.match(/from (.*): icmp_seq=\d+ ttl=\d+ time=([0-9.]+)/);
      if (responseMatch) {
        result.responses.push({
          time: parseFloat(responseMatch[2]),
          raw: line.trim(),
        });
      }

      const packetsMatch = line.match(/(\d+) packets transmitted, (\d+) (?:packets )?received, (\d+)% packet loss/);
      if (packetsMatch) {
        result.packets.transmitted = parseInt(packetsMatch[1]);
        result.packets.received = parseInt(packetsMatch[2]);
        result.packets.lossPercentage = parseInt(packetsMatch[3]);
        result.packets.lost = result.packets.transmitted - result.packets.received;
      }

      const timingMatch = line.match(/rtt min\/avg\/max\/mdev = ([0-9.]+)\/([0-9.]+)\/([0-9.]+)\/([0-9.]+)/);
      if (timingMatch) {
        result.timing = {
          min: parseFloat(timingMatch[1]),
          avg: parseFloat(timingMatch[2]),
          max: parseFloat(timingMatch[3]),
          mdev: parseFloat(timingMatch[4]),
        };
      }
    });

    return result;
  }

  static async traceroute(host, maxHops = 30, callback = null) {
    return new Promise((resolve, reject) => {
      const sanitizedHost = host.replace(/[^a-zA-Z0-9.-]/g, '');
      const sanitizedMaxHops = Math.min(Math.max(parseInt(maxHops) || 30, 1), config.limits.tracerouteMaxHops);

      logger.info(`Starting traceroute to ${sanitizedHost} with max hops ${sanitizedMaxHops}`);

      const isWindows = process.platform === 'win32';
      const command = isWindows ? 'tracert' : 'traceroute';
      const args = isWindows
        ? ['-h', sanitizedMaxHops.toString(), sanitizedHost]
        : ['-m', sanitizedMaxHops.toString(), sanitizedHost];

      const child = spawn(command, args, {
        stdio: ['ignore', 'pipe', 'pipe'],
        timeout: config.limits.timeout * 3,
      });

      let lineBuffer = ''; // Буфер для неполных строк
      const collectedHops = []; // Для сбора всех хопов перед resolve

      child.stdout.on('data', (data) => {
        lineBuffer += data.toString();
        const lines = lineBuffer.split('\n');
        lineBuffer = lines.pop(); // Последняя строка может быть неполной, сохраняем ее в буфере

        lines.forEach((line) => {
          const hop = this.parseTracerouteLine(line, sanitizedHost);
          if (hop) {
            collectedHops.push(hop);
            if (callback) {
              callback(hop);
            }
          }
        });
      });

      child.stderr.on('data', (data) => {
        logger.warn(`Traceroute stderr for ${sanitizedHost}: ${data.toString().trim()}`);
      });

      child.on('close', (code) => {
        // Обрабатываем оставшиеся данные в буфере
        if (lineBuffer.length > 0) {
          const hop = this.parseTracerouteLine(lineBuffer, sanitizedHost);
          if (hop) {
            collectedHops.push(hop);
            if (callback) {
              callback(hop);
            }
          }
        }

        if (code === 0 || collectedHops.length > 0) {
          resolve({
            host: sanitizedHost,
            hops: collectedHops,
            timestamp: new Date().toISOString(),
          });
        } else {
          logger.error(`Traceroute failed for ${sanitizedHost} with code ${code}.`);
          reject(new Error(`Traceroute failed: Exited with code ${code}.`));
        }
      });

      child.on('error', (error) => {
        logger.error(`Traceroute spawn error for ${sanitizedHost}:`, error);
        reject(new Error(`Failed to execute traceroute: ${error.message}`));
      });
    });
  }

  static parseTracerouteLine(line, targetHost) {
    line = line.trim();
    if (!line) return null;

    const hop = {
      hop: null,
      ip: null,
      hostname: null,
      times: [],
      raw: line,
      timestamp: new Date().toISOString(),
    };

    // Regex для Unix-подобных систем (traceroute)
    // Пример: 1  gateway (192.168.1.1)   1.234 ms   1.250 ms   1.240 ms
    // Пример: 2  unn-156-146-32-140.cdn77.com (156.146.32.140)  0.449 ms  0.455 ms  0.442 ms
    // Пример: 10  * * *
    const unixRegex = /^\s*(\d+)\s+([^\s].*?)(?:\s+\(([\d.:]+)\))?\s*((?:[\d.]+\s*ms|\*)\s*(?:[\d.]+\s*ms|\*)\s*(?:[\d.]+\s*ms|\*))?$/;

    // Regex для Windows (tracert)
    // Пример: 1   <1 ms   <1 ms   <1 ms   192.168.1.1
    // Пример: 2   10 ms   12 ms   11 ms   router.isp.com [10.0.0.1]
    const windowsRegex = /^\s*(\d+)\s+([<\d\.]+\s*ms|\*)\s+([<\d\.]+\s*ms|\*)\s+([<\d\.]+\s*ms|\*)\s+([^\s]+?)(?:\s+\[([\d.:]+)\])?$/;


    let match = line.match(unixRegex);
    if (match) {
      hop.hop = parseInt(match[1]);
      const hostOrName = match[2].trim(); // может быть hostname или IP или *
      const ipInParentheses = match[3]; // IP в скобках, если есть
      const timesPart = match[4] || '';

      if (ipInParentheses) {
        hop.ip = ipInParentheses;
        if (hostOrName && hostOrName !== ipInParentheses) {
          hop.hostname = hostOrName;
        }
      } else if (hostOrName === '*') {
        hop.ip = null;
        hop.hostname = null;
      } else if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(hostOrName)) {
        hop.ip = hostOrName;
      } else {
        hop.hostname = hostOrName;
      }

      // Parse times
      const timeMatches = timesPart.match(/([0-9.]+)\s*ms/g);
      if (timeMatches) {
        hop.times = timeMatches.map(t => parseFloat(t.replace('ms', '')));
      }

      return hop;
    }

    // Попытка парсинга как Windows-подобный стиль
    match = line.match(windowsRegex);
    if (match) {
      hop.hop = parseInt(match[1]);
      hop.times = [match[2], match[3], match[4]]
        .filter(t => t && t !== '*')
        .map(t => parseFloat(t.replace('<', '').replace('ms', '')));
      
      const hostOrIp = match[5].trim();
      const ipInBrackets = match[6];

      if (ipInBrackets) { // router.isp.com [10.0.0.1]
        hop.ip = ipInBrackets;
        if (hostOrIp && hostOrIp !== ipInBrackets) {
          hop.hostname = hostOrIp;
        }
      } else if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(hostOrIp)) { // Just IP
        hop.ip = hostOrIp;
      } else if (hostOrIp === '*') { // * * *
        hop.ip = null;
        hop.hostname = null;
      } else { // Just hostname
        hop.hostname = hostOrIp;
      }
      return hop;
    }

    return null; // Не удалось распарсить строку
  }

  static parseTracerouteOutput(output, host) {
    const lines = output.split('\n');
    const result = {
      host,
      hops: [],
      timestamp: new Date().toISOString(),
    };

    lines.forEach((line) => {
      const hop = this.parseTracerouteLine(line, host);
      if (hop) {
        result.hops.push(hop);
      }
    });

    return result;
  }

  static async dnsLookup(host, type = 'A') {
    try {
      logger.info(`DNS lookup for ${host} type ${type}`);

      const result = {
        host,
        type,
        records: [],
        timestamp: new Date().toISOString(),
      };

      switch (type.toUpperCase()) {
        case 'A':
          result.records = await dns.resolve4(host);
          break;
        case 'AAAA':
          result.records = await dns.resolve6(host);
          break;
        case 'MX':
          result.records = await dns.resolveMx(host);
          break;
        case 'TXT':
          result.records = await dns.resolveTxt(host);
          break;
        case 'NS':
          result.records = await dns.resolveNs(host);
          break;
        case 'CNAME':
          result.records = await dns.resolveCname(host);
          break;
        case 'PTR':
          result.records = await dns.resolvePtr(host);
          break;
        default:
          throw new Error(`Unsupported DNS record type: ${type}`);
      }

      return result;
    } catch (error) {
      logger.error(`DNS lookup failed for ${host}:`, error);
      throw new Error(`DNS lookup failed: ${error.message}`);
    }
  }

  static async getDNSServers() {
    try {
      return {
        servers: dns.getServers(),
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      logger.error('Failed to get DNS servers:', error);
      throw new Error(`Failed to get DNS servers: ${error.message}`);
    }
  }
}

export default NetworkUtils;
