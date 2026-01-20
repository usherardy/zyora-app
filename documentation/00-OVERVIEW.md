# Zyora Mobile App - Complete Documentation

## Table of Contents
1. [App Overview](#app-overview)
2. [Architecture](#architecture)
3. [Data Model](#data-model)
4. [Tech Stack](#tech-stack)
5. [OAuth & Authentication](#oauth--authentication)
6. [High-Level Diagram](#high-level-diagram)
7. [Feature Documentation](#feature-documentation)
8. [Gaps & Improvements](#gaps--improvements)

---

## App Overview

### What is Zyora?
Zyora is a **virtual fashion try-on mobile application** that uses AI-powered image processing to allow users to see how outfits look on them without physically trying them on. Users upload a photo of themselves and a clothing item image, and the app uses **Google Vertex AI** to generate a realistic overlay of the clothing on the user.

### Key Value Propositions
- **Virtual Try-On**: See how clothes look on your body before purchasing
- **AI-Powered**: Leverages Google Vertex AI for high-quality realistic overlays
- **Multi-Platform**: Works seamlessly on iOS, Android, and Web
- **Free Tier**: 10 free generations per month for all users
- **Saved Looks**: Ability to save and revisit favorite generated outfits
- **Developer Mode**: Testing capability without authentication

### Target Users
- Fashion enthusiasts who want to try clothes digitally
- Online shoppers looking to reduce return rates
- Users who want personalized outfit recommendations
- Fashion retailers and e-commerce platforms

---

## Architecture

### High-Level Architecture Pattern
```
┌─────────────────────────────────────────────────────────────┐
│                    MOBILE CLIENT (Expo)                      │
│  (iOS/Android/Web - React Native + Expo Router)            │
└──────────────────────────────┬──────────────────────────────┘
                               │
                ┌──────────────┼──────────────┐
                │              │              │
                ▼              ▼              ▼
        ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
        │ Expo Router  │ │   Zustand    │ │   Firebase   │
        │ (Navigation) │ │ (State Mgmt) │ │   (Auth)     │
        └──────────────┘ └──────────────┘ └──────────────┘
                               │
                ┌──────────────┼──────────────┐
                │              │              │
                ▼              ▼              ▼
        ┌──────────────────────────────────────────┐
        │    Backend API (Vercel Express Server)   │
        │  - Token Exchange                        │
        │  - Image Generation with Vertex AI       │
        │  - Health Checks                         │
        └──────────────────────────────────────────┘
                               │
        ┌──────────────────────┼──────────────────────┐
        │                      │                      │
        ▼                      ▼                      ▼
    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
    │   Firebase   │    │ Google Vertex│    │ Local Storage│
    │   Database   │    │     AI       │    │ (AsyncStore) │
    └──────────────┘    └──────────────┘    └──────────────┘
```

### Folder Structure
```
zyora-app/
├── app/                    # Expo Router file-based routing
│   ├── _layout.tsx        # Root layout with auth logic
│   ├── index.tsx          # Splash/home screen
│   ├── generate.tsx       # AI generation processing screen
│   ├── auth/              # Auth-related screens
│   │   └── callback.tsx   # OAuth callback handler
│   ├── (tabs)/            # Authenticated user screens
│   │   ├── _layout.tsx    # Tab navigation
│   │   ├── studio.tsx     # Image upload & selection
│   │   ├── vault.tsx      # Saved looks gallery
│   │   └── profile.tsx    # User profile & settings
│   └── profile/           # Sub-routes from profile
│       ├── help.tsx       # Help & FAQ
│       ├── personal.tsx   # Personal info
│       └── preferences.tsx# User preferences
├── lib/                    # Core business logic
│   ├── auth.ts            # Authentication functions
│   ├── firebase.ts        # Firebase initialization & methods
│   ├── api.ts             # Backend API calls
│   ├── storage.ts         # Local storage management
│   └── notifications.ts   # Push notifications
├── store/                  # Zustand state management
│   ├── authStore.ts       # User auth state
│   └── preferencesStore.ts# User preferences state
├── types/                  # TypeScript interfaces
│   └── index.ts           # All type definitions
├── constants/              # App configuration
│   └── index.ts           # API endpoints, credentials
├── hooks/                  # Custom React hooks
│   └── useFont.ts         # Font loading hook
└── assets/                 # Static assets
    ├── fonts/             # Custom fonts
    └── images/            # App images & icons
```

### Data Flow

#### Authentication Flow
1. User opens app → `_layout.tsx` checks `loadFromStorage()`
2. If authenticated → navigates to `(tabs)` screens
3. If not → shows Auth screen (`index.tsx`)
4. User taps "Sign in with Google" → `useGoogleAuth()` initiates OAuth
5. Google OAuth callback → Firebase authentication
6. Firebase returns user credentials → stored in Zustand + AsyncStorage
7. Authenticated screens now accessible

#### Generation Flow
1. User uploads photo + outfit in `studio.tsx` → stored in Zustand
2. User clicks "Generate" → navigates to `generate.tsx`
3. `generate.tsx` calls `generateLook()` from `lib/api.ts`
4. Images converted to base64 → sent to backend API
5. Backend processes with Vertex AI → returns generated image
6. Result stored in Zustand and can be saved to `vault.tsx`
7. Saved looks stored in AsyncStorage and Firebase

---

## Data Model

### Core Entities

#### UserProfile
```typescript
interface UserProfile {
  uid: string;              // Firebase UID
  displayName: string | null; // User's name
  email: string | null;      // User's email
  photoURL: string | null;   // Profile picture URL
  quota: number;            // Current free generation count
  maxQuota: number;         // Maximum quota (10)
}
```

#### ImageAsset
```typescript
interface ImageAsset {
  id: string;               // Unique identifier
  uri: string;              // Local or remote URI
  type: 'user' | 'fit' | 'generated'; // Type of image
  date: number;             // Timestamp
  base64?: string;          // Base64 encoded image data
}
```

#### SavedLook
```typescript
interface SavedLook {
  id: string;               // Unique identifier
  image: string;            // Generated image base64
  createdAt: number;        // Timestamp
  userImageUri?: string;    // Reference to user photo
  fitImageUri?: string;     // Reference to outfit image
}
```

#### GenerationResult
```typescript
interface GenerationResult {
  success: boolean;         // Success flag
  image?: string;          // Generated image (base64)
  error?: string;          // Error message if failed
}
```

### Data Storage Layers

#### 1. Memory (Zustand Store)
- **Fast access** during app session
- **User state**: Authentication status, profile, quota
- **UI state**: Selected images, generation status
- **Lost** when app closes

```
authStore.ts:
- user: UserProfile
- isLoading: boolean
- isDevMode: boolean
- userImg, fitImg: ImageAsset
- savedLooks: SavedLook[]
```

#### 2. Local Storage (AsyncStorage)
- **Persistent** across app sessions
- **User data**: Profile, quota, saved looks
- **Dev mode** toggle
- **Accessible** on native platforms

#### 3. Cloud (Firebase)
- **User authentication** data
- **Potential future**: Cloud sync for saved looks
- **Potential future**: User preferences, quota tracking

---

## Tech Stack

### Frontend Framework & Ecosystem
| Component | Technology | Version | Purpose |
|-----------|-----------|---------|---------|
| **Runtime** | Expo | 54.0.20 | Native app framework, handles iOS/Android/Web |
| **Navigation** | Expo Router | ~6.0.13 | File-based routing (like Next.js) |
| **Framework** | React Native | 0.81.5 | Cross-platform UI framework |
| **UI Framework** | React | 19.1.0 | Component library |
| **Styling** | NativeWind | 4.2.1 | Tailwind CSS for React Native |
| **State Management** | Zustand | 5.0.9 | Lightweight global state |
| **Animations** | React Native Reanimated | ~4.1.1 | High-performance animations |

### Backend & Services
| Service | Technology | Purpose |
|---------|-----------|---------|
| **Backend** | Express.js (Vercel) | REST API for image processing |
| **Auth** | Firebase Authentication | User login/signup, Google OAuth |
| **Storage** | AsyncStorage | Local persistent storage |
| **AI/ML** | Google Vertex AI | Virtual try-on image generation |
| **Crypto** | expo-crypto | Encryption utilities |

### Plugins & Extensions
| Plugin | Purpose |
|--------|---------|
| expo-router | File-based routing |
| expo-image-picker | Camera/gallery access |
| expo-media-library | Save generated images |
| expo-notifications | Push notifications |
| expo-font | Custom font loading |
| expo-web-browser | OAuth callback handling |
| expo-task-manager | Background tasks |

### Build & Development
| Tool | Technology | Purpose |
|------|-----------|---------|
| **Language** | TypeScript | Static type checking |
| **Build Config** | Babel + Metro | JS transpilation & bundling |
| **CSS Framework** | Tailwind CSS | Utility-first styling |
| **Dev Environment** | Expo CLI | Development server & testing |

### Environment Variables Required
```
EXPO_PUBLIC_FIREBASE_API_KEY
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN
EXPO_PUBLIC_FIREBASE_PROJECT_ID
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
EXPO_PUBLIC_FIREBASE_APP_ID
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID
EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID
```

---

## OAuth & Authentication

### Authentication Methods

#### 1. Google OAuth
**How it works:**
1. User taps "Sign in with Google" button
2. `useGoogleAuth()` hook initiates OAuth flow
3. Google login screen appears (native or web popup)
4. User authenticates and grants permissions
5. Authorization code returned to app via redirect URI
6. `signInWithGoogle()` exchanges OAuth token for Firebase credentials
7. Firebase authenticates user and returns user data
8. User profile stored in Zustand and AsyncStorage

**Key Files:**
- `lib/auth.ts` - Google OAuth setup and token exchange
- `lib/firebase.ts` - Firebase authentication logic
- `app/index.tsx` - Sign-in UI

**OAuth Configuration:**
```typescript
// Platform-specific OAuth clients
- Web: GOOGLE_WEB_CLIENT_ID
- iOS: GOOGLE_IOS_CLIENT_ID
- Android: GOOGLE_ANDROID_CLIENT_ID
```

**Redirect URIs:**
- **Web**: `http://localhost:8081/auth/callback` (dev) or production domain
- **Native**: `com.zyora.app://` (custom scheme)

#### 2. Email/Password Authentication
**Status**: Implementation available but not fully integrated
- `signInWithEmail()` - Email login
- `signUpWithEmail()` - Account creation
- `resetPassword()` - Password reset via email

#### 3. Developer Mode
**Purpose**: Testing without authentication
- Accessible via Developer Mode toggle on Auth screen
- Creates fake user profile: `zyora-developer`
- Bypasses all auth checks
- Full quota available

**Files:**
- `store/authStore.ts` - `signInAsDeveloper()` method
- `app/index.tsx` - Developer Mode button

### Security Considerations

#### Current Security Measures
✅ Firebase Authentication (industry-standard)
✅ OAuth via Google (secure delegated auth)
✅ AsyncStorage persistence (encrypted on native)
✅ Environment variables for sensitive configs
✅ HTTPS for all API calls

#### Security Gaps (See Gaps & Improvements section)
❌ No refresh token rotation
❌ No API key validation on backend
❌ No rate limiting on API endpoints
❌ No request signing or HMAC verification
❌ Firebase Rules not configured for data access

---

## High-Level Diagram

See `01-ARCHITECTURE_DIAGRAM.md` for detailed system architecture diagram.

---

## Feature Documentation

### 1. Studio Screen (`app/(tabs)/studio.tsx`)
**Purpose**: Upload and select user photo and outfit image

**Features**:
- Pick image from camera or gallery
- Display selected images
- Navigate to generation screen
- Show current quota

**User Flow**:
1. Select user photo (camera or gallery)
2. Select outfit image (camera or gallery)
3. Click "Generate" button
4. Navigate to generate screen

---

### 2. Generate Screen (`app/generate.tsx`)
**Purpose**: Process images through Vertex AI

**Features**:
- Loading animation during processing
- Error handling with retry
- Timeout handling (2 minutes default)
- Result display
- Save to Vault option
- Quota decrement

**Process**:
1. Convert images to base64
2. Call `/api/generate-look` endpoint
3. Wait for Vertex AI processing
4. Display generated image
5. Option to save or generate again

---

### 3. Vault Screen (`app/(tabs)/vault.tsx`)
**Purpose**: View and manage saved looks

**Features**:
- Grid display of saved generated images
- Delete saved looks
- Share functionality (future)
- Sort by date (newest first)

---

### 4. Profile Screen (`app/(tabs)/profile.tsx`)
**Purpose**: User account and settings management

**Features**:
- Display user info (name, email, photo)
- Show quota usage
- Settings access
- Sign out
- Help & FAQ

**Sub-routes**:
- `/profile/personal` - Edit profile information
- `/profile/preferences` - App settings
- `/profile/help` - Help & FAQ

---

### 5. Auth Screen (`app/index.tsx`)
**Purpose**: User authentication

**Features**:
- Google OAuth sign-in
- Email/Password sign-in (available)
- Developer Mode toggle
- Beautiful minimalist design

---

## Gaps & Improvements

See `02-GAPS_AND_IMPROVEMENTS.md` for comprehensive list.

