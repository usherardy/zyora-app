# Zyora Mobile - Virtual Fashion Try-On App

A React Native (Expo) app for virtual fashion try-on, powered by Google Vertex AI.

## 🎨 Design

Beautiful, minimalist design with:
- Elegant serif typography (Playfair Display)
- Clean, modern UI with subtle animations
- Dark/light mode support
- Floating pill-shaped bottom navigation

## 🚀 Features

- **Virtual Try-On**: Upload your photo and any outfit to see how it looks on you
- **AI-Powered**: Uses Google Vertex AI for realistic clothing overlay
- **Multi-Platform**: Works on iOS, Android, and Web
- **Developer Mode**: Bypass authentication for testing
- **Saved Looks**: Keep your favorite generated looks
- **Quota System**: Track your monthly generations

## 📱 Screens

1. **Auth Screen**: Beautiful sign-in with Google OAuth + Developer Mode
2. **Studio**: Upload your photo and outfit image (file or URL)
3. **Generate**: AI processing with animated loading state
4. **Vault**: Gallery of your saved looks
5. **Profile**: User info, quota, and settings

## 🛠 Tech Stack

- **Framework**: Expo SDK 52
- **Navigation**: Expo Router (file-based routing)
- **Styling**: NativeWind (Tailwind CSS for React Native)
- **State Management**: Zustand
- **Animations**: React Native Reanimated
- **Backend**: Existing Express/Vercel backend with Vertex AI

## 📋 Prerequisites

1. Node.js 18+
2. Expo CLI (`npm install -g expo-cli`)
3. iOS Simulator (Mac) or Android Emulator
4. Firebase project with Authentication enabled
5. Google Cloud project with Vertex AI API enabled

## 🔧 Setup

### 1. Install Dependencies

```bash
cd zyora-mobile
npm install
```

### 2. Configure Environment Variables

Copy the example environment file and fill in your values:

```bash
cp .env.example .env
```

Required variables:
- `EXPO_PUBLIC_FIREBASE_*`: Your Firebase configuration
- `EXPO_PUBLIC_GOOGLE_*_CLIENT_ID`: Google OAuth client IDs

### 3. Add Fonts

Download and place these fonts in `assets/fonts/`:
- `PlayfairDisplay-Regular.ttf`
- `PlayfairDisplay-Bold.ttf`
- `PlayfairDisplay-Italic.ttf`
- `Inter-Regular.ttf`
- `Inter-Medium.ttf`
- `Inter-Bold.ttf`

You can download them from [Google Fonts](https://fonts.google.com/).

### 4. Add App Icons

Place your app icons in `assets/`:
- `icon.png` (1024x1024)
- `adaptive-icon.png` (1024x1024, for Android)
- `splash.png` (1284x2778, splash screen)
- `favicon.png` (32x32, for web)

### 5. Firebase Setup

**For iOS:**
- Download `GoogleService-Info.plist` from Firebase Console
- Place it in the project root

**For Android:**
- Download `google-services.json` from Firebase Console
- Place it in the project root

## 🚀 Running the App

### Development

```bash
# Start Expo development server
npm start

# Run on iOS simulator
npm run ios

# Run on Android emulator
npm run android

# Run in web browser
npm run web
```

### Building for Production

```bash
# Install EAS CLI
npm install -g eas-cli

# Configure EAS
eas build:configure

# Build for iOS
eas build --platform ios

# Build for Android
eas build --platform android
```

## 📁 Project Structure

```
zyora-mobile/
├── app/                    # Expo Router screens
│   ├── (tabs)/            # Tab-based navigation
│   │   ├── _layout.tsx    # Tab layout with bottom nav
│   │   ├── studio.tsx     # Main upload screen
│   │   ├── vault.tsx      # Saved looks gallery
│   │   └── profile.tsx    # User profile
│   ├── _layout.tsx        # Root layout
│   ├── index.tsx          # Auth screen
│   └── generate.tsx       # AI generation modal
├── assets/                # Static assets
│   ├── fonts/            # Custom fonts
│   └── images/           # Images and icons
├── components/            # Reusable components
├── constants/             # App constants
├── lib/                   # Utilities and API
│   ├── api.ts            # Backend API calls
│   └── storage.ts        # AsyncStorage helpers
├── store/                 # Zustand state store
│   └── authStore.ts      # Auth and app state
├── types/                 # TypeScript types
├── app.json              # Expo configuration
├── package.json          # Dependencies
└── tailwind.config.js    # NativeWind config
```

## 🔐 Authentication Flow

1. **Google Sign-In**: Uses `@react-native-google-signin/google-signin`
2. **Developer Mode**: Bypasses auth for testing (creates mock user)
3. **Persistence**: User state saved to AsyncStorage

## 🎯 Backend Integration

The app connects to your existing Vercel backend:

- `POST /generate-look`: Sends images to Vertex AI
- `GET /fetch-image`: Proxies external image URLs
- `GET /health`: Health check endpoint

No changes needed to your existing backend!

## 📝 Developer Mode

To test without Google authentication:

1. Tap "Developer Mode" on the auth screen
2. A mock user is created with full quota
3. All features work normally

## 🎨 Customization

### Colors

Edit `tailwind.config.js` to customize the color palette:

```js
colors: {
  zyora: {
    black: '#000000',
    white: '#FFFFFF',
    accent: '#FFD700',
    // Add your colors
  },
}
```

### Fonts

Add new fonts to `assets/fonts/` and register them in `app/_layout.tsx`.

## 🐛 Troubleshooting

### "Metro bundler failed to start"
```bash
npx expo start --clear
```

### "Firebase not configured"
Ensure you've added `GoogleService-Info.plist` (iOS) or `google-services.json` (Android).

### "Image picker not working"
Run `npx expo prebuild` to generate native projects with proper permissions.

## 📄 License

MIT License - See LICENSE file for details.

## 🙏 Credits

- Design inspired by modern fashion apps
- Powered by Google Vertex AI
- Built with Expo and React Native

