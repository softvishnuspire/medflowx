/**
 * Mobile storage utility - replaces web localStorage API.
 * Uses AsyncStorage for general data and SecureStore for auth credentials.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

// ─── Auth Storage (SecureStore - encrypted) ─────────────────────────────

const AUTH_KEY = 'medflowx_logged_in_user';

export async function getAuthUser(): Promise<{
  name: string;
  email: string;
  role: string;
  avatarCode: string;
} | null> {
  try {
    const raw = await SecureStore.getItemAsync(AUTH_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export async function setAuthUser(user: {
  name: string;
  email: string;
  role: string;
  avatarCode: string;
}): Promise<void> {
  await SecureStore.setItemAsync(AUTH_KEY, JSON.stringify(user));
}

export async function removeAuthUser(): Promise<void> {
  await SecureStore.deleteItemAsync(AUTH_KEY);
}

// ─── General Storage (AsyncStorage - larger data) ───────────────────────

export async function getItem(key: string): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(key);
  } catch {
    return null;
  }
}

export async function setItem(key: string, value: string): Promise<void> {
  try {
    await AsyncStorage.setItem(key, value);
  } catch (e) {
    console.error('AsyncStorage setItem failed:', e);
  }
}

export async function removeItem(key: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(key);
  } catch (e) {
    console.error('AsyncStorage removeItem failed:', e);
  }
}

// ─── JSON helpers ───────────────────────────────────────────────────────

export async function getJsonItem<T>(key: string, defaultValue: T): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) {
      await AsyncStorage.setItem(key, JSON.stringify(defaultValue));
      return defaultValue;
    }
    return JSON.parse(raw);
  } catch {
    return defaultValue;
  }
}

export async function setJsonItem<T>(key: string, data: T): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error('AsyncStorage setJsonItem failed:', e);
  }
}
