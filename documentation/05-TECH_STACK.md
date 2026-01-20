# Tech Stack Documentation

## Overview

Zyora is a cross-platform mobile application built with modern React Native and Expo technologies. It uses a sophisticated tech stack optimized for iOS, Android, and web deployment with AI-powered image processing capabilities.

---

## Frontend Technologies

### Core Framework & Runtime

#### **Expo SDK 54**
- **Version**: 54.0.20
- **Purpose**: Unified framework for building native iOS, Android, and web apps
- **Key Benefits**:
  - Write once, run on three platforms
  - Managed cloud builds via EAS Build
  - No native code required (mostly)
  - Hot reload during development
  - Over-the-air updates capability
  
**Official Docs**: https://docs.expo.dev/

---

### UI Frameworks

#### **React Native 0.81.5**
- **Purpose**: Cross-platform UI framework
- **Components Used**:
  - `View` - Container/layout component
  - `Text` - Text rendering
  - `TouchableOpacity` - Pressable buttons/areas
  - `Platform` - Platform-specific code
  - `FlatList` - Efficient list rendering
  - `Image` - Image display

#### **React 19.1.0**
- **Purpose**: Component library and state management
- **Hooks Used**:
  - `useState` - Local component state
  - `useEffect` - Side effects
  - `useContext` - Context API
  - `useCallback` - Memoization

#### **React DOM 19.1.0**
- **Purpose**: Web rendering support
- **Usage**: Renders React components to web DOM

---

### Navigation

#### **Expo Router ~6.0.13**
- **Type**: File-based routing (like Next.js)
- **File Structure**:
  ```
  app/
  ├── _layout.tsx       # Root layout
  ├── index.tsx         # Home/auth screen
  ├── generate.tsx      # Generation screen
  ├── (tabs)/
  │   ├── _layout.tsx   # Tab navigation
  │   ├── studio.tsx    # Upload screen
  │   ├── vault.tsx     # Gallery screen
  │   └── profile.tsx   # Settings screen
  └── auth/
      └── callback.tsx  # OAuth callback
  ```

**Advantages**:
- Automatic route generation from file structure
- Deep linking out of the box
- Type-safe routing
- URL-based state management (web)

**Documentation**: https://docs.expo.dev/routing/installation/

---

### Styling

#### **NativeWind 4.2.1**
- **Type**: Tailwind CSS for React Native
- **Purpose**: Utility-first styling with Tailwind classes
- **Example**:
  ```tsx
  <View className="flex-1 bg-white px-4 py-2">
    <Text className="text-lg font-bold text-gray-800">Title</Text>
  </View>
  ```

**Benefits**:
- Consistent design system
- Responsive design support
- Dark mode support
- Performance optimized

**Config**: `tailwind.config.js`

#### **Tailwind CSS 3.4.19**
- **Purpose**: Utility-first CSS framework
- **Config File**: `tailwind.config.js`
- **Output**: `global.css`

---

### State Management

#### **Zustand 5.0.9**
- **Type**: Lightweight state management
- **Store Structure**:
  ```typescript
  interface AuthState {
    user: UserProfile | null;
    isLoading: boolean;
    setUser: (user: UserProfile | null) => void;
    loadFromStorage: () => Promise<void>;
  }
  
  export const useAuthStore = create<AuthState>((set) => ({
    // State and actions
  }));
  ```

**Benefits**:
- No provider boilerplate
- Minimal bundle size (~2KB)
- Excellent TypeScript support
- Direct state access in components

**Usage**:
```tsx
const user = useAuthStore((state) => state.user);
const setUser = useAuthStore((state) => state.setUser);
```

---

### Animations

#### **React Native Reanimated ~4.1.1**
- **Purpose**: High-performance animations
- **Features Used**:
  - Animated values
  - Transitions
  - Gesture-based animations
  - 60 FPS performance

**Example**:
```typescript
import Animated, { 
  FadeIn, 
  FadeOut 
} from 'react-native-reanimated';

<Animated.View entering={FadeIn} exiting={FadeOut}>
  {/* Content */}
</Animated.View>
```

