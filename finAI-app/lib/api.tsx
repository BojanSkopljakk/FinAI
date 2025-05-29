import axios from 'axios';
import { Platform } from 'react-native';

const api = axios.create({
  baseURL:
    Platform.OS === 'web'
      ? 'https://localhost:7007/api' // for web
      : 'https://44fa-109-245-67-202.ngrok-free.app/api', // for Android emulator
});

export default api;
