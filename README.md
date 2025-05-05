# Baithaka Ghar Website

A comprehensive accommodation booking platform built with Next.js, MongoDB, and various third-party integrations.

## Project Structure

The project follows a modular, feature-based architecture:

```
my-app/
├── app/                    # Next.js App Router
│   ├── api/                # API routes
│   │   └── v1/             # API version 1
│   │       ├── auth/       # Authentication endpoints
│   │       ├── bookings/   # Booking endpoints
│   │       ├── properties/ # Property endpoints
│   │       └── users/      # User endpoints
│   ├── (routes)/           # Page routes
│   └── layout.tsx          # Root layout
├── components/             # React components
│   ├── ui/                 # Base UI components
│   ├── layout/             # Layout components
│   ├── features/           # Feature-specific components
│   │   ├── auth/           # Authentication components
│   │   ├── property/       # Property-related components
│   │   └── booking/        # Booking-related components
│   ├── forms/              # Form components
│   └── common/             # Shared components
├── lib/                    # Utility functions
│   ├── utils/              # General utilities
│   ├── api/                # API utilities
│   ├── auth/               # Authentication utilities
│   └── db/                 # Database utilities
├── models/                 # MongoDB models
├── services/               # Business logic
│   ├── auth-service.ts     # Authentication service
│   ├── property-service.ts # Property service
│   ├── booking-service.ts  # Booking service
│   └── user-service.ts     # User service
├── types/                  # TypeScript types
│   ├── models/             # Database model types
│   ├── api/                # API request/response types
│   └── auth/               # Authentication types
├── hooks/                  # Custom React hooks
├── providers/              # Context providers
└── public/                 # Static assets
```

## Key Features

- User authentication with email/password and Google OAuth
- Property listings with search and filtering
- Booking system with availability checking
- Payment processing with Razorpay
- User profiles and booking management
- Admin dashboard for site management

## Technology Stack

- **Frontend**: Next.js, React, TypeScript, Tailwind CSS, Shadcn UI
- **Backend**: Next.js API Routes, MongoDB with Mongoose
- **Authentication**: NextAuth.js, JWT
- **State Management**: React Context API
- **Styling**: Tailwind CSS with custom theme
- **Deployment**: Vercel (recommended)

## Development

### Prerequisites

- Node.js 18+ and npm/yarn
- MongoDB database

### Setup

1. Clone the repository
2. Install dependencies: `npm install`
3. Create a `.env.local` file with the following variables:
   ```
   MONGODB_URI=your_mongodb_connection_string
   NEXTAUTH_SECRET=your_nextauth_secret
   NEXTAUTH_URL=http://localhost:3000
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   RAZORPAY_KEY_ID=your_razorpay_key_id
   RAZORPAY_KEY_SECRET=your_razorpay_key_secret
   ```
4. Run the development server: `npm run dev`

### Folder Structure Rationale

- **Components**: Organized by purpose (UI, layout, features) for better discoverability
- **API Routes**: Versioned for future compatibility
- **Services**: Separate business logic from API routes
- **Types**: Centralized type definitions for consistency
- **Lib**: Utility functions organized by domain

## Best Practices

- Use TypeScript for type safety
- Follow the feature-based organization for complex features
- Keep components small and focused
- Use services for business logic
- Centralize types and interfaces
- Use custom hooks for shared functionality
- Follow Next.js best practices for routing and data fetching

## Deployment

The application is configured for deployment on Vercel:

1. Connect your GitHub repository to Vercel
2. Configure environment variables
3. Deploy

## License

[MIT](LICENSE)
