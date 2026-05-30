import { client } from '@loomrails/types';

const apiBaseUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api/v1';

client.setConfig({
  baseUrl: apiBaseUrl,
  credentials: 'include', // Automatically sends HttpOnly cookies
  headers: {
    'X-Client-Type': 'web',
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  },
});

export { client as api };
