import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { PERMISSIONS, ROLE_PERMISSIONS } from "@/config/permissions";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  permissions: string[];
}

interface PermissionsManagerProps {
  userId: string;
  onPermissionsChanged?: () => void;
}

export default function PermissionsManager({
  userId,
  onPermissionsChanged,
}: PermissionsManagerProps) {
  const { data: session } = useSession();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [permissions, setPermissions] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);

  // Group permissions by category for better organization
  const permissionGroups = {
    "User Management": Object.entries(PERMISSIONS).filter(([key]) =>
      key.includes("USER")
    ),
    "Admin Management": Object.entries(PERMISSIONS).filter(([key]) =>
      key.includes("ADMIN")
    ),
    "Content Management": Object.entries(PERMISSIONS).filter(([key]) =>
      key.includes("CONTENT")
    ),
    Settings: Object.entries(PERMISSIONS).filter(([key]) =>
      key.includes("SETTINGS")
    ),
    Properties: Object.entries(PERMISSIONS).filter(([key]) =>
      key.includes("PROPERT")
    ),
    Bookings: Object.entries(PERMISSIONS).filter(([key]) =>
      key.includes("BOOKING")
    ),
    Analytics: Object.entries(PERMISSIONS).filter(([key]) =>
      key.includes("ANALYTICS")
    ),
    System: Object.entries(PERMISSIONS).filter(([key]) =>
      key.includes("SYSTEM")
    ),
  };

  // Fetch user data with permissions
  useEffect(() => {
    const fetchUser = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/admin/users/${userId}`);

        if (!response.ok) {
          throw new Error("Failed to fetch user");
        }

        const data = await response.json();
        setUser(data.user);

        // Initialize permissions state
        const permissionState: Record<string, boolean> = {};
        Object.values(PERMISSIONS).forEach((permission) => {
          permissionState[permission] =
            data.user.permissions?.includes(permission) || false;
        });

        setPermissions(permissionState);
        setError(null);
      } catch (error) {
        setError("Failed to load user data");
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchUser();
    }
  }, [userId]);

  // Check if current user can manage this user's permissions
  const canManagePermissions = () => {
    if (!session?.user) return false;

    // Super admins can manage anyone's permissions
    if (session.user.role === "super_admin") return true;

    // Non-super admins can't manage super admin permissions
    if (user?.role === "super_admin") return false;

    // Admin users with appropriate permission can manage regular admin permissions
    return session.user.role === "admin" && user?.role === "admin";
  };

  // Handle permission toggle
  const handlePermissionToggle = (permission: string) => {
    if (user?.role === "super_admin" && session?.user.role !== "super_admin") {
      toast({
        title: "Permission denied",
        description: "Only super admins can modify super admin permissions",
        variant: "destructive",
      });
      return;
    }

    setPermissions((prev) => ({
      ...prev,
      [permission]: !prev[permission],
    }));
  };

  // Apply a role template
  const applyRoleTemplate = (role: "super_admin" | "admin" | "user") => {
    const rolePerms = ROLE_PERMISSIONS[role] || [];

    const newPermissions: Record<string, boolean> = {};
    const permissionValues = Object.values(PERMISSIONS) as string[];
    permissionValues.forEach((permission: string) => {
      newPermissions[permission] = rolePerms.includes(permission as never);
    });

    setPermissions(newPermissions);
  };

  // Save permissions changes
  const savePermissions = async () => {
    if (!canManagePermissions()) {
      toast({
        title: "Permission denied",
        description:
          "You don't have permission to modify this user's permissions",
        variant: "destructive",
      });
      return;
    }

    try {
      setSaving(true);

      const permissionsArray = Object.entries(permissions)
        .filter(([_, isEnabled]) => isEnabled)
        .map(([permission]) => permission);

      const response = await fetch(`/api/admin/users/${userId}/permissions`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ permissions: permissionsArray }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to update permissions");
      }

      toast({
        title: "Success",
        description: "Permissions updated successfully",
      });

      if (onPermissionsChanged) {
        onPermissionsChanged();
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update permissions",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !user) {
    return (
      <Alert variant="destructive" className="mb-6">
        <AlertDescription>
          {error || "Failed to load user data"}
        </AlertDescription>
      </Alert>
    );
  }

  const isReadOnly = !canManagePermissions();

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-semibold">
              User Permissions
            </CardTitle>
            <CardDescription>
              Manage permissions for {user.name}
            </CardDescription>
          </div>
          <Badge
            variant={
              user.role === "super_admin"
                ? "default"
                : user.role === "admin"
                ? "outline"
                : "secondary"
            }
          >
            {user.role === "super_admin"
              ? "Super Admin"
              : user.role === "admin"
              ? "Admin"
              : "User"}
          </Badge>
        </div>
      </CardHeader>

      {isReadOnly && (
        <Alert variant="warning" className="mx-6 mb-4">
          <AlertDescription>
            You don't have permission to modify this user's permissions
          </AlertDescription>
        </Alert>
      )}

      <CardContent>
        <div className="mb-4 flex space-x-4">
          <Button
            variant="outline"
            size="sm"
            disabled={isReadOnly || user.role === "super_admin"}
            onClick={() => applyRoleTemplate("admin")}
          >
            Apply Admin Template
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={isReadOnly || session?.user.role !== "super_admin"}
            onClick={() => applyRoleTemplate("super_admin")}
          >
            Apply Super Admin Template
          </Button>
        </div>

        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-6">
            {Object.entries(permissionGroups).map(
              ([group, groupPermissions]) => (
                <div key={group} className="border rounded-md p-4">
                  <h3 className="font-medium mb-2">{group}</h3>
                  <div className="space-y-2">
                    {groupPermissions.map(([key, permission]) => (
                      <div key={key} className="flex items-center space-x-2">
                        <Switch
                          id={permission}
                          checked={permissions[permission] || false}
                          onCheckedChange={() =>
                            handlePermissionToggle(permission)
                          }
                          disabled={isReadOnly}
                        />
                        <Label htmlFor={permission} className="text-sm">
                          {key
                            .toLowerCase()
                            .replace(/_/g, " ")
                            .replace(/\b\w/g, (c) => c.toUpperCase())}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              )
            )}
          </div>
        </ScrollArea>
      </CardContent>

      <CardFooter className="flex justify-end border-t px-6 py-4">
        <Button
          onClick={savePermissions}
          disabled={isReadOnly || saving}
          className="min-w-[100px]"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
          {saving ? "Saving..." : "Save Changes"}
        </Button>
      </CardFooter>
    </Card>
  );
}
