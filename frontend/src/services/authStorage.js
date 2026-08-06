/**
 * services/authStorage.js
 * ----------------------------------------------------------------
 * Small storage wrapper for auth data (token, email, isAdmin flag).
 *
 * Why this exists: expo-secure-store is the more secure option on
 * native platforms, but it has two real failure modes this app has
 * hit in practice:
 *   1. It does not work on Expo web at all.
 *   2. Its native module can fail to link correctly in certain
 *      native/dev builds, throwing errors like
 *      "_ExpoSecureStore.default.getValueWithKeyAsync is not a
 *      function" - which crashes AuthContext's startup check before
 *      the app ever gets to the login screen.
 *
 * Rather than assume SecureStore always works, every call here
 * tries SecureStore first and transparently falls back to
 * AsyncStorage if SecureStore throws or is unavailable. Screens and
 * AuthContext never touch SecureStore/AsyncStorage directly - they
 * only call the functions below.
 * ----------------------------------------------------------------
 */
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

// SecureStore is not supported on web at all - skip straight to
// AsyncStorage there rather than trying and catching every time.
const SECURE_STORE_AVAILABLE = Platform.OS !== 'web';

export async function getAuthValue(key) {
  if (SECURE_STORE_AVAILABLE) {
    try {
      const value = await SecureStore.getItemAsync(key);
      return value;
    } catch (error) {
      console.warn(
        `[authStorage] SecureStore.getItemAsync failed for "${key}", falling back to AsyncStorage:`,
        error?.message || error
      );
    }
  }

  try {
    return await AsyncStorage.getItem(key);
  } catch (error) {
    console.error(`[authStorage] AsyncStorage.getItem also failed for "${key}":`, error?.message);
    return null;
  }
}

export async function setAuthValue(key, value) {
  if (SECURE_STORE_AVAILABLE) {
    try {
      await SecureStore.setItemAsync(key, value ?? '');
      return;
    } catch (error) {
      console.warn(
        `[authStorage] SecureStore.setItemAsync failed for "${key}", falling back to AsyncStorage:`,
        error?.message || error
      );
    }
  }

  try {
    await AsyncStorage.setItem(key, value ?? '');
  } catch (error) {
    console.error(`[authStorage] AsyncStorage.setItem also failed for "${key}":`, error?.message);
  }
}

export async function deleteAuthValue(key) {
  if (SECURE_STORE_AVAILABLE) {
    try {
      await SecureStore.deleteItemAsync(key);
      return;
    } catch (error) {
      console.warn(
        `[authStorage] SecureStore.deleteItemAsync failed for "${key}", falling back to AsyncStorage:`,
        error?.message || error
      );
    }
  }

  try {
    await AsyncStorage.removeItem(key);
  } catch (error) {
    console.error(`[authStorage] AsyncStorage.removeItem also failed for "${key}":`, error?.message);
  }
}