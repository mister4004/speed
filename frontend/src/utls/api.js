import axios from 'axios';

const api = axios.create({
  baseURL: 'https://cloud-hosts.org/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

export { api };
