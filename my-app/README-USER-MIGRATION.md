# User Migration Guide

This guide explains how to export users from your local development environment and import them into your production environment.

## Prerequisites

- Node.js installed
- Access to both local and production MongoDB databases
- Admin privileges in the application

## Exporting Users from Local Development

1. First, ensure your MongoDB connection string is set in your `.env.local` file:

```
MONGODB_URI=mongodb://localhost:27017/baithaka
```

2. Run the export script:

```bash
cd my-app
node scripts/exportLocalUsers.js
```

3. The script will export users to `my-app/exports/users-export-[DATE].json`

## Importing Users to Production

1. Log in to your production application as an admin or super_admin
2. Navigate to Admin > User Migration in the sidebar
3. Click on the "Import" tab
4. Open the exported JSON file and copy its contents
5. Paste the content into the import text area
6. Click "Import Users" to begin the import process
7. Review the results on the "Results" tab

## What Data is Migrated

The following user data is migrated:

- Basic profile (name, email, phone, address)
- Role and admin status
- Profile completion status
- Registration date

## What Data is NOT Migrated

For security reasons, the following data is not migrated:

- Passwords (users will need to use "Forgot Password" to set a new password)
- Authentication tokens

## Troubleshooting

- If the export script fails, check your MongoDB connection string
- If import fails, verify you have admin privileges
- Check that the JSON data format is valid
- For large datasets, consider splitting the import into smaller batches

## Note on Production Environment

Before importing users to production, make sure:

1. You have adequate backup of your production database
2. You're using the correct MongoDB URI in your production environment
3. You're logged in with sufficient admin privileges
