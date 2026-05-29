import ky from 'ky';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// Android Emulator maps localhost to 10.0.2.2
const getBaseUrl = () => {
  if (Platform.OS === 'android') return 'http://10.0.2.2:3000';
  return 'http://localhost:3000';
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
