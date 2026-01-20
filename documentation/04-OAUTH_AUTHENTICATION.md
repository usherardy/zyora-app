# OAuth & Authentication Architecture

## Overview

Zyora implements multiple authentication methods with Google OAuth as the primary flow and email/password as a secondary option. Firebase handles all user authentication and management.

---

## Authentication Methods

### 1. Google OAuth (Primary)

#### How It Works

**Step-by-Step Flow**:

1. **User Initiates Sign-In**
   - User taps "Sign in with Google" button on Auth screen
   - App calls `useGoogleAuth()` hook from `lib/auth.ts`

2. **OAuth Request**
   - `expo-auth-session` library initiates OAuth flow
   - Platform-specific OAuth client ID used:
     - **Web**: `GOOGLE_WEB_CLIENT_ID`
     - **iOS**: `GOOGLE_IOS_CLIENT_ID`
     - **Android**: `GOOGLE_ANDROID_CLIENT_ID`

3. **User Authentication**
   - Native OAuth screen appears (platform-specific)
   - User enters Google credentials
   - User grants permissions (email, profile)
   - Google generates authorization code/token

4. **Authorization Callback**
   - Google redirects to app via callback URI
   - Redirect URIs configured:
     - **Web**: `http://localhost:8081/auth/callback` (dev) or production URL
     - **Native**: `com.zyora.app://` (custom scheme)

5. **Token Exchange**
   - App receives OAuth token from Google
   - App sends token to Firebase via `signInWithGoogleCredential()`

6. **Firebase Authentication**
   - Firebase validates OAuth token
   - Firebase creates/updates user record
   - Firebase returns authenticated user object

7. **Local Storage**
   - User profile stored in Zustand store
   - User profile persisted to AsyncStorage
   - User marked as authenticated

**Code Implementation** (`lib/auth.ts`):
```typescript
export const useGoogleAuth = () => {
  const [request, response, promptAsync] = Google.useAuthRequest({
    webClientId: GOOGLE_WEB_CLIENT_ID,
    iosClientId: GOOGLE_IOS_CLIENT_ID,
    androidClientId: GOOGLE_ANDROID_CLIENT_ID,
    scopes: ['profile', 'email', 'openid'],
    redirectUri: redirectUrl,
    ...(Platform.OS === 'web' && { responseType: 'id_token token' }),
  });

  return { request, response, promptAsync };
};

export async function signInWithGoogle(idToken: string, accessToken?: string) {
  try {
    const firebaseUser = await signInWithGoogleCredential(idToken, accessToken);
    return firebaseUserToProfile(firebaseUser);
  } catch (error) {
    console.error('Google sign in error:', error);
    throw error;
  }
}
```

#### OAuth Configuration

**Environment Variables Required**:
```
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=...
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=...
EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=...
```

**How to Get OAuth Credentials**:

