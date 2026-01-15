import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '@/constants';
import { UserProfile, SavedLook } from '@/types';

/**
 * User storage operations
 */
export const userStorage = {
  async save(user: UserProfile): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
  },

  async get(): Promise<UserProfile | null> {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.USER);
    return data ? JSON.parse(data) : null;
  },

  async remove(): Promise<void> {
    await AsyncStorage.removeItem(STORAGE_KEYS.USER);
  },

  async updateQuota(quota: number): Promise<void> {
    const user = await this.get();
    if (user) {
      user.quota = quota;
      await this.save(user);
    }
  },
};

/**
 * Saved looks storage operations
 */
export const looksStorage = {
  async save(look: SavedLook): Promise<void> {
    const looks = await this.getAll();
    looks.unshift(look);
    // Keep only the most recent 50 looks
    const trimmed = looks.slice(0, 50);
    await AsyncStorage.setItem(STORAGE_KEYS.SAVED_LOOKS, JSON.stringify(trimmed));
  },

  async getAll(): Promise<SavedLook[]> {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.SAVED_LOOKS);
    return data ? JSON.parse(data) : [];
  },

  async remove(id: string): Promise<void> {
    const looks = await this.getAll();
    const filtered = looks.filter((look) => look.id !== id);
    await AsyncStorage.setItem(STORAGE_KEYS.SAVED_LOOKS, JSON.stringify(filtered));
  },

  async clear(): Promise<void> {
    await AsyncStorage.removeItem(STORAGE_KEYS.SAVED_LOOKS);
  },
};

/**
 * Developer mode storage
 */
export const devModeStorage = {
  async isEnabled(): Promise<boolean> {
    const value = await AsyncStorage.getItem(STORAGE_KEYS.DEV_MODE);
    return value === 'true';
  },

  async setEnabled(enabled: boolean): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.DEV_MODE, enabled ? 'true' : 'false');
  },
};

/**
 * Clear all app data
 */
export async function clearAllData(): Promise<void> {
  const keys = Object.values(STORAGE_KEYS);
  await AsyncStorage.multiRemove(keys);
}

