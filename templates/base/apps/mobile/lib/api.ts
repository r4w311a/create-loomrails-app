import { client } from '@loomrails/types';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';

const getBaseUrl = () => {
  const configuredUrl = process.env.EXPO_PUBLIC_API_URL;
  if (configuredUrl) return configuredUrl;

  if (__DEV__) {
    const hostUri = Constants.expoConfig?.hostUri ?? Constants.manifest?.debuggerHost;
    const host = hostUri?.split(':')[0];
    if (host) return `http://${host}:3000/api/v1`;
  }
  return 'https://api.yourproductiondomain.com/api/v1';
};

client.setConfig({
  baseUrl: getBaseUrl(),
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    'X-Client-Type': 'mobile',
  },
});

client.interceptors.request.use(async (request) => {
  const token = await SecureStore.getItemAsync('jwt_token');
  if (token) {
    request.headers.set('Authorization', `Bearer ${token}`);
  }
  return request;
});

export { client as api };
