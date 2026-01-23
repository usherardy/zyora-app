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
 * Note: We don't store full base64 images to avoid localStorage quota issues
 * Only metadata is persisted, images are kept in memory during session
 */
export const looksStorage = {
  async save(look: SavedLook): Promise<void> {
    try {
      const looks = await this.getAll();
      
      // Store only metadata without the full base64 image to avoid quota issues
      const lookMetadata = {
        id: look.id,
        createdAt: look.createdAt,
        userImageUri: look.userImageUri,
        fitImageUri: look.fitImageUri,
        // Don't store the full generated image - it's too large for localStorage
        // The image will be kept in memory during the session
      };
      
      looks.unshift(lookMetadata as SavedLook);
      // Keep only the most recent 10 looks metadata
      const trimmed = looks.slice(0, 10);
      await AsyncStorage.setItem(STORAGE_KEYS.SAVED_LOOKS, JSON.stringify(trimmed));
    } catch (error: any) {
      // Handle quota exceeded error gracefully
      if (error?.name === 'QuotaExceededError' || error?.message?.includes('quota')) {
        console.warn('[Storage] Quota exceeded, clearing old looks');
        await this.clear();
      } else {
        console.error('[Storage] Failed to save look:', error);
      }
    }
  },

  async getAll(): Promise<SavedLook[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.SAVED_LOOKS);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('[Storage] Failed to get looks:', error);
      return [];
    }
  },

  async remove(id: string): Promise<void> {
    try {
      const looks = await this.getAll();
      const filtered = looks.filter((look) => look.id !== id);
      await AsyncStorage.setItem(STORAGE_KEYS.SAVED_LOOKS, JSON.stringify(filtered));
    } catch (error) {
      console.error('[Storage] Failed to remove look:', error);
    }
  },

  async clear(): Promise<void> {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.SAVED_LOOKS);
    } catch (error) {
      console.error('[Storage] Failed to clear looks:', error);
    }
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

