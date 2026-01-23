import { create } from 'zustand';
import { UserProfile, ImageAsset, SavedLook } from '@/types';
import { userStorage, looksStorage, devModeStorage } from '@/lib/storage';
import { MAX_FREE_QUOTA } from '@/constants';
import { signOut as firebaseSignOut } from '@/lib/auth';
import { onAuthStateChange, firebaseUserToProfile, getUserCredits, saveUserCredits, incrementUserQuota, recordGeneration } from '@/lib/firebase';

interface AuthState {
  user: UserProfile | null;
  isLoading: boolean;
  isDevMode: boolean;
  userImg: ImageAsset | null;
  fitImg: ImageAsset | null;
  savedLooks: SavedLook[];

  // Actions
  setUser: (user: UserProfile | null) => void;
  setLoading: (loading: boolean) => void;
  setDevMode: (enabled: boolean) => void;
  setUserImg: (img: ImageAsset | null) => void;
  setFitImg: (img: ImageAsset | null) => void;
  setSavedLooks: (looks: SavedLook[]) => void;
  addSavedLook: (look: SavedLook) => void;
  removeSavedLook: (id: string) => void;
  incrementQuota: () => void;
  updateQuota: (newMaxQuota: number) => void;
  signOut: () => void;
  signInAsDeveloper: () => void;
  signInWithGoogle: (googleUser: {
    uid: string;
    displayName: string | null;
    email: string | null;
    photoURL: string | null;
  }) => void;
  signInWithEmail: (user: {
    uid: string;
    displayName: string | null;
    email: string | null;
    photoURL: string | null;
  }) => void;
  loadFromStorage: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isLoading: true,
  isDevMode: false,
  userImg: null,
  fitImg: null,
  savedLooks: [],

  setUser: (user) => {
    set({ user });
    if (user) {
      userStorage.save(user);
    } else {
      userStorage.remove();
    }
  },

  setLoading: (isLoading) => set({ isLoading }),

  setDevMode: (isDevMode) => {
    set({ isDevMode });
    devModeStorage.setEnabled(isDevMode);
  },

  setUserImg: (userImg) => set({ userImg }),

  setFitImg: (fitImg) => set({ fitImg }),

  setSavedLooks: (savedLooks) => set({ savedLooks }),

  addSavedLook: async (look) => {
    const { savedLooks } = get();
    const updated = [look, ...savedLooks];
    set({ savedLooks: updated });
    await looksStorage.save(look);
  },

  removeSavedLook: async (id) => {
    const { savedLooks } = get();
    const updated = savedLooks.filter((look) => look.id !== id);
    set({ savedLooks: updated });
    await looksStorage.remove(id);
  },

  incrementQuota: async () => {
    const { user } = get();
    if (user) {
      const updatedUser = { ...user, quota: user.quota + 1 };
      set({ user: updatedUser });
      userStorage.save(updatedUser);
      console.log('[AuthStore] Quota incremented:', updatedUser.quota, '/', updatedUser.maxQuota);
      
      // Sync to Firestore
      try {
        await incrementUserQuota(user.uid);
      } catch (error) {
        console.error('[AuthStore] Failed to sync quota to Firestore:', error);
      }
    }
  },

  updateQuota: async (newMaxQuota: number) => {
    const { user } = get();
    if (user) {
      // Update maxQuota to the new value (which should already include the added credits)
      // Keep the current quota (used generations) unchanged
      const updatedUser = { ...user, maxQuota: newMaxQuota };
      set({ user: updatedUser });
      userStorage.save(updatedUser);
      console.log(`[AuthStore] Updated maxQuota to ${newMaxQuota}, current quota: ${user.quota}`);

      // Sync to Firestore
      try {
        await saveUserCredits(user.uid, { maxQuota: newMaxQuota });
      } catch (error) {
        console.error('[AuthStore] Failed to sync quota to Firestore:', error);
      }
    }
  },