#### **React Native Gesture Handler ~2.28.0**
- **Purpose**: Touch gesture handling
- **Features**:
  - Swipe detection
  - Pan gestures
  - Button press handling
  - Native-level gesture recognition

---

### Native Modules & Utilities

#### **React Native Safe Area Context ~5.6.0**
- **Purpose**: Handle safe area insets (notches, status bars)
- **Usage**:
  ```tsx
  const insets = useSafeAreaInsets();
  <View style={{ paddingTop: insets.top }} />
  ```

#### **React Native Screens ~4.16.0**
- **Purpose**: Optimized screen component
- **Benefits**: Better memory management, smoother transitions

#### **React Native Web 0.21.0**
- **Purpose**: React Native on web browsers
- **Enables**: Running iOS/Android code on web platform

#### **React Native Worklets 0.5.1**
- **Purpose**: Run JavaScript on native thread
- **Use Case**: Performance-critical operations

---

## Backend & Services

### Express.js Server
- **Deployment**: Vercel (serverless)
- **Endpoints**:
  - `POST /api/generate-look` - Image generation
  - `GET /api/fetch-image` - Retrieve images
  - `POST /api/exchange-token` - OAuth token exchange
  - `GET /api/health` - Health check

---

### Authentication Services

#### **Firebase Authentication**
- **Purpose**: User auth and management
- **Providers Supported**:
  - Google OAuth
  - Email/Password (implemented but not UI-integrated)
  - Potential: Facebook, Apple, GitHub

**Key Methods**:
```typescript
- getAuth() - Get auth instance
- signInWithCredential() - Sign in with OAuth token
- signOut() - Sign out user
- onAuthStateChanged() - Listen for auth changes
- getIdToken() - Get JWT token for API calls
```

#### **Google OAuth via expo-auth-session**
- **Version**: Part of Expo ecosystem
- **Scopes**: profile, email, openid
- **Platforms**: Web, iOS, Android

---

### AI/ML Services

#### **Google Vertex AI**
- **Purpose**: Virtual try-on image generation
- **Model**: Custom trained model for clothing overlay
- **Input**: User photo + outfit image
- **Output**: Generated image with outfit overlaid on user

**Integration**: Via backend Express server

---

### Data Storage

#### **AsyncStorage (@react-native-async-storage)**
- **Version**: 2.2.0
- **Purpose**: Local persistent key-value storage
- **Data Stored**:
  - User profile
  - Saved looks
  - App settings
  - Dev mode toggle

**Advantages**:
- Encrypted on native platforms
- Survives app restart
- Simple API

**Limitations**:
- Not encrypted on web
- Synchronous on native, async API
- No query capabilities

---

### File System & Media

#### **Expo File System (expo-file-system)**
- **Version**: ~19.0.20
- **Purpose**: Read/write files locally
- **Usage**:
  - Convert images to base64
  - Manage temporary files
  - Cache downloaded images

#### **Expo Image Picker (expo-image-picker)**
- **Version**: ~17.0.10
- **Purpose**: Select images from camera or gallery
- **Permissions**:
  - Camera access
  - Photo library access

#### **Expo Media Library (expo-media-library)**
- **Version**: ~18.2.1
- **Purpose**: Save generated images to device gallery
- **Permissions**:
  - Photo library write access

#### **Expo Image (~3.0.10)**
- **Purpose**: Optimized image loading and caching
- **Features**:
  - Progressive loading
  - Placeholder support
  - Responsive images

---

### Notifications

#### **Expo Notifications (^0.32.16)**
- **Purpose**: Push notifications (installed but not fully implemented)
- **Features**:
  - Local notifications
  - Remote notifications (with FCM)
  - Notification scheduling

#### **Expo Task Manager (^14.0.9)**
- **Purpose**: Background task execution
- **Use Cases**:
  - Background app refresh
  - Periodic tasks

#### **Expo Background Fetch (^14.0.9)**
- **Purpose**: Background data fetching
- **Use Case**: Refresh quota in background

---

### Fonts & Typography

