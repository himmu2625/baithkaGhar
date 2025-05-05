# Baithaka Ghar - Accommodation Booking Platform

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
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
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
