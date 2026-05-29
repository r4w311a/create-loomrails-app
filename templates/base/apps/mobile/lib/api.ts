import ky from 'ky';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';

const getBaseUrl = () => {
  if (__DEV__) {
    const hostUri = Constants.expoConfig?.hostUri ?? Constants.manifest?.debuggerHost;
    const host = hostUri?.split(':')[0];
    if (host) return `http://${host}:3000`;
  }
  return 'https://api.yourproductiondomain.com';
};

export const api = ky.create({
  prefixUrl: getBaseUrl(),
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    'X-Client-Type': 'mobile',
  },
  hooks: {
    beforeRequest: [
      async (request) => {
        const token = await SecureStore.getItemAsync('jwt_token');
        if (token) request.headers.set('Authorization', `Bearer ${token}`);
      },
    ],
  },
});
