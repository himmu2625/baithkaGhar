import { requireOwnerAuth } from '@/lib/auth/os-auth';
import { Building2 } from 'lucide-react';
import Link from 'next/link';
import PropertyEditForm from '@/components/os/PropertyEditForm';

async function getPropertyDetails(id: string) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/os/properties/${id}`, {
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error('Failed to fetch property:', response.statusText);
      return null;
    }

    const data = await response.json();
    return data.property;
  } catch (error) {
    console.error('Error fetching property:', error);
    return null;
  }
}

export default async function EditPropertyPage({ params }: { params: { id: string } }) {
  await requireOwnerAuth();
  const property = await getPropertyDetails(params.id);

  if (!property) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow-sm p-12 border border-gray-200 text-center">
          <Building2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Property Not Found</h3>
          <p className="text-gray-600 mb-6">
            The property you're trying to edit doesn't exist or you don't have access to it.
          </p>
          <Link
            href="/os/properties"
            className="inline-block px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Back to Properties
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <Link
            href={`/os/properties/${property._id}`}
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            ← Back to Property
          </Link>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Edit Property</h1>
        <p className="text-gray-600 mt-1">Update your property information</p>
      </div>

      {/* Edit Form */}
      <PropertyEditForm property={property} />
    </div>
  );
}
