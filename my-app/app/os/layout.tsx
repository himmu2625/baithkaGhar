import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import OwnerLayoutClient from '@/components/os/OwnerLayoutClient';

export const metadata = {
  title: 'Baithaka Ghar OS - Owner Portal',
  description: 'Property owner management portal',
};

export default async function OwnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Check if we're on the login page - if so, don't apply the authenticated layout
  const session = await getServerSession(authOptions);

  // If no session, just render children (login page handles its own layout)
  if (!session || !session.user) {
    return <>{children}</>;
  }

  // Check if user has owner role - if not, just render children (will redirect to login)
  const allowedRoles = ['property_owner', 'admin', 'super_admin'];
  if (!allowedRoles.includes(session.user.role || '')) {
    return <>{children}</>;
  }

  // User is authenticated and has proper role - show full OS layout
  return <OwnerLayoutClient session={session}>{children}</OwnerLayoutClient>;
}
