# 🎬 LiveStream Premium — React Native (Expo)

A highly modern, premium **Live Video Calling and Broadcasting** application built with React Native (Expo), featuring a stunning dark glassmorphism UI, real-time face swapping with hyper-realistic masks, WebRTC video calls, and Firebase-powered real-time chat.

---

## 📱 Features

### 🎥 Live Streaming & Video Calls
- **WebRTC-powered** low-latency 1-on-1 video calls
- Live broadcasting (host-to-viewers) with real-time viewer tracking
- HD video with adaptive quality (1280x720 @ 30fps)
- Front/rear camera switching during streams
- Microphone mute/unmute and camera on/off controls

### 🎭 Real-Time Face Swapping (AR)
- **DeepAR SDK** integration for high-performance face tracking
- Library of **16 hyper-realistic face masks** (8 male + 8 female)
- Neural network-based texture mapping for genuine appearance
- Adjustable blending intensity and temporal smoothing
- Gender-segregated mask carousel with quick switching
- Premium and new mask badges

### 💬 Real-Time Chat
- Firebase Firestore-powered persistent chat
- System messages, join/leave notifications, gift messages
- User level badges, verified badges, and color-coded usernames
- Auto-scrolling message list with smooth animations
- Optimistic local message rendering

### 🎨 Premium UI/UX
- **Dark glassmorphism** theme with translucent panels
- **Neon accent palette** (cyan, purple, pink, green)
- 60fps animations using **React Native Reanimated 3**
- Gesture handler integration for interactive controls
- Pulsing live indicator with glow effects
- Smooth panel transitions (spring physics)
- Safe area support for notched devices

### 🏗️ Architecture
- **Zustand** for lightweight global state management
- **Firebase** (Auth, Firestore, RTD, Storage, Cloud Messaging)
- Service-oriented architecture with clean separation of concerns
- TypeScript throughout for type safety
- Modular folder structure for scalability

---

## 📁 Project Structure

```
LiveStreamApp/
├── index.js                          # App entry point (AppRegistry)
├── App.tsx                           # Root component with providers
├── package.json                      # Dependencies & scripts
├── app.json                          # Expo configuration
├── babel.config.js                   # Babel with module resolver
├── eas.json                          # EAS Build configuration
├── metro.config.js                   # Metro bundler config
│
├── src/
│   ├── assets/
│   │   ├── fonts/                    # Inter, JetBrains Mono
│   │   ├── images/                   # App icon, splash, placeholders
│   │   └── masks/
│   │       ├── male/                 # .deepar male face masks
│   │       └── female/               # .deepar female face masks
│   │
│   ├── components/                   # Reusable UI components
│   │
│   ├── screens/
│   │   ├── LiveStreamScreen.js       # ★ Main live streaming screen
│   │   ├── HomeScreen.tsx            # Discovery feed with stream cards
│   │   ├── DiscoveryScreen.tsx       # Category-based exploration
│   │   ├── ProfileScreen.tsx         # User profile with stats
│   │   └── VideoCallScreen.tsx       # 1-on-1 video call screen
│   │
│   ├── services/
│   │   ├── firebase.ts              # Firebase config + service classes
│   │   │   ├── StreamService         # Stream lifecycle management
│   │   │   ├── PresenceService       # Online/offline status
│   │   │   └── SignalingService      # WebRTC signaling
│   │   ├── webrtc.ts                # WebRTC peer connection management
│   │   └── deepar.ts               # DeepAR face swap integration
│   │
│   ├── navigation/
│   │   └── AppNavigator.tsx          # Stack + Tab navigation setup
│   │
│   ├── store/
│   │   └── useStreamStore.ts         # Zustand global state
│   │
│   ├── theme/
│   │   └── index.ts                  # Design tokens & theme system
│   │
│   ├── hooks/
│   │   └── useStreamHooks.ts         # Custom React hooks
│   │
│   ├── utils/
│   │   └── helpers.ts                # Utility functions
│   │
│   └── types/
│       └── index.ts                  # TypeScript type definitions
│
└── local_modules/
    └── deepar-react-native/          # DeepAR native module
```

---

## 🚀 Setup & Installation

### Prerequisites
- **Node.js** 18+ and npm/yarn
- **Expo CLI** (`npm install -g expo-cli`)
- **iOS**: Xcode 15+ with CocoaPods
- **Android**: Android Studio with SDK 35
- **DeepAR** developer account (free tier available)
- **Firebase** project with all services enabled

