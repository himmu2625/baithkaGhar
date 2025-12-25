import { redirect } from 'next/navigation';
import { getOwnerSession } from '@/lib/auth/os-auth';

export default async function OwnerPortalPage() {
  const session = await getOwnerSession();

  // If not authenticated or not an owner, redirect to login
  if (!session) {
    redirect('/os/login');
  }

  // If authenticated as owner, redirect to dashboard
  redirect('/os/dashboard');
}
