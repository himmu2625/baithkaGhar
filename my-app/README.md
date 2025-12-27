# Baithaka GHAR - Property Management & Booking Platform

A comprehensive property management and booking platform built with Next.js, featuring owner portals, flexible payment options, and advanced booking management.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Setup environment variables
cp .env.example .env.local
# Edit .env.local with your credentials

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

Visit [http://localhost:3000](http://localhost:3000) to see the application.

## ✨ Key Features

### For Guests
- **Advanced Property Search** - Filter by location, amenities, price, and availability
- **Flexible Booking** - Real-time availability and instant booking confirmation
- **Partial Payments** - Pay 40-100% upfront, rest at the property
- **Review System** - Read and write property reviews
- **Mobile-Friendly** - Responsive design for all devices

### For Property Owners
- **Owner Portal** - Dedicated dashboard to manage properties
- **Booking Management** - View and manage all bookings
- **Payment Tracking** - Track online and on-site payments
- **Analytics & Reports** - Revenue reports and occupancy analytics
- **Room Management** - Manage room types, pricing, and availability

### For Administrators
- **Property Management** - Approve and manage property listings
- **User Management** - Manage users, roles, and permissions
- **Booking Oversight** - Monitor all bookings system-wide
- **Payment Management** - Process refunds and track payments
- **Analytics Dashboard** - Comprehensive business insights
- **Dynamic Pricing** - Event-based and seasonal pricing tools

## 🏗️ Tech Stack

### Frontend
- **Next.js 16** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **Radix UI** - Accessible component primitives
- **Framer Motion** - Animation library
- **React Hook Form** - Form management with Zod validation

### Backend
- **Next.js API Routes** - Serverless API endpoints
- **MongoDB** - NoSQL database
- **NextAuth.js** - Authentication
- **Razorpay** - Payment processing
- **Cloudinary** - Image hosting and optimization

### Additional Tools
- **Chart.js** - Data visualization
- **Socket.io** - Real-time notifications
- **jsPDF** - PDF generation for invoices
- **Excel Export** - Data export functionality

## 📁 Project Structure

```
my-app/
├── app/                    # Next.js App Router pages
│   ├── api/               # API endpoints
│   ├── admin/             # Admin panel pages
│   ├── os/                # Owner system pages
│   ├── booking/           # Booking flow pages
│   └── ...
├── components/            # React components
│   ├── admin/            # Admin-specific components
│   ├── features/         # Feature-specific components
│   ├── layout/           # Layout components
│   └── ui/               # Reusable UI components
├── lib/                   # Utility functions and helpers
├── models/               # MongoDB schemas
├── services/             # Business logic and services
├── hooks/                # Custom React hooks
├── types/                # TypeScript type definitions
├── public/               # Static assets
├── docs/                 # Documentation
│   ├── api/             # API documentation
│   ├── development/     # Development logs
│   ├── guides/          # User guides
│   └── getting-started/ # Setup instructions
└── scripts/              # Utility scripts

```

## 📚 Documentation

### Getting Started
- **[START_HERE.md](./START_HERE.md)** - Begin here for setup instructions
- **[Setup Guide](./docs/getting-started/SETUP_COMPLETE_NEXT_STEPS.md)** - Detailed setup walkthrough
- **[Environment Setup](./docs/getting-started/README_PHASE0.md)** - Configure your development environment

### Guides
- **[Production Readiness](./docs/guides/PRODUCTION-READINESS-CHECKLIST.md)** - Pre-deployment checklist
- **[Owner Management](./docs/guides/OWNER_MANAGEMENT_QUICK_START.md)** - Manage property owners
- **[Payment Integration](./docs/guides/RAZORPAY-SETUP-GUIDE.md)** - Configure Razorpay
- **[Review System](./docs/guides/REVIEW-SYSTEM-COMPLETE-GUIDE.md)** - Implement reviews

### API Documentation
- **[Booking Endpoints](./docs/api/booking-endpoints.md)** - Booking API reference

### Development
- **[Project Timeline](./docs/PROJECT_TIMELINE.md)** - Development roadmap
- **[Testing Checklist](./docs/TESTING_CHECKLIST.md)** - Quality assurance
- **[Rollback Procedures](./docs/ROLLBACK_PROCEDURES.md)** - Emergency rollback guide

## 🔧 Available Scripts

### Development
```bash
npm run dev              # Start development server (port 3000)
npm run dev:turbo        # Start with Turbopack
npm run staging:start    # Start staging environment (port 3001)
```

### Building
```bash
npm run build            # Production build
npm run build:dev        # Development build
npm run build:clean      # Clean build (no cache)
npm start                # Start production server
```

### Database & Setup
```bash
npm run setup:admin      # Create super admin user
npm run backup:db        # Backup MongoDB database
npm run restore:db       # Restore from backup
npm run phase0:verify    # Verify Phase 0 setup
```

### Code Quality
```bash
npm run lint             # Run ESLint
npm run clean            # Clean build cache
```

### Utilities
```bash
npm run update-city-counts    # Update city property counts
npm run init-travel-picks     # Initialize travel picks
npm run deploy:check          # Check deployment readiness
```

## 🌍 Environment Variables

Create a `.env.local` file in the root directory:

```env
# Database
MONGODB_URI=your_mongodb_connection_string

# Authentication
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=http://localhost:3000

# Google OAuth (optional)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Razorpay
RAZORPAY_KEY_ID=your_razorpay_key
RAZORPAY_KEY_SECRET=your_razorpay_secret

# Cloudinary
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Email (Nodemailer)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password

# Application
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

See `.env.example` for a complete list of environment variables.

## 🔐 Security

- Environment variables are never committed (see `.gitignore`)
- All API routes require authentication
- Role-based access control (RBAC)
- Secure payment processing via Razorpay
- Input validation with Zod schemas
- XSS and CSRF protection

## 🧪 Testing

```bash
# Run tests
npm test

# Verify system setup
npm run phase0:verify

# Test pricing system
npm run test:pricing
```

Refer to [Testing Checklist](./docs/TESTING_CHECKLIST.md) for comprehensive testing procedures.

## 📦 Deployment

### Vercel (Recommended)

```bash
# Prepare for deployment
npm run deploy:prepare

# Deploy to Vercel
vercel
```

### Manual Deployment

1. Build the application: `npm run build`
2. Set environment variables on your hosting platform
3. Start the server: `npm start`

See [Production Readiness Checklist](./docs/guides/PRODUCTION-READINESS-CHECKLIST.md) for detailed deployment steps.

## 🤝 Contributing

1. Create a feature branch from `master`
2. Make your changes
3. Test thoroughly
4. Create a pull request

Please follow the existing code style and add tests for new features.

## 📄 License

This project is proprietary and confidential.

## 💬 Support

For issues and questions:
- Check the [documentation](./docs/)
- Review [troubleshooting guide](./docs/troubleshooting/comprehensive-troubleshooting-guide.md)
- Contact the development team

## 🎯 Project Status

**Current Version:** 0.1.0
**Status:** Active Development
**Last Updated:** December 2025

See [CHANGELOG.md](./CHANGELOG.md) for version history and recent changes.

---

**Built with ❤️ by the Baithaka GHAR Team**
