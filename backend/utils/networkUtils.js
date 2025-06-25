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

      let stdout = '';
      let stderr = '';

      child.stdout.on('data', (data) => {
        stdout += data.toString();
        if (callback) {
          const lines = data.toString().split('\n');
          lines.forEach((line) => {
            const hop = this.parseTracerouteLine(line, sanitizedHost);
            if (hop) {
              callback(hop);
            }
          });
        }
      });

      child.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      child.on('close', () => {
        const result = this.parseTracerouteOutput(stdout, sanitizedHost);
        resolve(result);
      });

      child.on('error', (error) => {
        logger.error(`Traceroute spawn error for ${sanitizedHost}:`, error);
        reject(new Error(`Failed to execute traceroute: ${error.message}`));
      });
    });
  }

  static parseTracerouteLine(line, host) {
    const hopMatch = line.match(/^\s*(\d+)\s+([^\n]+)/);
    if (hopMatch) {
      const hopNumber = parseInt(hopMatch[1]);
      const hopData = hopMatch[2].trim();
      const ipMatch = hopData.match(/\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b|\b([0-9a-fA-F:]+)\b/);
      const timeMatches = hopData.match(/([0-9.]+)\s+ms/g);
      const times = timeMatches ? timeMatches.map((t) => parseFloat(t.replace(' ms', ''))) : [];

      return {
        hop: hopNumber,
        ip: ipMatch ? ipMatch[0] : null,
        times,
        raw: hopData,
        timestamp: new Date().toISOString(),
      };
    }
    return null;
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
