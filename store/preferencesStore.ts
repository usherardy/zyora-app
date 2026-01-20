import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

const PREFERENCES_STORAGE_KEY = 'zyora:preferences';

export interface Preferences {
  notifications: boolean;
  darkMode: boolean;
  saveToGallery: boolean;
  highQuality: boolean;
}

const DEFAULT_PREFERENCES: Preferences = {
  notifications: true,
  darkMode: false,
  saveToGallery: true,
  highQuality: false,
};

interface PreferencesState {
  preferences: Preferences;
  isLoading: boolean;

  // Actions
  setNotifications: (enabled: boolean) => Promise<void>;
  setDarkMode: (enabled: boolean) => Promise<void>;
  setSaveToGallery: (enabled: boolean) => Promise<void>;
  setHighQuality: (enabled: boolean) => Promise<void>;
  loadPreferences: () => Promise<void>;
  resetPreferences: () => Promise<void>;
}

export const usePreferencesStore = create<PreferencesState>((set) => ({
  preferences: DEFAULT_PREFERENCES,
  isLoading: true,

  setNotifications: async (enabled: boolean) => {
    set((state) => ({
      preferences: { ...state.preferences, notifications: enabled },
    }));
    try {
      const state = await AsyncStorage.getItem(PREFERENCES_STORAGE_KEY);
      const current = state ? JSON.parse(state) : DEFAULT_PREFERENCES;
      const updated = { ...current, notifications: enabled };
      await AsyncStorage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error('Failed to save notifications preference:', error);
    }
  },

  setDarkMode: async (enabled: boolean) => {
    set((state) => ({
      preferences: { ...state.preferences, darkMode: enabled },
    }));
    try {
      const state = await AsyncStorage.getItem(PREFERENCES_STORAGE_KEY);
      const current = state ? JSON.parse(state) : DEFAULT_PREFERENCES;
      const updated = { ...current, darkMode: enabled };
      await AsyncStorage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error('Failed to save dark mode preference:', error);
    }
  },

  setSaveToGallery: async (enabled: boolean) => {
    set((state) => ({
      preferences: { ...state.preferences, saveToGallery: enabled },
    }));
    try {
      const state = await AsyncStorage.getItem(PREFERENCES_STORAGE_KEY);
      const current = state ? JSON.parse(state) : DEFAULT_PREFERENCES;
      const updated = { ...current, saveToGallery: enabled };
      await AsyncStorage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error('Failed to save save to gallery preference:', error);
    }
  },

  setHighQuality: async (enabled: boolean) => {
    set((state) => ({
      preferences: { ...state.preferences, highQuality: enabled },
    }));
    try {
      const state = await AsyncStorage.getItem(PREFERENCES_STORAGE_KEY);
      const current = state ? JSON.parse(state) : DEFAULT_PREFERENCES;
      const updated = { ...current, highQuality: enabled };
      await AsyncStorage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error('Failed to save high quality preference:', error);
    }
  },

  loadPreferences: async () => {
    try {
      const state = await AsyncStorage.getItem(PREFERENCES_STORAGE_KEY);
      const loaded = state ? JSON.parse(state) : DEFAULT_PREFERENCES;
      set({
        preferences: { ...DEFAULT_PREFERENCES, ...loaded },
        isLoading: false,
      });
    } catch (error) {
      console.error('Failed to load preferences:', error);
      set({ preferences: DEFAULT_PREFERENCES, isLoading: false });
    }
  },

  resetPreferences: async () => {
    set({ preferences: DEFAULT_PREFERENCES });
    try {
      await AsyncStorage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify(DEFAULT_PREFERENCES));
    } catch (error) {
      console.error('Failed to reset preferences:', error);
    }
  },
}));