#### **Expo Font (~14.0.9)**
- **Purpose**: Load custom fonts
- **Current Font**: Bodoni Moda (serif)

#### **@expo-google-fonts/bodoni-moda (^0.4.2)**
- **Purpose**: Google Fonts integration
- **Font Usage**: Main typography, elegant serif style

---

### Security & Crypto

#### **Expo Crypto (~15.0.8)**
- **Purpose**: Cryptographic operations
- **Features**:
  - Digest algorithms
  - Random bytes generation
  - Encryption utilities

---

### Utilities

#### **Expo Constants (~18.0.10)**
- **Purpose**: Access app constants and build info
- **Usage**: Version, build ID, platform detection

#### **Expo Web Browser (~15.0.8)**
- **Purpose**: Open URLs in native browser
- **Usage**: OAuth flow, documentation links

#### **Expo Linear Gradient (~15.0.7)**
- **Purpose**: Linear gradient backgrounds
- **Usage**: UI backgrounds, visual effects

#### **Expo Linking (~8.0.8)**
- **Purpose**: Deep linking and URL handling
- **Features**:
  - Parse URLs
  - Handle custom schemes
  - Share content

#### **@expo/vector-icons (^15.0.3)**
- **Purpose**: Icon library (Ionicons)
- **Icons Used**: Camera, layers, person, etc.

---

## Build & Development Tools

### TypeScript (~5.9.2)
- **Purpose**: Static type checking
- **Config**: `tsconfig.json`
- **Benefits**:
  - Early error detection
  - IDE autocomplete
  - Self-documenting code

### Babel (^7.25.2)
- **Purpose**: JavaScript transpilation
- **Config**: `babel.config.cjs`
- **Plugins**:
  - `@babel/core` - Core Babel

### Metro (~)
- **Purpose**: React Native bundler
- **Config**: `metro.config.cjs`
- **Features**:
  - Module resolution
  - Asset bundling
  - Hot reload

### Tailwind CSS CLI (3.4.19)
- **Purpose**: CSS generation from Tailwind classes
- **Config**: `tailwind.config.js`

---

## Environment & Configuration

### Environment Variables

**Public Variables** (EXPO_PUBLIC_*):
```
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID
EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID
EXPO_PUBLIC_FIREBASE_API_KEY
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN
EXPO_PUBLIC_FIREBASE_PROJECT_ID
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
EXPO_PUBLIC_FIREBASE_APP_ID
```

### Configuration Files

#### `app.json`
- App metadata
- iOS/Android bundle IDs
- Permissions
- Plugins configuration

#### `tsconfig.json`
- TypeScript compiler options
- Path aliases
- Target platform

#### `tailwind.config.js`
- Theme colors
- Spacing scale
- Font families
- Dark mode

#### `metro.config.cjs`
- Metro bundler configuration
- Asset resolver

#### `babel.config.cjs`
- Babel plugins
- TypeScript preset

---

## Platform-Specific Code

### iOS
**Bundle ID**: `com.zyora.app`
**Minimum Deployment Target**: iOS 13+
**Capabilities**:
- Camera access
- Photo library access
- Notifications
- Deep linking

### Android
**Package Name**: `com.zyora.app`
**Target SDK**: API 34+
**Minimum SDK**: API 21+
**Permissions**:
- CAMERA
- READ_EXTERNAL_STORAGE
- WRITE_EXTERNAL_STORAGE
- POST_NOTIFICATIONS

### Web
**Bundler**: Metro
**Output**: Static files
**CORS Headers**: Configured in `app.json`

---

## Package Dependencies Summary

### Core Dependencies (15)
- expo: 54.0.20
- expo-router: ~6.0.13
- react: 19.1.0
- react-native: 0.81.5
- react-native-web: 0.21.0
- zustand: 5.0.9
- firebase: ^12.7.0
- nativewind: 4.2.1

### Expo Modules (12+)
- expo-auth-session
- expo-image-picker
- expo-media-library
- expo-notifications
- expo-file-system
- expo-crypto
- expo-font
- expo-linear-gradient
- expo-linking
- expo-web-browser
- expo-constants
- expo-task-manager
- expo-background-fetch

