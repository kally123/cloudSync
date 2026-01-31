# CloudSync Mobile

A React Native (Expo) mobile app for cloud file storage and management.

## Features

- 🔐 User authentication (login/register)
- 📁 Browse files and folders
- ⬆️ Upload photos, videos, and documents
- 📊 Storage usage statistics
- 🎨 Native iOS and Android UI

## Tech Stack

- **Framework**: React Native with Expo
- **Navigation**: React Navigation
- **State Management**: Zustand
- **HTTP Client**: Axios
- **Secure Storage**: expo-secure-store
- **File Pickers**: expo-image-picker, expo-document-picker

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Expo CLI
- Expo Go app (iOS/Android) for testing

### Installation

```bash
# Install dependencies
npm install

# Start Expo development server
npm start
```

Then scan the QR code with Expo Go app or press:
- `a` - Open Android emulator
- `i` - Open iOS simulator

### Build for Production

```bash
# Build for iOS
npx expo build:ios

# Build for Android
npx expo build:android
```

## Project Structure

```
├── App.tsx                 # Main entry point with navigation
├── app.json                # Expo configuration
├── src/
│   ├── lib/
│   │   └── api.ts          # Axios API client
│   ├── screens/
│   │   ├── FilesScreen.tsx     # File browser
│   │   ├── LoginScreen.tsx     # Login form
│   │   ├── ProfileScreen.tsx   # User profile & settings
│   │   ├── RegisterScreen.tsx  # Registration form
│   │   └── UploadScreen.tsx    # File upload interface
│   ├── store/
│   │   ├── authStore.ts    # Authentication state
│   │   └── fileStore.ts    # Files/folders state
│   └── types/
│       └── index.ts        # TypeScript interfaces
└── assets/                 # App icons and splash screens
```

## API Configuration

Update the API base URL in `src/lib/api.ts`:

```typescript
const API_BASE_URL = 'http://localhost:8080/api';
```

> **Note**: For testing on a physical device, replace `localhost` with your computer's local IP address.

## Permissions

The app requests the following permissions:
- **Photo Library**: To select images and videos for upload
- **File System**: To access documents for upload

## License

MIT