  signOut: async () => {
    try {
      await firebaseSignOut();
    } catch (error) {
      console.error('Firebase sign out error:', error);
    }
    set({
      user: null,
      isDevMode: false,
      userImg: null,
      fitImg: null,
    });
    userStorage.remove();
    devModeStorage.setEnabled(false);
  },

  signInAsDeveloper: () => {
    const devUser: UserProfile = {
      uid: 'dev-user-' + Date.now(),
      displayName: 'Developer',
      email: 'dev@zyora.app',
      photoURL: null,
      quota: 0,
      maxQuota: MAX_FREE_QUOTA,
    };
    set({ user: devUser, isDevMode: true });
    userStorage.save(devUser);
    devModeStorage.setEnabled(true);
  },

  signInWithGoogle: async (googleUser) => {
    // First set user with defaults, then sync from Firestore
    const user: UserProfile = {
      uid: googleUser.uid,
      displayName: googleUser.displayName,
      email: googleUser.email,
      photoURL: googleUser.photoURL,
      quota: 0,
      maxQuota: MAX_FREE_QUOTA,
    };
    set({ user, isDevMode: false });
    userStorage.save(user);

    // Sync credits from Firestore
    try {
      const firestoreCredits = await getUserCredits(googleUser.uid);
      if (firestoreCredits) {
        // Use Firestore data (it's the source of truth)
        const syncedUser = { 
          ...user, 
          quota: firestoreCredits.quota, 
          maxQuota: firestoreCredits.maxQuota 
        };
        set({ user: syncedUser });
        userStorage.save(syncedUser);
        console.log('[AuthStore] Synced credits from Firestore:', firestoreCredits.quota, '/', firestoreCredits.maxQuota);
      } else {
        // Create new user in Firestore
        await saveUserCredits(googleUser.uid, {
          email: googleUser.email,
          quota: 0,
          maxQuota: MAX_FREE_QUOTA,
        });
        console.log('[AuthStore] Created new user in Firestore');
      }
    } catch (error) {
      console.error('[AuthStore] Firestore sync error:', error);
    }
  },

  signInWithEmail: async (emailUser) => {
    // First set user with defaults, then sync from Firestore
    const userProfile: UserProfile = {
      uid: emailUser.uid,
      displayName: emailUser.displayName,
      email: emailUser.email,
      photoURL: emailUser.photoURL,
      quota: 0,
      maxQuota: MAX_FREE_QUOTA,
    };
    set({ user: userProfile, isDevMode: false });
    userStorage.save(userProfile);

    // Sync credits from Firestore
    try {
      const firestoreCredits = await getUserCredits(emailUser.uid);
      if (firestoreCredits) {
        // Use Firestore data (it's the source of truth)
        const syncedUser = { 
          ...userProfile, 
          quota: firestoreCredits.quota, 
          maxQuota: firestoreCredits.maxQuota 
        };
        set({ user: syncedUser });
        userStorage.save(syncedUser);
        console.log('[AuthStore] Synced credits from Firestore:', firestoreCredits.quota, '/', firestoreCredits.maxQuota);
      } else {
        // Create new user in Firestore
        await saveUserCredits(emailUser.uid, {
          email: emailUser.email,
          quota: 0,
          maxQuota: MAX_FREE_QUOTA,
        });
        console.log('[AuthStore] Created new user in Firestore');
      }
    } catch (error) {
      console.error('[AuthStore] Firestore sync error:', error);
    }
  },

  loadFromStorage: async () => {
    try {
      set({ isLoading: true });

      const [storedUser, storedLooks, isDevMode] = await Promise.all([
        userStorage.get(),
        looksStorage.getAll(),
        devModeStorage.isEnabled(),
      ]);

      set({
        user: storedUser,
        savedLooks: storedLooks,
        isDevMode,
        isLoading: false,
      });
    } catch (error) {
      console.error('Failed to load from storage:', error);
      set({ isLoading: false });
    }
  },
}));

