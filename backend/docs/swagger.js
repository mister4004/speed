export default {
  openapi: '3.0.0',
  info: {
    title: 'Network Diagnostics API',
    version: '1.0.0',
    description: 'API for network diagnostics tool',
  },
  servers: [
    { url: 'https://cloud-hosts.org/api/v1' },
    { url: 'http://localhost:3001/api/v1', description: 'Local development' },
  ],
  tags: [
    { name: 'DNS', description: 'DNS-related operations' },
    { name: 'Ping', description: 'ICMP ping operations' },
    { name: 'Traceroute', description: 'Traceroute operations' },
    { name: 'SpeedTest', description: 'Speed test operations' },
    { name: 'Ports', description: 'Port scanning operations' },
    { name: 'WHOIS', description: 'WHOIS lookup operations' },
    { name: 'VPN', description: 'VPN/Proxy detection' },
  ],
  paths: {},
};
