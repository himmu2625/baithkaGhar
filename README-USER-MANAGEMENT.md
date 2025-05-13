# User Management and Property Verification Guide

This guide explains how to manage users and property listings in the Baithaka Ghar admin panel.

## User Management

### Importing Users from JSON

If you have user data in a JSON file that isn't showing up in your admin dashboard, follow these steps:

1. Make sure your JSON file follows the correct format:

```json
{
  "users": [
    {
      "name": "User Name",
      "email": "user@example.com",
      "phone": "+919876543210",
      "role": "user",
      "isAdmin": false,
      "profileComplete": true
    }
  ]
}
```

2. Run the import script to add users to the database:

```bash
cd my-app
node scripts/importUsersFromJSON.js path/to/your/users.json
```

3. Alternatively, use the admin interface:
   - Log in as an admin or super_admin
   - Go to Admin > User Management
   - Click "Export/Import"
   - Select the "Import" tab
   - Paste your JSON data and click "Import Users"

### Viewing All Users

After importing users, they should appear in the admin dashboard:

1. Go to Admin > User Management
2. Users should be displayed in the table
3. If users aren't showing, click the "Refresh" button
4. Use the tabs to filter users by role (All, Users, Hosts, Admins)

## Property Management

### Property Verification Workflow

Regular users and hosts need admin approval for their property listings:

1. When a regular user or host creates a property listing:
   - Property is created with status "pending"
   - Property won't be visible to the public until approved
2. If an admin or super_admin creates a property listing:
   - Property is automatically approved and published
   - No verification step is required

### Approving Property Listings

To review and approve property listings:

1. Go to Admin > Properties > Verification
2. Review pending properties in the queue
3. Click on a property to view details
4. Select "Approve" or "Reject"
5. Add notes if needed (especially for rejections)
6. Submit your decision

### Property Visibility Rules

- Approved properties are automatically published and visible to all users
- Rejected properties remain unpublished until the owner makes changes and resubmits
- Admin/super_admin property listings bypass verification and are automatically published

## Troubleshooting

### Missing Users in Dashboard

If users aren't appearing in the dashboard:

1. Check that MongoDB is properly connected

   ```bash
   cd my-app
   node scripts/check-mongodb.js
   ```

2. Verify your admin account has the correct permissions

   - Your user must have role="admin" or role="super_admin" in the database

3. Check browser console for error messages

   - Open developer tools (F12) and look for error messages

4. Try importing sample users to test the system
   - Use the sample-users.json file in the my-app/exports directory

### Property Verification Issues

If property verification isn't working:

1. Check that properties have the correct structure in the database

   - Properties need verificationStatus field (pending/approved/rejected)
   - Regular users' properties should have verificationStatus="pending"

2. Verify admin permissions are correctly set
   - Only admins and super_admins can approve properties
