# Data Model & Database Schema

## Overview

The Zyora app uses a **hybrid data storage approach**:
- **In-Memory**: Zustand stores for fast access during app session
- **Local Storage**: AsyncStorage for persistence across app restarts
- **Cloud**: Firebase for user authentication and future sync capabilities

---

## Core Data Models

### UserProfile

Represents authenticated user information.

```typescript
interface UserProfile {
  uid: string;                    // Unique Firebase UID
  displayName: string | null;     // User's display name
  email: string | null;           // User's email address
  photoURL: string | null;        // Profile picture URL
  quota: number;                  // Current generation count
  maxQuota: number;               // Monthly quota limit (default: 10)
}
```

**Storage Locations**:
- Memory: `authStore.user`
- AsyncStorage: `'zyora:user'`
- Firebase Authentication: `auth.currentUser`

**Lifecycle**:
1. User signs in → Firebase creates user
2. User data cached in Zustand
3. User persisted to AsyncStorage
4. On app restart → loaded from AsyncStorage

---

### ImageAsset

Represents image files (user photos, outfit images, generated results).

```typescript
interface ImageAsset {
  id: string;                           // Unique identifier (UUID)
  uri: string;                          // Local path or remote URL
  type: 'user' | 'fit' | 'generated';  // Image classification
  date: number;                         // Unix timestamp
  base64?: string;                      // Base64 encoded image (optional)
}
```

**Types Explained**:
- `user`: Photo of the user (selfie/body shot)
- `fit`: Outfit/clothing image to try on
- `generated`: AI-generated result

**Storage Locations**:
- Memory: `authStore.userImg`, `authStore.fitImg`
- File System: `/tmp/` or `/cache/` directory
- AsyncStorage: Base64 encoded for saved looks

**Usage**:
```typescript
// In Studio
const userImg = {
  id: UUID(),
  uri: 'file:///cache/photo_123.jpg',
  type: 'user',
  date: Date.now()
};

// Converted to base64 for API
const base64 = await FileSystem.readAsStringAsync(userImg.uri, {
  encoding: 'base64'
});
```

---

### SavedLook

Represents a generated outfit that user saved.

```typescript
interface SavedLook {
  id: string;                     // Unique identifier
  image: string;                  // Generated image (base64)
  createdAt: number;              // Unix timestamp
  userImageUri?: string;          // Reference to user photo
  fitImageUri?: string;           // Reference to outfit image
}
```

**Storage Locations**:
- Memory: `authStore.savedLooks`
- AsyncStorage: `'zyora:saved_looks'` (JSON array)
- Future: Firebase Firestore `looks/{lookId}`

**Expansion Potential**:
```typescript
interface SavedLookExpanded {
  id: string;
  image: string;
  createdAt: number;
  userImageUri?: string;
  fitImageUri?: string;
  
  // Future additions
  outfitDetails?: {
    brand?: string;
    price?: number;
    purchaseLink?: string;
    description?: string;
    color?: string;
    style?: string;
    size?: string;
  };
  
  isArchived?: boolean;
  isFavorited?: boolean;
  shareToken?: string;  // For sharing links
  createdAtPretty?: string;  // Human-readable date
}
```

---

### GenerationResult

Response from backend image generation API.

```typescript
interface GenerationResult {
  success: boolean;     // Operation success flag
  image?: string;      // Generated image (base64 if successful)
  error?: string;      // Error message if failed
}
```

**Response Examples**:
```typescript
// Success
{
  success: true,
  image: "iVBORw0KGgoAAAANSUhEUgAAAAUA..."
}

// Error
{
  success: false,
  error: "Image generation failed: Invalid image dimensions"
}
```

---

## Storage Architecture

### 1. In-Memory Storage (Zustand)

**Purpose**: Fast access during app session, powers UI rendering