### UI/Animation Libraries (4)
- react-native-reanimated: ~4.1.1
- react-native-gesture-handler: ~2.28.0
- react-native-safe-area-context: ~5.6.0
- react-native-screens: ~4.16.0

### Font Libraries (2)
- expo-font: ~14.0.9
- @expo-google-fonts/bodoni-moda: ^0.4.2

### Vector Icons (1)
- @expo/vector-icons: ^15.0.3

### Storage (1)
- @react-native-async-storage/async-storage: 2.2.0

### Google OAuth (1)
- @react-oauth/google: ^0.13.4

### Dev Dependencies (4)
- typescript: ~5.9.2
- tailwindcss: 3.4.19
- @babel/core: ^7.25.2
- @types/react: ~19.1.10

**Total**: ~40 dependencies, well-curated and minimal

---

## Technology Rationale

### Why Expo?
- ✅ Fastest way to develop cross-platform apps
- ✅ Managed cloud builds (no native compilation needed)
- ✅ OTA updates for hot fixes
- ✅ Rich ecosystem of pre-built modules
- ✅ Good for MVP and rapid development

### Why React Native?
- ✅ Single codebase for iOS/Android
- ✅ JavaScript/TypeScript (faster development)
- ✅ Large community and ecosystem
- ✅ Good performance for most use cases

### Why Zustand?
- ✅ Minimal bundle size
- ✅ No provider boilerplate
- ✅ Excellent TypeScript support
- ✅ Perfect for medium-sized apps

### Why Firebase?
- ✅ Managed auth service
- ✅ No backend infrastructure needed initially
- ✅ Easy Google OAuth integration
- ✅ Firestore for future data storage

### Why Tailwind CSS?
- ✅ Utility-first approach
- ✅ Consistent design system
- ✅ NativeWind brings it to React Native
- ✅ Small CSS bundle

---

## Performance Metrics

### Bundle Size
- **iOS**: ~45-60 MB
- **Android**: ~50-70 MB
- **Web**: ~2-3 MB (gzipped)

### Runtime Performance
- **Startup**: <3 seconds (target)
- **Image Generation**: 30-120 seconds (API-dependent)
- **Frame Rate**: 60 FPS (using Reanimated)

### Network
- **API Latency**: <500ms (health check)
- **Image Upload**: Depends on image size (max 10MB)
- **Timeout**: 120 seconds (generation)

---

## Deployment

### iOS Deployment
**Process**:
1. Build with EAS Build: `eas build --platform ios`
2. Upload to TestFlight for beta testing
3. Submit to App Store for review
4. Distributed via App Store

### Android Deployment
**Process**:
1. Build with EAS Build: `eas build --platform android`
2. Upload to Google Play Console
3. Distributed via Google Play Store

### Web Deployment
**Process**:
1. Export web build: `expo export --platform web`
2. Deploy to hosting (Vercel, Netlify, etc.)
3. Available via web URL

---

## Development Workflow

### Local Development
```bash
# Install dependencies
npm install

# Start dev server
npm start

# Run on iOS Simulator
npm run ios

# Run on Android Emulator
npm run android

# Run on web
npm run web
```

### Testing
```bash
# Run tests (when configured)
npm test

# Run linter
npm run lint

# Run type check
npm run type-check
```

### Building
```bash
# Build for iOS
eas build --platform ios

# Build for Android
eas build --platform android

# Export web
expo export --platform web
```

---

## Future Technology Considerations

### Potential Additions
- **Backend Database**: PostgreSQL via Supabase or Firebase Firestore
- **E2E Testing**: Detox for comprehensive testing
- **Analytics**: Firebase Analytics or Mixpanel
- **Error Tracking**: Sentry for production monitoring
- **Push Notifications**: Firebase Cloud Messaging

### Potential Upgrades
- **React Native**: Stay current with latest versions
- **Expo SDK**: Upgrade annually with new features
- **TypeScript**: Latest versions for better type safety
- **Tailwind CSS**: New features and utilities

