# Baithaka GHAR Vercel Deployment Guide

This guide will help you deploy the Baithaka GHAR project to Vercel.

## Prerequisites

1. [Vercel account](https://vercel.com/signup)
2. [GitHub account](https://github.com/signup) (optional, for GitHub integration)
3. [MongoDB Atlas account](https://www.mongodb.com/cloud/atlas/register) (for database)
4. [Cloudinary account](https://cloudinary.com/users/register/free) (for image storage)

## Preparation Steps

1. Run the Vercel preparation script:

```bash
npm run prepare:vercel
```

This script will:

- Clean up unnecessary files
- Back up important scripts
- Create Vercel configuration files
- Update package.json with Vercel-specific scripts

2. Check if the build works:

```bash
npm run build
```

## Deployment Options

### Option 1: Vercel CLI (Recommended)

1. Install Vercel CLI:

```bash
npm install -g vercel
```

2. Log in to Vercel:

```bash
vercel login
```

3. Deploy the project:

```bash
vercel
```

4. For production deployment:

```bash
vercel --prod
```

### Option 2: GitHub Integration

1. Push your project to GitHub
2. Log in to [Vercel](https://vercel.com)
3. Click "Import Project"
4. Select "Import Git Repository"
5. Select your GitHub repository
6. Configure the project settings

## Environment Variables

You must set the following environment variables in your Vercel project:

| Variable                | Description                   | Required |
| ----------------------- | ----------------------------- | -------- |
| `MONGODB_URI`           | MongoDB connection string     | Yes      |
| `NEXTAUTH_SECRET`       | Secret for NextAuth           | Yes      |
| `NEXTAUTH_URL`          | URL of your Vercel deployment | Yes      |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name         | Yes      |
| `CLOUDINARY_API_KEY`    | Cloudinary API key            | Yes      |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret         | Yes      |

For all environment variables, see the `vercel-env-template.txt` file.

## Post-Deployment

1. Verify your application is working correctly
2. Check authentication and image uploads
3. Ensure MongoDB connection is working

## Troubleshooting

If you encounter issues:

1. Check Vercel build logs
2. Verify environment variables are set correctly
3. Ensure MongoDB and Cloudinary are accessible
4. Check the application logs in the Vercel dashboard

## Production Optimizations

The repository has been configured with these optimizations:

- Server-side caching headers
- Image optimization via Next.js Image component
- Bundle size reduction via SWC minification
- Tree shaking and code splitting
- Security headers

## Backup

The `scripts-backup` directory contains important scripts that were removed from the main project for deployment but might be useful for future development.

## Support

If you encounter any issues, please contact the development team.
