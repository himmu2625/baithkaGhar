import { requireOwnerAuth } from '@/lib/auth/os-auth';
import OwnerSidebar from '@/components/os/OwnerSidebar';
import OwnerHeader from '@/components/os/OwnerHeader';

export const metadata = {
  title: 'Baithaka Ghar OS - Owner Portal',
  description: 'Property owner management portal',
};

export default async function OwnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // This will redirect to login if not authenticated or not an owner
  const session = await requireOwnerAuth();

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar */}
      <OwnerSidebar session={session} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <OwnerHeader session={session} />

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
