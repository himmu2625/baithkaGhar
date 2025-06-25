# Baithaka GHAR - Property Rental Platform

## 🚀 Deployment Ready

This project has been cleaned up and prepared for deployment. To deploy the website properly, please follow the steps in the [DEPLOYMENT-CHECKLIST.md](./DEPLOYMENT-CHECKLIST.md) file.

Key steps before deployment:

1. Run the database cleanup script to remove test properties
2. Configure your environment variables for production
3. Build and optimize the application
4. Deploy to your hosting platform of choice

Baithaka Ghar is a comprehensive accommodation booking platform that allows users to find and book properties for their stay. This application is built with Next.js, MongoDB, and various third-party integrations for enhanced functionality.

## Features

- User authentication with email/password and Google OAuth
- Property listings with search and filtering
- Booking management system
- Secure payment processing with Razorpay
- Email notifications for bookings and account actions
- SMS notifications and OTP verification
- Property location display with Google Maps
- Image uploads with Cloudinary
- Analytics and tracking

## Getting Started

1. Clone the repository
2. Install dependencies:

```bash
npm install
# or
yarn install
```

3. Set up environment variables (see Configuration section)
4. Run the development server:

```bash
npm run dev
# or
yarn dev
```

5. Open [http://localhost:3000](http://localhost:3000) with your browser to see the application

## Configuration

This application uses several third-party services that require configuration. Create a `.env.local` file in the root directory with the following variables:

```plaintext
# MongoDB Connection String
MONGODB_URI=your_mongodb_connection_string

# Application
NEXT_PUBLIC_BASE_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME="Baithaka Ghar"

# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret_key

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Google Maps API
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key

# Razorpay Configuration
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
RAZORPAY_WEBHOOK_SECRET=your_razorpay_webhook_secret
NEXT_PUBLIC_RAZORPAY_KEY_ID=your_razorpay_key_id

# Email Configuration
EMAIL_SERVER_HOST=your_smtp_host
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER=your_email_user
EMAIL_SERVER_PASSWORD=your_email_password
EMAIL_FROM="Baithaka Ghar <noreply@baithakaghar.com>"
EMAIL_SERVER_SECURE=false

# Twilio Configuration (for SMS)
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=your_twilio_phone_number

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

## Third-Party Integration Setup

### MongoDB Atlas

1. Create an account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a new cluster and database
3. Set up database access with a username and password
4. Update the `MONGODB_URI` in your `.env.local` file
5. Create the following collections:
   - `users` - User accounts
   - `properties` - Property listings
   - `bookings` - User bookings
   - `reviews` - Property reviews
   - `payments` - Payment records

### Google OAuth

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project
3. Configure the OAuth consent screen
4. Create OAuth 2.0 credentials
5. Add the following authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google` (development)
   - `https://yourdomain.com/api/auth/callback/google` (production)
6. Copy the Client ID and Client Secret to your `.env.local` file

### Google Maps API

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Enable the following APIs:
   - Maps JavaScript API
   - Places API
   - Geocoding API
   - Distance Matrix API
3. Create an API key and restrict it to these APIs
4. Set usage restrictions based on HTTP referrers
5. Copy the API key to your `.env.local` file

### Razorpay

1. Create an account at [Razorpay](https://razorpay.com)
2. Get your API keys from the Razorpay Dashboard
3. Set up a webhook endpoint with the following URL:
   - `http://localhost:3000/api/payments/webhook` (for local testing)
   - `https://yourdomain.com/api/payments/webhook` (for production)
4. Add the following events to your webhook:
   - `payment.authorized`
   - `payment.captured`
   - `payment.failed`
   - `refund.created`
5. Get the webhook signing secret and add it to your `.env.local` file

### Email Service

For production:

1. Choose an email service provider (SendGrid, Mailgun, etc.)
2. Create an account and verify your domain
3. Get SMTP credentials and update your `.env.local` file

For development:

1. Use [Ethereal](https://ethereal.email/) for testing
2. Create a test account and update your `.env.local` file

### Twilio (SMS)

1. Create an account at [Twilio](https://www.twilio.com/)
2. Buy a phone number
3. Get your Account SID and Auth Token
4. Update your `.env.local` file with these credentials

### Cloudinary (Image Upload)

1. Create an account at [Cloudinary](https://cloudinary.com/)
2. Get your Cloud Name, API Key, and API Secret
3. Create the following folders in your Cloudinary account:
   - `baithaka-ghar/properties`
   - `baithaka-ghar/users`
   - `baithaka-ghar/misc`
4. Update your `.env.local` file with these credentials

## Cloudinary Setup for Property Images

This application uses Cloudinary to store property images. Follow these steps to set up Cloudinary:

1. Create a free account at [Cloudinary](https://cloudinary.com/).
2. Once registered, navigate to your dashboard to find your Cloud Name, API Key, and API Secret.
3. Create a `.env.local` file in the root of the project and add the following variables:

```
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

4. Create an upload preset in Cloudinary:

   - Go to Settings > Upload > Upload presets
   - Create a new preset named `baithaka_hotels`
   - Set the signing mode to "Unsigned"
   - Save the preset

5. Update the cloud name in the upload function in `/app/list-property/page.tsx`:
   - Find the `handleImageUpload` function
   - Replace `YOUR_CLOUD_NAME` with your actual Cloudinary cloud name

## Project Structure

- `/app` - Next.js app router pages and API routes
- `/components` - Reusable UI components
- `/lib` - Utility functions and service integrations
- `/models` - MongoDB models
- `/hooks` - Custom React hooks
- `/public` - Static assets

## Tech Stack

- **Frontend**: Next.js, React, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: MongoDB with Mongoose
- **Authentication**: NextAuth.js, JWT
- **Styling**: Tailwind CSS, Shadcn UI
- **Payment**: Razorpay
- **Maps**: Google Maps API
- **Email**: Nodemailer
- **SMS**: Twilio
- **Image Upload**: Cloudinary

## License

[MIT](LICENSE)

## SMS OTP Setup Guide

To enable mobile OTP functionality, you can choose from multiple SMS providers. The system will automatically fallback between providers for maximum reliability.

### Option 1: Twilio (Recommended - Global Coverage)

1. **Sign up at Twilio**

   - Visit [twilio.com](https://www.twilio.com)
   - Create an account and verify your phone number

2. **Get your credentials**

   - From Twilio Console, get:
     - Account SID
     - Auth Token
     - Phone number (buy one from Twilio)

3. **Configure environment variables**

   ```env
   TWILIO_ACCOUNT_SID=your_account_sid
   TWILIO_AUTH_TOKEN=your_auth_token
   TWILIO_PHONE_NUMBER=+1234567890
   ```

4. **Pricing**: Pay-as-you-go, reliable global delivery

### Option 2: MSG91 (Good for India)

1. **Sign up at MSG91**

   - Visit [msg91.com](https://msg91.com)
   - Create account and get API key

2. **Setup DLT Template** (Required for India)

   - Create SMS template for OTP
   - Get template ID

3. **Configure environment variables**
   ```env
   MSG91_API_KEY=your_api_key
   MSG91_SENDER_ID=BTHKGR
   MSG91_TEMPLATE_ID=your_template_id
   ```

### Option 3: Fast2SMS (Indian Provider)

1. **Sign up at Fast2SMS**

   - Visit [fast2sms.com](https://www.fast2sms.com)
   - Create account and get API key

2. **Configure environment variables**
   ```env
   FAST2SMS_API_KEY=your_api_key
   FAST2SMS_SENDER_ID=FSTSMS
   ```

### Multi-Provider Fallback

The system automatically tries providers in this order:

1. **Twilio** (if configured) - Most reliable
2. **MSG91** (if configured) - Good for India
3. **Fast2SMS** (if configured) - Backup option

Configure multiple providers for maximum reliability!

### Custom SMS Provider

To add your own SMS provider, modify the `sendSms` function in `my-app/lib/services/sms.ts`:

```typescript
export async function sendSms({
  to,
  message,
}: {
  to: string;
  message: string;
}): Promise<{ success: boolean; error?: string }> {
  // Add your SMS provider's API here
  // Example: AWS SNS, Azure Communication Services, etc.
}
```

## Authentication Flow

### Email Login

- Standard email/password authentication
- Uses NextAuth.js credentials provider

### Mobile OTP Login

1. User enters phone number
2. OTP is sent via SMS (tries multiple providers)
3. User enters 6-digit OTP
4. System verifies OTP and logs in user

### Registration

- Supports both email and phone number registration
- Email verification and phone verification available
- Users can complete profile after registration

## Development

### File Structure

```
my-app/
├── app/                    # Next.js 13+ app directory
│   ├── api/               # API routes
│   │   └── auth/          # Authentication endpoints
│   │       └── otp/       # OTP-related endpoints
│   ├── login/             # Login page
│   ├── signup/            # Registration page
│   └── ...
├── components/            # React components
│   ├── auth/              # Authentication components
│   ├── features/          # Feature-specific components
│   └── ui/                # Reusable UI components
├── lib/                   # Utility libraries
│   ├── auth/              # Authentication utilities
│   │   └── otp.ts         # OTP generation/verification
│   ├── services/          # External service integrations
│   │   ├── sms.ts         # SMS service (multi-provider)
│   │   └── email.ts       # Email service
│   └── db/                # Database utilities
└── models/                # Database models
```

### Key Components

- **OTP System**: `lib/auth/otp.ts` - Handles OTP generation, storage, and verification
- **SMS Service**: `lib/services/sms.ts` - Multi-provider SMS functionality
- **Login Page**: `app/login/page.tsx` - Main login interface with email/mobile tabs
- **Authentication APIs**: `app/api/auth/otp/` - Send and verify OTP endpoints

## Troubleshooting

### SMS Not Working

1. Check your SMS provider credentials are correctly set
2. Verify your account has sufficient credits/balance
3. Check the phone number format (should include country code)
4. Look at server logs for specific error messages
5. Try a different SMS provider if one fails

### OTP Not Receiving

1. Check if SMS is being sent (check provider dashboard)
2. Verify phone number is correct and includes country code
3. Check if DLT registration is required (for Indian providers)
4. Try resending after cooldown period (30 seconds)
5. Check server logs for provider-specific errors

### Database Issues

1. Ensure MongoDB connection string is correct
2. Check if database is accessible
3. Verify user permissions for database operations

### Provider-Specific Issues

**Twilio:**

- Ensure phone number is verified in trial account
- Check account balance
- Verify phone number format (+country_code_number)

**MSG91:**

- Register DLT template for Indian regulations
- Use correct template ID
- Check sender ID approval

**Fast2SMS:**

- Verify API key permissions
- Check account balance
- Use correct route (dlt/promotional)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.
