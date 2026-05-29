import ky from 'ky';

export const api = ky.create({
  prefixUrl: 'http://localhost:3000',
  credentials: 'include', // Automatically sends HttpOnly cookies
  headers: {
    'X-Client-Type': 'web',
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  },
});
