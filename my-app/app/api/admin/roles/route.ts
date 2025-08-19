import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import User from '@/models/User';
import { RBAC, ROLES, PERMISSIONS } from '@/lib/rbac';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has user management permissions
    const userRoleKey = session.user.role as keyof typeof ROLES;
    const userRole = ROLES[userRoleKey];
    const canManageUsers = RBAC.hasPermission(userRole, PERMISSIONS.ADMIN_USER_MANAGEMENT);

    if (!canManageUsers) {
      return NextResponse.json({ 
        error: 'Access denied. User management permissions required.',
        requiredPermission: PERMISSIONS.ADMIN_USER_MANAGEMENT,
        userRole: userRole
      }, { status: 403 });
    }

    await connectToDatabase();

    // Get all users with their roles
    const users = await User.find({}, 'name email role isAdmin createdAt')
      .sort({ createdAt: -1 })
      .lean();

    // Get role statistics
    const roleStats = Object.values(ROLES).reduce((acc, role) => {
      acc[role] = users.filter(user => user.role === role).length;
      return acc;
    }, {} as Record<string, number>);

    // Get assignable roles for the current user
    const assignableRoles = RBAC.getAssignableRoles(userRole);

    return NextResponse.json({
      success: true,
      data: {
        users,
        roleStats,
        assignableRoles,
        allRoles: Object.values(ROLES).map(role => ({
          value: role,
          label: RBAC.getRoleDisplayName(role),
          description: RBAC.getRoleDescription(role),
          permissions: RBAC.getRolePermissions(role)
        }))
      }
    });

  } catch (error) {
    console.error('Error fetching roles data:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has user management permissions
    const userRoleKey = session.user.role as keyof typeof ROLES;
    const userRole = ROLES[userRoleKey];
    const canManageUsers = RBAC.hasPermission(userRole, PERMISSIONS.ADMIN_USER_MANAGEMENT);

    if (!canManageUsers) {
      return NextResponse.json({ 
        error: 'Access denied. User management permissions required.',
        requiredPermission: PERMISSIONS.ADMIN_USER_MANAGEMENT,
        userRole: userRole
      }, { status: 403 });
    }

    const { userId, newRole } = await request.json();

    if (!userId || !newRole) {
      return NextResponse.json({ 
        error: 'User ID and new role are required' 
      }, { status: 400 });
    }

    // Validate the new role
    if (!RBAC.isValidRole(newRole)) {
      return NextResponse.json({ 
        error: 'Invalid role specified' 
      }, { status: 400 });
    }

    // Check if the current user can assign this role
    const assignableRoles = RBAC.getAssignableRoles(userRole);
    if (!assignableRoles.includes(newRole as any)) {
      return NextResponse.json({ 
        error: 'You cannot assign this role',
        assignableRoles,
        requestedRole: newRole
      }, { status: 403 });
    }

    await connectToDatabase();

    // Find the user to update
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ 
        error: 'User not found' 
      }, { status: 404 });
    }

    // Prevent role changes for super admin (unless by super admin)
    if (user.role === ROLES.SUPER_ADMIN && userRole !== ROLES.SUPER_ADMIN) {
      return NextResponse.json({ 
        error: 'Cannot modify super admin role' 
      }, { status: 403 });
    }

    // Update the user's role
    user.role = newRole as any;
    
    // Update isAdmin flag based on role
    user.isAdmin = newRole === ROLES.ADMIN || newRole === ROLES.SUPER_ADMIN;
    
    await user.save();

    return NextResponse.json({
      success: true,
      message: `User role updated to ${RBAC.getRoleDisplayName(newRole)}`,
      data: {
        userId: user._id,
        newRole,
        roleDisplayName: RBAC.getRoleDisplayName(newRole),
        updatedAt: user.updatedAt
      }
    });

  } catch (error) {
    console.error('Error updating user role:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has user management permissions
    const userRoleKey = session.user.role as keyof typeof ROLES;
    const userRole = ROLES[userRoleKey];
    const canManageUsers = RBAC.hasPermission(userRole, PERMISSIONS.ADMIN_USER_MANAGEMENT);

    if (!canManageUsers) {
      return NextResponse.json({ 
        error: 'Access denied. User management permissions required.',
        requiredPermission: PERMISSIONS.ADMIN_USER_MANAGEMENT,
        userRole: userRole
      }, { status: 403 });
    }

    const { userId, permissions } = await request.json();

    if (!userId || !permissions) {
      return NextResponse.json({ 
        error: 'User ID and permissions are required' 
      }, { status: 400 });
    }

    await connectToDatabase();

    // Find the user to update
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ 
        error: 'User not found' 
      }, { status: 404 });
    }

    // Prevent permission changes for super admin (unless by super admin)
    if (user.role === ROLES.SUPER_ADMIN && userRole !== ROLES.SUPER_ADMIN) {
      return NextResponse.json({ 
        error: 'Cannot modify super admin permissions' 
      }, { status: 403 });
    }

    // Update the user's permissions
    user.permissions = permissions;
    await user.save();

    return NextResponse.json({
      success: true,
      message: 'User permissions updated',
      data: {
        userId: user._id,
        permissions: user.permissions,
        updatedAt: user.updatedAt
      }
    });

  } catch (error) {
    console.error('Error updating user permissions:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 