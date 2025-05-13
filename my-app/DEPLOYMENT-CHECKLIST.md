# Deployment Checklist for Baithaka GHAR Website

This checklist will help you prepare your website for production deployment. Follow these steps to ensure a smooth deployment process.

## 1. Database Cleanup

Before deploying your website, clean up the test data:

```bash
# Run the database cleanup script to remove test properties
cd my-app
node scripts/cleanup-database.js
```

This script will mark all test properties as deleted and unpublished, ensuring they don't appear on your live site.

## 2. Environment Variables

Make sure you have the following environment variables configured in your production environment:

```
# Database
MONGODB_URI=your_production_mongodb_uri

# Authentication
NEXTAUTH_URL=https://your-production-domain.com
NEXTAUTH_SECRET=your_secret_key
NEXT_PUBLIC_APP_URL=https://your-production-domain.com

# Cloudinary (for image uploads)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Email (for sending notifications)
EMAIL_SERVER_HOST=your_smtp_host
EMAIL_SERVER_PORT=your_smtp_port
EMAIL_SERVER_USER=your_smtp_username
EMAIL_SERVER_PASSWORD=your_smtp_password
EMAIL_FROM=your_from_email

# SMS (if applicable)
SMS_API_KEY=your_sms_api_key
```

## 3. Build and Optimization

Run the production build:

```bash
cd my-app
npm run build
```

This will create an optimized production build of your application.

## 4. Deployment Steps

### Option 1: Vercel Deployment (Recommended)

1. Push your code to a GitHub repository.
2. Log in to Vercel and create a new project from your GitHub repository.
3. Configure environment variables in Vercel's dashboard under Project Settings > Environment Variables.
4. Deploy your project.

### Option 2: Manual Deployment

1. Transfer the built files (`my-app/.next`, `my-app/public`, etc.) to your hosting server.
2. Set up a Node.js environment on your server.
3. Install production dependencies: `npm install --production`
4. Start the application: `npm start`

## 5. Post-Deployment Verification

After deploying, check these items:

- [ ] Verify that the homepage loads correctly.
- [ ] Test user registration and login.
- [ ] Ensure property listing and search functionality works.
- [ ] Check that no test properties are visible.
- [ ] Test the property submission form.
- [ ] Verify all images load correctly.
- [ ] Test any payment integrations if applicable.
- [ ] Check that email notifications are being sent.

## 6. Setting Up a Super Admin

Run the super admin setup script if you haven't already:

```bash
cd my-app
npx ts-node scripts/setup-super-admin.ts
```

This will ensure you have super admin access to manage the platform.

## 7. Monitoring

Set up monitoring for your production site:

- [ ] Configure error logging and alerts.
- [ ] Set up performance monitoring.
- [ ] Create database backups.

## 8. Regular Maintenance

Plan for regular maintenance:

- [ ] Schedule regular database backups.
- [ ] Monitor for security updates.
- [ ] Check for npm package updates periodically.

---

Follow this checklist to ensure your Baithaka GHAR website is properly prepared for deployment. If you encounter any issues, refer to the project documentation or seek assistance from a developer.
