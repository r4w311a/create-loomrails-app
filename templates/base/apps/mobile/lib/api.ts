import ky from 'ky';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';

// Lazily resolved per-request so it works even if hostUri is
// not yet available at module evaluation time.
const getBaseUrl = () => {
  if (__DEV__) {
    // expo-constants exposes the Metro bundler's LAN address,
    // which is the same IP the physical device uses to reach the Mac.
    const hostUri = Constants.expoConfig?.hostUri ?? Constants.manifest?.debuggerHost;
    const host = hostUri?.split(':')[0];
    if (host) return `http://${host}:3000`;
  }
  return 'https://api.yourproductiondomain.com';
};

export const api = ky.create({
  prefixUrl: getBaseUrl(),
  headers: {
    'X-Client-Type': 'mobile',
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  },
  hooks: {
    beforeRequest: [
      async (request) => {
        const token = await SecureStore.getItemAsync('jwt_token');
        if (token) {
          request.headers.set('Authorization', `Bearer ${token}`);
        }
      }
    ]
  }
});
