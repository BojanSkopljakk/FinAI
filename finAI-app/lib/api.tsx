import axios from 'axios';
import { Platform } from 'react-native';

const api = axios.create({
  baseURL:
    Platform.OS === 'web'
      ? 'https://localhost:7007/api' // for web
      : 'http://192.168.155.200:5049/api', // for Android emulator
});

export default api;
