import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from './constants';

export const setToken = async (token) => {
  await AsyncStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
};

export const getToken = async () => {
  return await AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
};

export const removeToken = async () => {
  await AsyncStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
};

export const setUserData = async (user) => {
  await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(user));
};

export const getUserData = async () => {
  const data = await AsyncStorage.getItem(STORAGE_KEYS.USER_DATA);
  return data ? JSON.parse(data) : null;
};

export const clearAll = async () => {
  await AsyncStorage.multiRemove([STORAGE_KEYS.AUTH_TOKEN, STORAGE_KEYS.USER_DATA]);
};
