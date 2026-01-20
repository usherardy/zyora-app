# Getting Started & Setup Guide

## Quick Reference

- **App Name**: Zyora Mobile (Virtual Fashion Try-On)
- **Type**: React Native + Expo cross-platform app
- **Platforms**: iOS, Android, Web
- **Language**: TypeScript
- **Package Manager**: npm
- **Backend**: Express.js (Vercel)
- **Database**: Firebase (auth), AsyncStorage (local)

---

## Prerequisites

### Required Software
- **Node.js**: 18+ (https://nodejs.org/)
- **npm**: 9+ (comes with Node.js)
- **Git**: Latest (https://git-scm.com/)
- **Expo CLI**: `npm install -g expo-cli`

### Optional (for native testing)
- **iOS Simulator**: Xcode (macOS only)
- **Android Emulator**: Android Studio
- **Physical device**: For testing on device

### Accounts Required
- **Google Cloud Account**: For OAuth credentials
- **Firebase Account**: For authentication
- **Expo Account**: For building and publishing (optional)

---

## Installation

### 1. Clone Repository
```bash
git clone https://github.com/yourusername/zyora-app.git
cd zyora-app
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables

Create `.env` file in root directory:
```env
# Google OAuth Credentials
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=your_web_client_id.apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=your_ios_client_id.apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=your_android_client_id.apps.googleusercontent.com

# Firebase Configuration
EXPO_PUBLIC_FIREBASE_API_KEY=your_api_key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your_bucket.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
EXPO_PUBLIC_FIREBASE_APP_ID=your_app_id
```

**How to Get Credentials**:
- See [05-TECH_STACK.md](05-TECH_STACK.md#google-oauth-configuration) for detailed instructions

### 4. Start Development Server
```bash
npm start
```

Output:
```
Expo DevTools is running at http://localhost:19000
Use the following URL to open your project:
  exp://192.168.1.100:19000
Press i to open iOS Simulator
Press a to open Android Emulator
Press w to open web
```

---

## Running the App

### Option 1: Expo Go (Easiest for Testing)
```bash
npm start
# Then scan QR code with Expo Go app (available on iOS/Android app stores)
```

**Pros**: Instant testing, no build needed
**Cons**: Some native modules may not work

### Option 2: iOS Simulator
```bash
npm run ios
# or
npm start
# Then press 'i'
```

**Requirements**: macOS with Xcode
**Build Time**: ~5 minutes first run

### Option 3: Android Emulator
```bash
npm run android
# or
npm start
# Then press 'a'
```

**Requirements**: Android Studio installed and emulator running
**Build Time**: ~5 minutes first run

### Option 4: Web Browser
```bash
npm run web
# or
npm start
# Then press 'w'
```

**Pros**: Quick iteration, uses web browser
**Cons**: Some native features may not work

### Option 5: Physical Device
1. Install Expo Go app on your device
2. Run `npm start` on computer
3. Scan QR code with device camera
4. App opens in Expo Go

---

## Development Workflow

### Project Structure
```
zyora-app/
├── app/                    # Expo Router screens (file-based routing)
├── lib/                    # Business logic
├── store/                  # Zustand state management
├── types/                  # TypeScript type definitions
├── constants/              # App configuration
├── hooks/                  # Custom React hooks
├── assets/                 # Images, fonts
├── documentation/          # Project documentation
├── package.json           # Dependencies
├── app.json               # Expo configuration
├── tsconfig.json          # TypeScript config
├── tailwind.config.js     # Tailwind CSS config
└── .env                   # Environment variables
```

### Common Commands

```bash
# Development
npm start              # Start development server
npm run ios           # Run iOS Simulator
npm run android       # Run Android Emulator
npm run web           # Run web version

# Building
eas build             # Build for all platforms
eas build --platform ios      # Build for iOS
eas build --platform android  # Build for Android
expo export --platform web    # Export web static build

# Code Quality
npm run lint          # Run linter (when configured)
npm test              # Run tests (when configured)

# Cleanup
npm run clean         # Remove build artifacts
rm -rf node_modules   # Remove dependencies (then npm install)
```

### Hot Reload & Fast Refresh
- **Automatic**: Saves trigger instant reload
- **Manual**: Press 'r' in terminal to reload
- **Full Reload**: Press 'R' (Shift+R) for full restart

---

## Testing the App

### Manual Testing Checklist

#### Authentication
- [ ] Sign in with Google
- [ ] Sign in with Developer Mode
- [ ] Sign out
- [ ] Verify user data persists on restart

#### Studio Screen
- [ ] Pick image from camera
- [ ] Pick image from gallery
- [ ] Display selected images
- [ ] Navigate to generate

#### Generate Screen
- [ ] Loading animation displays
- [ ] Image generation succeeds
- [ ] Error handling works (test with invalid images)
- [ ] Timeout handling works
- [ ] Save to Vault works

#### Vault Screen
- [ ] Display saved looks
- [ ] Delete saved looks
- [ ] Verify deletion works

#### Profile Screen
- [ ] Display user info
- [ ] Show quota usage
- [ ] Sign out functionality

### Automated Testing (When Configured)
```bash
# Unit tests
npm test

# E2E tests
npm run test:e2e

# Test coverage
npm test -- --coverage
```

---

## Debugging

### Debug Tools

#### Expo DevTools
```bash
npm start
# Access at http://localhost:19000
# Available tools:
# - Network inspector
# - Performance profiler
# - Source maps
```

#### React Developer Tools
```bash
# Install browser extension for Chrome/Firefox
# Inspect React components
# View props and state
```

#### React Native Debugger
```bash
# Download: https://github.com/jhen0409/react-native-debugger
# Connect: Press Ctrl+M (Android) or Cmd+D (iOS) in emulator
# Features:
# - Console logging
# - Network inspection
# - Redux/Zustand state inspection
```

### Common Issues & Solutions

#### Issue: "Cannot find module"
```bash
# Solution: Clear cache
rm -rf node_modules package-lock.json
npm install
```

#### Issue: "Port 19000 already in use"
```bash
# Solution: Kill process on port
lsof -ti:19000 | xargs kill -9
npm start
```

#### Issue: "Unexpected application state"
```bash
# Solution: Hard reset
expo logout
expo login
npm start
```

#### Issue: "Image not displaying"
- Verify image path is correct
- Check permissions (camera, gallery)
- Test with different image size

#### Issue: "Google OAuth not working"
- Verify OAuth credentials are correct
- Check redirect URIs match configuration
- Test in web first (simpler debugging)

---

## Building for Distribution

### Prerequisites for Building
```bash
# Login to Expo
eas login

# Initialize EAS
eas build:configure
```

### Building for iOS
```bash
# Create development build
eas build --platform ios --profile preview

# Create production build
eas build --platform ios --profile production

# Submit to App Store
eas submit --platform ios
```

**Requirements**:
- Apple Developer Account ($99/year)
- Signing certificate

### Building for Android
```bash
# Create development build
eas build --platform android --profile preview

# Create production build
eas build --platform android --profile production

# Submit to Play Store
eas submit --platform android
```

**Requirements**:
- Google Play Developer Account ($25 one-time)
- Signing keystore

### Building for Web
```bash
# Export static web build
expo export --platform web

# Deploy to hosting (Vercel, Netlify, etc.)
# From dist/ directory
```

---

## Environment Variables

### Development (.env)
```env
# Public - safe to commit (but use real values)
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=dev_client_id
EXPO_PUBLIC_FIREBASE_API_KEY=dev_api_key
```

### Staging (EAS Secrets)
```bash
eas secret:create --scope project EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID
eas secret:create --scope project EXPO_PUBLIC_FIREBASE_API_KEY
```

### Production (EAS Secrets)
```bash
# Use same command as staging
# Different values for prod credentials
```

---

## Performance Optimization

### Bundle Size Analysis
```bash
# Analyze bundle size
expo optimize

# See what's included
expo export --platform web
# Check dist/ folder size
```

### Common Optimizations
- Remove unused imports
- Use code splitting
- Lazy load heavy components
- Optimize images (compress before upload)
- Use production builds for deployment

---

## Useful Resources

### Documentation
- [Expo Documentation](https://docs.expo.dev/)
- [React Native Docs](https://reactnative.dev/)
- [Firebase Documentation](https://firebase.google.com/docs)
- [Tailwind CSS](https://tailwindcss.com/)

### Tools
- [Expo Snack](https://snack.expo.dev/) - Online editor
- [Firebase Console](https://console.firebase.google.com/)
- [Google Cloud Console](https://console.cloud.google.com/)

### Community
- [Expo Forums](https://forums.expo.dev/)
- [React Native Community](https://reactnative.dev/help)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/react-native)

---

## Troubleshooting Guide

### Installation Issues

#### "npm install fails"
```bash
# Clear npm cache
npm cache clean --force

# Try installing again
npm install

# If still fails, try:
npm install --legacy-peer-deps
```

#### "Node version incompatibility"
```bash
# Check Node version
node --version

# Should be 18+
# Update Node: https://nodejs.org/
```

### Runtime Issues

#### App crashes on startup
1. Check console for error messages
2. Clear cache: `rm -rf node_modules .expo`
3. Reinstall: `npm install`
4. Hard reset: `expo logout && expo login`

#### OAuth not working
1. Verify credentials in `.env`
2. Test different platforms (web first)
3. Check OAuth redirect URIs
4. Verify device clock is synced

#### Network requests failing
1. Check backend API is running
2. Verify API endpoint in `constants/index.ts`
3. Test with curl: `curl https://zyora-api.vercel.app/api/health`
4. Check CORS settings in backend

#### Image upload failing
1. Check file size (<10MB)
2. Verify image format (JPEG/PNG)
3. Check storage permissions
4. Test with different image

---

## Next Steps

### After Setup
1. ✅ Run the app in development
2. ✅ Test with Google OAuth
3. ✅ Test all screens
4. ✅ Try generating a look
5. ✅ Verify vault saving

### Before Deployment
1. ⚠️ Complete all tests
2. ⚠️ Implement missing security measures (see [02-GAPS_AND_IMPROVEMENTS.md](02-GAPS_AND_IMPROVEMENTS.md))
3. ⚠️ Set up CI/CD pipeline
4. ⚠️ Create privacy policy
5. ⚠️ Configure app store listings

### For Production
1. See [02-GAPS_AND_IMPROVEMENTS.md](02-GAPS_AND_IMPROVEMENTS.md) for critical items
2. Follow deployment guide when ready
3. Set up monitoring and logging
4. Plan rollback strategy

---

## Support & Help

### Getting Help
- Check [Gaps & Improvements](02-GAPS_AND_IMPROVEMENTS.md) for common issues
- Review [Architecture Documentation](01-ARCHITECTURE_DIAGRAM.md)
- Read relevant tech stack docs
- Search GitHub issues

### Reporting Issues
1. Check if issue already reported
2. Provide reproduction steps
3. Include error messages
4. Mention platform and versions
5. Attach screenshots/logs

