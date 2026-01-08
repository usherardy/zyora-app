# ZYORA App Troubleshooting Guide

## Common Issues & Fixes

### 1. App Not Loading / Stuck on Loading Screen

**Check:**
- Open Expo Go and check the terminal for errors
- Look for red error messages in the Metro bundler
- Check if `expo-web-browser` is installed: `npm list expo-web-browser`

**Fix:**
```bash
cd zyora-mobile
npm install
npx expo start --clear
```

### 2. Google Auth Not Working

**Check:**
- Verify Google Client IDs are set in `constants/index.ts`
- Check Android client ID is defined (required for Android)

**Fix:**
- Set `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` in `.env` or `constants/index.ts`
- For Android, ensure `GOOGLE_ANDROID_CLIENT_ID` is set

### 3. Image Generation Failing

**Check:**
- Backend is running at `https://zyora-szo7.vercel.app`
- Check network tab for API errors
- Verify images are being uploaded correctly

**Test Backend:**
```bash
curl https://zyora-szo7.vercel.app/health
```

### 4. Navigation Not Working

**Check:**
- Profile routes exist in `app/profile/`
- Routes are properly exported
- No syntax errors in route files

**Fix:**
- Restart Expo: `npx expo start --clear`
- Check console for route errors

### 5. Images Not Uploading

**Check:**
- Permissions granted for camera roll
- Image picker is working
- Base64 conversion is successful

**Fix:**
- Grant permissions when prompted
- Check `expo-image-picker` is installed

## Quick Diagnostic Commands

```bash
# Check all dependencies
npm list --depth=0

# Clear cache and restart
npx expo start --clear

# Check for TypeScript errors
npx tsc --noEmit

# Test backend connection
curl https://zyora-szo7.vercel.app/health
```

## Current Status

✅ **Working:**
- App structure and navigation
- Profile screens (Personal, Preferences, Help)
- Developer mode authentication
- Image picker
- Storage (AsyncStorage)

⚠️ **Needs Configuration:**
- Google OAuth (needs Client IDs)
- Backend connection (verify Vercel deployment)

🔧 **Fixed:**
- Android client ID error
- expo-web-browser missing
- API file upload format for React Native