**AuthStore Structure**:
```typescript
interface AuthState {
  // User Data
  user: UserProfile | null;
  isDevMode: boolean;
  isLoading: boolean;
  
  // Image Selection
  userImg: ImageAsset | null;
  fitImg: ImageAsset | null;
  
  // Generated Looks
  savedLooks: SavedLook[];
  
  // Actions
  setUser(user: UserProfile | null): void;
  setDevMode(enabled: boolean): void;
  setLoading(loading: boolean): void;
  setUserImg(img: ImageAsset | null): void;
  setFitImg(img: ImageAsset | null): void;
  setSavedLooks(looks: SavedLook[]): void;
  addSavedLook(look: SavedLook): void;
  removeSavedLook(id: string): void;
  incrementQuota(): void;
  signOut(): void;
  loadFromStorage(): Promise<void>;
}
```

**PreferencesStore Structure**:
```typescript
interface PreferencesState {
  // Settings
  theme: 'light' | 'dark' | 'auto';
  notificationsEnabled: boolean;
  language: string;
  
  // Actions
  setTheme(theme: string): void;
  setNotifications(enabled: boolean): void;
  setLanguage(language: string): void;
  loadFromStorage(): Promise<void>;
  saveToStorage(): Promise<void>;
}
```

**Persistence**: Lost on app restart (except what's saved to AsyncStorage)

---

### 2. Local Storage (AsyncStorage)

**Purpose**: Persistent storage across app sessions

**Storage Keys** (from `constants/index.ts`):
```typescript
export const STORAGE_KEYS = {
  USER: 'zyora:user',
  LOOKS_COUNT: 'zyora:looks:count',
  SAVED_LOOKS: 'zyora:saved_looks',
  DEV_MODE: 'zyora:dev_mode',
};
```

**What's Stored**:

#### `zyora:user` (UserProfile)
```json
{
  "uid": "firebase-uid-123",
  "displayName": "John Doe",
  "email": "john@example.com",
  "photoURL": "https://...",
  "quota": 7,
  "maxQuota": 10
}
```

#### `zyora:saved_looks` (SavedLook[])
```json
[
  {
    "id": "look-1",
    "image": "iVBORw0KGgo...",
    "createdAt": 1705257600000,
    "userImageUri": "file:///cache/user_123.jpg",
    "fitImageUri": "file:///cache/fit_456.jpg"
  },
  {
    "id": "look-2",
    "image": "iVBORw0KGgo...",
    "createdAt": 1705171200000
  }
]
```

#### `zyora:dev_mode` (boolean)
```json
true
```

**Persistence**: Survives app close/restart, persists until deleted

**Implementation** (`lib/storage.ts`):
```typescript
export const userStorage = {
  async set(user: UserProfile) {
    await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
  },
  async get(): Promise<UserProfile | null> {
    const user = await AsyncStorage.getItem(STORAGE_KEYS.USER);
    return user ? JSON.parse(user) : null;
  }
};
```

---

### 3. Cloud Storage (Firebase)

**Status**: Currently used only for authentication

**Current Usage**:
- User authentication (Firebase Auth)
- User credentials storage
- User UID generation

**Future Usage** (recommended):
- Sync user profile across devices
- Cloud backup of saved looks
- Quota tracking (server-side source of truth)
- User preferences synchronization

**Proposed Firestore Structure**:
```
users/
├── {uid}/
│   ├── profile/
│   │   ├── displayName: string
│   │   ├── email: string
│   │   ├── photoURL: string
│   │   ├── createdAt: timestamp
│   │   └── updatedAt: timestamp
│   │
│   ├── quota/
│   │   ├── current: number
│   │   ├── max: number
│   │   ├── resetDate: timestamp
│   │   └── usage: [{date: timestamp, count: number}]
│   │
│   ├── preferences/
│   │   ├── theme: string
│   │   ├── notificationsEnabled: boolean
│   │   └── language: string
│   │
│   └── looks/
│       ├── {lookId}/
│       │   ├── image: string (base64)
│       │   ├── createdAt: timestamp
│       │   ├── outfitDetails: object
│       │   ├── isFavorited: boolean
│       │   └── isArchived: boolean
```

---

## Data Flow Diagrams

### Sign-Up/Sign-In Flow

```
User Opens App
    ↓
Check AsyncStorage for 'zyora:user'
    ↓
    ├─ Found: Load to Zustand → Show (tabs)
    └─ Not Found: Show Auth Screen
        ↓
        User Clicks "Sign in with Google"
        ↓
        Google OAuth Flow
        ↓
        Firebase Sign-In
        ↓
        UserProfile Created by Firebase
        ↓
        Store in AsyncStorage
        ↓
        Store in Zustand
        ↓
        Navigate to (tabs)
```

### Image Generation Flow

```
User in Studio Screen
    ↓
Select User Photo → Convert to base64 → Store in Zustand.userImg
    ↓
Select Outfit Photo → Convert to base64 → Store in Zustand.fitImg
    ↓
Click "Generate"
    ↓
Navigate to Generate Screen
    ↓
Create FormData with base64 images
    ↓
POST /api/generate-look
    ↓
Backend Processes with Vertex AI
    ↓
Response with GenerationResult
    ↓
Display Generated Image
    ↓
    ├─ User Clicks "Save"
    │  ↓
    │  Create SavedLook object
    │  ↓
    │  Add to Zustand.savedLooks
    │  ↓
    │  Update AsyncStorage 'zyora:saved_looks'
    │
    └─ User Clicks "Generate Again"
       ↓
       Return to Studio Screen
```

### Quota Tracking Flow

```
App Initialization
    ↓
Load UserProfile from AsyncStorage
    ↓
Set Zustand.user.quota
    ↓
    ↓
User Generates Image
    ↓
API Call to /api/generate-look
    ↓
API Returns Success
    ↓
Zustand calls incrementQuota()
    ↓
quota -= 1 (e.g., 10 → 9)
    ↓
Update AsyncStorage 'zyora:user'
    ↓
    ├─ quota === 0?
    │  ↓
    │  Show "Quota Exceeded" message
    │  ↓
    │  Suggest Premium
    │
    └─ quota > 0?
       ↓
       Allow another generation
```

---

## Data Validation Rules

### UserProfile Validation
- `uid`: Non-empty string, unique
- `email`: Valid email format
- `quota`: Integer ≥ 0
- `maxQuota`: Integer > 0
- `displayName`: Max 100 characters

### ImageAsset Validation
- `id`: Non-empty UUID
- `uri`: Valid file path or URL
- `type`: One of 'user', 'fit', 'generated'
- `date`: Valid Unix timestamp ≤ now

### SavedLook Validation
- `id`: Non-empty UUID
- `image`: Valid base64 string
- `createdAt`: Valid Unix timestamp ≤ now

### GenerationResult Validation
- `success`: Boolean
- If `success === true`: `image` must be valid base64
- If `success === false`: `error` must be non-empty string

---

## Database Transactions & Atomicity

### Current Implementation
**Status**: No multi-step transactions (problematic)

### Issues
1. AsyncStorage writes not atomic
2. Zustand updates not synced with storage
3. Image file cleanup not automatic

### Recommended Solution
```typescript
// Use AsyncStorage batch operations
const batch = [
  ['zyora:user', userJSON],
  ['zyora:saved_looks', looksJSON],
];

await AsyncStorage.multiSet(batch);
```

---

## Data Privacy & Security

### Sensitive Data Handling
- **User Tokens**: Not stored locally, only in memory
- **User Emails**: Encrypted in AsyncStorage
- **Images**: Stored unencrypted locally (improvement needed)
- **Auth State**: Stored in AsyncStorage (improvement: encrypt)

### Recommended Improvements
1. Encrypt AsyncStorage values
2. Implement token refresh mechanism
3. Add data deletion on logout
4. Secure image file permissions

---

## Database Migration Strategy (Future)

If migrating to backend database:

```
Step 1: Add Firestore alongside AsyncStorage
  - Write both when updating data
  
Step 2: Read from Firestore if available
  - Fallback to AsyncStorage
  
Step 3: Sync local to cloud on login
  - Merge conflict resolution
  
Step 4: Deprecate AsyncStorage
  - Keep for offline support only
```

---

## Backup & Recovery

### Current Backup
- AsyncStorage auto-backup (depends on device)
- User data recoverable via Firebase Auth

### Recommended
- Cloud backup to Firebase Firestore
- Export user data on demand
- Data deletion capability for GDPR compliance