### Step 1: Clone & Install
```bash
cd LiveStreamApp
npm install
```

### Step 2: Firebase Setup
1. Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
2. Enable **Authentication**, **Firestore**, **Realtime Database**, **Storage**, and **Cloud Messaging**
3. Add Android and iOS apps to your Firebase project
4. Download `google-services.json` (Android) and `GoogleService-Info.plist` (iOS)
5. Replace the config in `src/services/firebase.ts` with your Firebase credentials

### Step 3: DeepAR Setup
1. Register at [developer.deepar.ai](https://developer.deepar.ai)
2. Obtain license keys for iOS and Android
3. Download `.deepar` face mask files from the asset store
4. Place mask files in `src/assets/masks/male/` and `src/assets/masks/female/`
5. Update license keys in `src/services/deepar.ts`
6. Install the DeepAR React Native module (see DeepAR docs)

### Step 4: Font Assets
Download and place font files in `src/assets/fonts/`:
- [Inter](https://fonts.google.com/specimen/Inter) — Regular, Medium, SemiBold, Bold
- [JetBrains Mono](https://fonts.google.com/specimen/JetBrains+Mono) — Regular

### Step 5: Run the App
```bash
# Development (Expo)
npx expo start

# iOS
npx expo run:ios

# Android
npx expo run:android

# Production build
eas build --platform ios
eas build --platform android
```

---

## 🎭 Face Swap Mask Library

The app includes 16 pre-configured hyper-realistic face masks:

| # | Name | Gender | Category | Premium |
|---|------|--------|----------|---------|
| 1 | Executive James | Male | Realistic | No |
| 2 | Young Daniel | Male | Realistic | No |
| 3 | Kenji Park | Male | Realistic | No |
| 4 | Marcus Stone | Male | Realistic | No |
| 5 | Liam Frost | Male | Realistic | Yes |
| 6 | Classic Robert | Male | Realistic | Yes |
| 7 | Trendy Alex | Male | Realistic | No |
| 8 | Rugged Chris | Male | Realistic | Yes |
| 9 | Elegant Sophia | Female | Realistic | No |
| 10 | Cute Mina | Female | Realistic | No |
| 11 | Hana Tanaka | Female | Realistic | No |
| 12 | Model Victoria | Female | Realistic | No |
| 13 | Isabella Roma | Female | Realistic | Yes |
| 14 | Freya Nordström | Female | Realistic | Yes |
| 15 | Priya Sharma | Female | Realistic | No |
| 16 | Neo Luna | Female | Artistic | Yes |

To add more masks, simply add entries to the `FACE_MASK_LIBRARY` array in `src/services/deepar.ts`.

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React Native (Expo SDK 52) |
| Language | TypeScript / JavaScript |
| Navigation | React Navigation 7 |
| State | Zustand 5 |
| Video | react-native-webrtc (WebRTC) |
| AR/Face Swap | DeepAR SDK |
| Backend | Firebase (Auth, Firestore, RTD, Storage, FCM) |
| Animations | React Native Reanimated 3 |
| Gestures | React Native Gesture Handler |
| Icons | @expo/vector-icons (Ionicons, FontAwesome5, Material) |
| Storage | MMKV (encrypted local storage) |

---

## 📝 Key Design Decisions

### Why DeepAR over MediaPipe for Face Swapping?
DeepAR provides production-grade, photorealistic face swapping that maps high-resolution textures (2048x2048) onto tracked faces. While MediaPipe excels at face landmark detection, it doesn't natively support texture-mapped face swapping. DeepAR's `.deepar` mask format includes pre-built 3D face models with diffuse textures, normal maps, and subsurface scattering, resulting in swaps that look genuinely real rather than cartoonish.

### Why Firebase for Signaling?
Firebase Realtime Database provides low-latency (< 100ms) data synchronization perfect for WebRTC signaling (SDP offer/answer exchange, ICE candidate trickle). Combined with Firestore for persistent data (stream metadata, chat history) and Cloud Messaging for push notifications, it provides a comprehensive backend without requiring custom server infrastructure.

### Why Zustand over Redux?
Zustand is 10x smaller (1KB vs 11KB), requires zero boilerplate, and provides a similar Redux-like API with less complexity. For a mobile app where bundle size and performance matter, Zustand is the optimal choice.

---

## 📄 License

This project is provided as-is for educational and development purposes.
