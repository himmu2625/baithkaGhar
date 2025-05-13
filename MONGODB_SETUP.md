# MongoDB Setup for Baithaka Ghar Website

This guide will help you set up the MongoDB connection for the Baithaka Ghar website's user migration tool.

## Environment Configuration

1. Create a `.env.local` file in the `my-app` directory with the following content:

```
MONGODB_URI=mongodb://localhost:27017/baithaka
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-min-32-chars
```

Replace with your actual MongoDB connection string if different from the default localhost.

## MongoDB Connection Options

- **Local development**: `mongodb://localhost:27017/baithaka`
- **MongoDB Atlas**: `mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<database>`

## Troubleshooting the User Migration Tool

If you're experiencing issues with the user migration tool where no users are appearing in the users list:

1. **Check MongoDB connection**:

   ```bash
   cd my-app
   node scripts/check-mongodb.js
   ```

   This will test your MongoDB connection and show if there are any connection issues.

2. **Verify that MongoDB is running**:

   - For local MongoDB installations, ensure the MongoDB service is running
   - For MongoDB Atlas, check your network connection and IP whitelist

3. **Check browser console for errors**:

   - Open developer tools in your browser (F12)
   - Check the console for any error messages during the export operation

4. **Use sample data**:
   - For testing the import functionality, you can use the sample file at `my-app/exports/sample-users.json`

## Manual User Export (If Web UI Fails)

If the web UI export fails, you can use the script to export users directly:

```bash
cd my-app
node scripts/exportLocalUsers.js
```

This will create an export file in the `my-app/exports` directory that you can use for importing.

## Common Issues

1. **No users appear in the export**: MongoDB connection might be failing, or the database might not contain any users.

2. **Authentication errors**: Make sure your NextAuth configuration is correct and you're logged in as an admin or super_admin.

3. **Database connection errors**: Check that your MongoDB URI is correct and that MongoDB is running.

4. **Import failures**: Ensure the JSON format matches the expected structure with a `users` array property.
