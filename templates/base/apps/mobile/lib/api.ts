import ky from 'ky';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

import Constants from 'expo-constants';

const getBaseUrl = () => {
  if (__DEV__) {
    const debuggerHost = Constants.expoConfig?.hostUri;
    const localhost = debuggerHost?.split(':')[0] || 'localhost';
    return `http://${localhost}:3000`;
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
