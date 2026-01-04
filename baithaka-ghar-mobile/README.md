# Baithaka Ghar Mobile App

Native mobile application for Baithaka Ghar property booking platform.

## 🚀 Tech Stack

- **Framework**: React Native with Expo
- **Language**: TypeScript
- **Navigation**: Expo Router (file-based routing)
- **State Management**: Zustand + React Query
- **API Client**: Axios
- **Secure Storage**: Expo SecureStore

## 📁 Project Structure

```
baithaka-ghar-mobile/
├── app/                    # Expo Router screens
│   ├── (auth)/            # Authentication screens
│   │   ├── welcome.tsx
│   │   ├── login.tsx
│   │   ├── register.tsx
│   │   └── verify-otp.tsx
│   ├── (tabs)/            # Main app tabs
│   │   ├── index.tsx      # Home/Search
│   │   ├── bookings.tsx
│   │   ├── favorites.tsx
│   │   └── profile.tsx
│   └── _layout.tsx        # Root layout
├── components/            # Reusable components
├── services/              # API services
│   ├── api.ts            # API client
│   ├── auth.ts           # Auth service
│   └── storage.ts        # Secure storage
├── types/                 # TypeScript types
├── constants/             # App constants
├── hooks/                 # Custom hooks
└── utils/                 # Utility functions
```

## 🔧 Setup & Installation

### Prerequisites

- Node.js 18+
- npm or yarn
- Expo CLI: `npm install -g expo-cli`
- Expo Go app on your phone (for testing)

### Installation

1. Navigate to mobile app directory:
```bash
cd "C:\Users\Lenovo\Desktop\Baithaka GHAR website\baithaka-ghar-mobile"
```

2. Install dependencies:
```bash
npm install
```

3. Start development server:
```bash
npm start
```

4. Run on device:
   - **Android**: Press `a` or scan QR code with Expo Go
   - **iOS**: Press `i` or scan QR code with Expo Go (iOS only)
   - **Web**: Press `w`

## 🌐 API Configuration

The app connects to your Next.js backend. Configure the API URL in `.env`:

```env
EXPO_PUBLIC_API_URL=http://localhost:3000
EXPO_PUBLIC_APP_ENV=development
```

### For testing on physical device:

Replace `localhost` with your computer's IP address:

```env
EXPO_PUBLIC_API_URL=http://192.168.1.XX:3000
```

To find your IP:
- Windows: `ipconfig`
- Mac/Linux: `ifconfig`

## 📱 Available Scripts

- `npm start` - Start Expo development server
- `npm run android` - Run on Android
- `npm run ios` - Run on iOS (macOS only)
- `npm run web` - Run on web browser
- `npm run reset` - Clear cache and restart

## ✅ Phase 1 Complete - Authentication

✅ Project initialization with Expo
✅ TypeScript configuration
✅ API service layer with interceptors
✅ Secure storage service
✅ Authentication screens (Welcome, Login, Register, OTP)
✅ Tab navigation structure
✅ Shared types from backend models
✅ Environment configuration

## ✅ Phase 2 Complete - Property Search & Discovery

✅ Property search with real-time results
✅ Property listing with cards
✅ Property detail screen with image gallery
✅ Favorites system (add/remove)
✅ Search bar component
✅ PropertyCard component
✅ Pull-to-refresh functionality
✅ Loading and empty states
✅ React Query integration for caching

### What Works Now:

- ✅ Search properties by location/name
- ✅ Browse featured properties
- ✅ View full property details
- ✅ Swipe through property images
- ✅ Save properties to favorites
- ✅ View all favorite properties
- ✅ Pull to refresh data
- ✅ Smooth navigation between screens

## ✅ Phase 3 Complete - Booking Flow

✅ Date picker for check-in/check-out
✅ Guest & room selector
✅ Complete booking form
✅ Guest details input
✅ Automatic price calculation
✅ Price breakdown display
✅ Booking creation via API
✅ My Bookings screen with filters
✅ Booking cards with status
✅ Pull-to-refresh functionality

## ✅ Phase 4 Complete - Booking Details & Reviews

✅ Booking detail screen with full information
✅ Cancel booking with confirmation dialog
✅ Contact property via phone
✅ Download invoice button (ready for PDF)
✅ Leave review screen (5-star rating)
✅ Review form with validation
✅ Enhanced profile screen with icons
✅ About and version information

## 🔮 Next Steps (Phase 5 - Optional)

- Owner PMS mobile dashboard
- Manage bookings on-the-go
- Update property availability
- View revenue reports
- Push notifications
- In-app messaging
- Multi-language support

## 🤝 Integration with Website

This mobile app uses the **same backend** as your Next.js website:

- Same MongoDB database
- Same API endpoints
- Same authentication system
- Same data models

Changes to the website backend automatically work in the mobile app!

## 📞 Support

For issues or questions during development, refer to:
- [Expo Documentation](https://docs.expo.dev/)
- [React Native Documentation](https://reactnative.dev/)
- [Expo Router Documentation](https://docs.expo.dev/router/introduction/)

## 📄 License

Private - Baithaka Ghar Property Management