1. **Create Google Cloud Project**
   - Go to [Google Cloud Console](https://console.cloud.google.com)
   - Create new project named "Zyora"
   - Enable OAuth Consent Screen

2. **Create Web Client ID**
   - Go to Credentials → Create Credential → OAuth Client ID
   - Application type: Web Application
   - Name: "Zyora Web"
   - Add authorized redirect URIs:
     - `http://localhost:8081/auth/callback`
     - `https://yourdomain.com/auth/callback`
   - Copy Client ID

3. **Create iOS Client ID**
   - Application type: iOS
   - Name: "Zyora iOS"
   - Bundle ID: `com.zyora.app`
   - Copy Client ID

4. **Create Android Client ID**
   - Application type: Android
   - Name: "Zyora Android"
   - Package name: `com.zyora.app`
   - Get SHA-1 fingerprint: `keytool -list -v -keystore ~/.android/debug.keystore`
   - Copy Client ID

**Redirect URIs**:
| Platform | Redirect URI | Purpose |
|----------|--------------|---------|
| Web (Dev) | `http://localhost:8081/auth/callback` | Local testing |
| Web (Prod) | `https://yourdomain.com/auth/callback` | Production |
| iOS/Android | `com.zyora.app://` | Custom scheme |

**Scopes Requested**:
- `profile` - Access user name and picture
- `email` - Access user email
- `openid` - Get ID token (recommended)

#### Security Features
✅ Delegated authentication (no password stored)
✅ HTTPS-only communication
✅ Scope limitation
✅ Refresh tokens from Firebase

#### Security Gaps
❌ No PKCE on web (should be added)
❌ No state parameter validation
❌ Redirect URIs not fully validated on native

---

### 2. Email & Password Authentication (Secondary)

#### Implementation Status
**Status**: 60% implemented (code exists, UI not fully integrated)

**Available Functions** (`lib/auth.ts`):
```typescript
export async function signInWithEmail(email: string, password: string)
export async function signUpWithEmail(email: string, password: string)
export async function resetPassword(email: string)
```

**Firebase Implementation** (`lib/firebase.ts`):
```typescript
export async function signInWithEmail(email: string, password: string) {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  return userCredential.user;
}

export async function signUpWithEmail(email: string, password: string) {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  return userCredential.user;
}

export async function resetPassword(email: string) {
  await sendPasswordResetEmail(auth, email);
}
```

**Missing UI Components**:
- Email/password sign-up screen
- Email/password sign-in screen
- Password reset flow
- Email verification

**To Enable**:
1. Add email/password options to Auth screen (`app/index.tsx`)
2. Create email verification flow
3. Implement password reset UI
4. Add password strength validation

---

### 3. Developer Mode

#### Purpose
Bypass authentication for testing without Firebase setup

#### How It Works
```typescript
// In authStore.ts
signInAsDeveloper() {
  const devUser: UserProfile = {
    uid: 'zyora-developer',
    displayName: 'Developer',
    email: 'dev@zyora.local',
    photoURL: null,
    quota: MAX_FREE_QUOTA,
    maxQuota: MAX_FREE_QUOTA,
  };
  
  this.setUser(devUser);
  this.setDevMode(true);
}
```

#### Usage
1. Open Auth screen
2. Tap "Developer Mode" toggle
3. Tap "Sign in as Developer"
4. Full app access with 10 free generations

#### Limitations
- No persistence (data lost on restart)
- No cloud sync
- Local-only storage

---

## Firebase Integration

### Initialization

**Configuration** (`lib/firebase.ts`):
```typescript
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

let auth: Auth;
if (Platform.OS !== 'web') {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
} else {
  auth = getAuth(app);
}
```

### Environment Variables Required
```
EXPO_PUBLIC_FIREBASE_API_KEY
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN
EXPO_PUBLIC_FIREBASE_PROJECT_ID
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
EXPO_PUBLIC_FIREBASE_APP_ID
```

**How to Get Firebase Credentials**:

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create new project named "Zyora"
3. Enable Authentication:
   - Go to Authentication → Sign-in method
   - Enable "Google" as provider
4. Get Firebase config:
   - Go to Project Settings → Your apps
   - Select web app
   - Copy config values

### User Persistence

**Current Implementation**:
```typescript
// On app start
onAuthStateChanged(auth, (user) => {
  if (user) {
    // User logged in
    const profile = firebaseUserToProfile(user);
    useAuthStore.setState({ user: profile });
  } else {
    // User logged out
    useAuthStore.setState({ user: null });
  }
});
```

**Flow**:
1. App starts
2. Firebase checks for existing session
3. If session valid → restore user automatically
4. If session expired → user sees auth screen

### Token Management

**Current Issues**:
- No refresh token rotation
- No token expiry handling
- No automatic re-authentication

**Recommended Improvements**:
```typescript
// Implement token refresh
const refreshToken = async () => {
  if (auth.currentUser) {
    const token = await auth.currentUser.getIdToken(true);
    // Store securely
    return token;
  }
};

// Auto-refresh before expiry
setInterval(() => {
  if (auth.currentUser) {
    refreshToken();
  }
}, 55 * 60 * 1000); // Every 55 minutes
```

---

## Security Considerations

### Current Security Measures

✅ **OAuth via Google**
- Delegated authentication
- No passwords stored in app
- Google handles credential security

✅ **Firebase Authentication**
- Industry-standard platform
- Encrypted credential storage
- Automatic session management

✅ **HTTPS Communication**
- All network requests encrypted
- Certificates validated

✅ **Local Storage**
- AsyncStorage has encryption on native platforms
- Development builds use secure storage

### Security Gaps & Improvements

#### 1. **No API Key Validation** 🔴 CRITICAL
**Issue**: Backend API accepts requests from anyone
**Solution**: Implement JWT token validation
```typescript
// Frontend: Include Firebase token
const token = await auth.currentUser?.getIdToken();
fetch('/api/generate-look', {
  headers: { 'Authorization': `Bearer ${token}` }
});

// Backend: Validate token
const decodedToken = await admin.auth().verifyIdToken(token);
const uid = decodedToken.uid;
```

#### 2. **No PKCE on Web** 🟡 HIGH
**Issue**: OAuth flow doesn't use PKCE
**Impact**: Vulnerable to authorization code interception
**Solution**: Enable PKCE in Google OAuth configuration

#### 3. **No Rate Limiting** 🔴 CRITICAL
**Issue**: No protection against brute force or abuse
**Solution**: Implement rate limiting on auth endpoints
```
Max 5 login attempts per 15 minutes per IP
Max 3 password reset requests per hour per email
```

#### 4. **Token Storage** 🟡 HIGH
**Issue**: Firebase tokens stored in AsyncStorage (partially encrypted)
**Solution**: Use secure storage for sensitive data
- Native: Secure Enclave (iOS), KeyStore (Android)
- Web: Memory only, no localStorage

#### 5. **Sensitive Data Logging** 🟡 HIGH
**Issue**: Tokens or user emails might be logged
**Solution**: Audit and remove sensitive data from logs

#### 6. **No OAuth State Parameter** 🟡 MEDIUM
**Issue**: Incomplete CSRF protection
**Solution**: Validate state parameter in callback
```typescript
const state = generateRandomString();
// Include in OAuth request
// Validate in callback
```

---

## API Authentication Flow

### Backend Token Validation

**Recommended Implementation**:

```typescript
// backend/middleware/auth.ts
import * as admin from 'firebase-admin';

export const verifyAuthToken = async (req, res, next) => {
  const token = req.headers.authorization?.split('Bearer ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }
  
  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.uid = decodedToken.uid;
    req.email = decodedToken.email;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid token' });
  }
};

// backend/routes/generate-look.ts
app.post('/api/generate-look', verifyAuthToken, async (req, res) => {
  const uid = req.uid;
  
  // Check quota from database
  const userQuota = await getUserQuota(uid);
  if (userQuota.current >= userQuota.max) {
    return res.status(402).json({ error: 'Quota exceeded' });
  }
  
  // Process generation
  // ...
  
  // Increment quota
  await incrementUserQuota(uid);
});
```

---

## Authentication State Management

### Zustand Auth Store

**State Structure**:
```typescript
interface AuthState {
  // Auth data
  user: UserProfile | null;
  isLoading: boolean;
  isDevMode: boolean;
  
  // Actions
  setUser(user: UserProfile | null): void;
  setLoading(loading: boolean): void;
  setDevMode(enabled: boolean): void;
  signOut(): void;
  loadFromStorage(): Promise<void>;
}
```

**Initialization** (`app/_layout.tsx`):
```typescript
useEffect(() => {
  const init = async () => {
    await loadFromStorage(); // Load user from AsyncStorage
    setAppReady(true);
  };
  init();
}, []);
```

**Usage in Components**:
```typescript
const user = useAuthStore((state) => state.user);
const isLoading = useAuthStore((state) => state.isLoading);

if (isLoading) return <LoadingScreen />;
if (!user) return <AuthScreen />;
return <MainApp />;
```

---

## Logout Flow

```typescript
export async function signOut() {
  try {
    // Firebase sign out
    await firebaseSignOut();
    
    // Clear Zustand
    useAuthStore.setState({ user: null });
    
    // Clear AsyncStorage
    await AsyncStorage.removeItem(STORAGE_KEYS.USER);
    
    // Clear local images
    useAuthStore.setState({
      userImg: null,
      fitImg: null,
      savedLooks: []
    });
    
  } catch (error) {
    console.error('Sign out error:', error);
  }
}
```

---

## Testing Authentication

### Unit Tests Needed

```typescript
describe('Google OAuth', () => {
  it('should exchange Google token for Firebase credentials', async () => {
    // Mock Google OAuth response
    // Mock Firebase signIn
    // Assert user profile returned
  });
  
  it('should handle invalid OAuth token', async () => {
    // Assert error thrown
    // Assert user not set
  });
});

describe('Email Authentication', () => {
  it('should sign up with email and password', async () => {
    // Call signUpWithEmail
    // Assert user created
    // Assert email verified
  });
  
  it('should reject weak password', async () => {
    // Assert Firebase rejects
  });
});

describe('Token Refresh', () => {
  it('should refresh expired token automatically', async () => {
    // Mock token expiry
    // Assert token refreshed
  });
});
```

### Integration Tests

```typescript
describe('Full Auth Flow', () => {
  it('should allow user to sign in and access app', async () => {
    // 1. Start app
    // 2. Verify auth screen shown
    // 3. Mock Google OAuth
    // 4. Tap sign in
    // 5. Assert (tabs) screens shown
    // 6. Assert user persisted
    // 7. Close app
    // 8. Restart app
    // 9. Assert user restored
  });
});
```

---

## Multi-Device Synchronization (Future)

**Current State**: No multi-device sync

**Recommended Solution**:
1. Store user profile in Firebase Firestore
2. Use Firestore real-time listeners
3. Sync saved looks across devices
4. Merge conflicts handling

```typescript
// Listen for user profile changes
const unsubscribe = onSnapshot(
  doc(db, 'users', uid),
  (doc) => {
    const profile = doc.data();
    useAuthStore.setState({ user: profile });
  }
);
```

---

## Conclusion

Zyora's authentication is well-structured with Google OAuth as the primary method and Firebase as the backend. However, before production deployment, implement:

1. **Critical**: API key validation (JWT)
2. **Critical**: Rate limiting on auth endpoints
3. **High**: PKCE on web
4. **High**: Secure token storage
5. **High**: Audit logging (no sensitive data)

See `02-GAPS_AND_IMPROVEMENTS.md` for comprehensive security recommendations.

