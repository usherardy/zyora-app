export interface ImageAsset {
  id: string;
  uri: string;
  type: 'user' | 'fit' | 'generated';
  date: number;
  base64?: string;
}

export interface UserProfile {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  quota: number;
  maxQuota: number;
}

export enum AppView {
  AUTH = 'AUTH',
  STUDIO = 'STUDIO',
  VAULT = 'VAULT',
  PROFILE = 'PROFILE',
  GENERATE = 'GENERATE',
}

export interface GenerationResult {
  success: boolean;
  image?: string;
  error?: string;
}

export interface SavedLook {
  id: string;
  image: string;
  createdAt: number;
  userImageUri?: string;
  fitImageUri?: string;
}

