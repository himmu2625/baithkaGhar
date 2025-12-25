import { requireOwnerAuth } from '@/lib/auth/os-auth';
import { Building2, Search, Filter } from 'lucide-react';
import PropertyCard from '@/components/os/PropertyCard';

async function getOwnerProperties() {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/os/properties`, {
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error('Failed to fetch properties:', response.statusText);
      return { properties: [], total: 0 };
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching properties:', error);
    return { properties: [], total: 0 };
  }
}

export default async function OwnerPropertiesPage() {
  await requireOwnerAuth(); // Ensure user is authenticated
  const { properties, total } = await getOwnerProperties();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Properties</h1>
          <p className="text-sm text-gray-600 mt-1">
            {total} {total === 1 ? 'property' : 'properties'} found
          </p>
        </div>
        <a
          href="/admin/properties/new"
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
        >
          Add Property
        </a>
      </div>

      {/* Search and Filters - Placeholder for future enhancement */}
      <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search properties..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              disabled
            />
          </div>
          <button
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
            disabled
          >
            <Filter className="w-5 h-5" />
            Filters
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Search and filter features coming soon
        </p>
      </div>

      {/* Properties Grid */}
      {properties.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {properties.map((property: any) => (
            <PropertyCard key={property._id} property={property} />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm p-12 border border-gray-200 text-center">
          <Building2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Properties Found</h3>
          <p className="text-gray-600 mb-6">
            You don't have any properties assigned to your account yet.
          </p>
          <p className="text-sm text-gray-500">
            Please contact the administrator to assign properties to your account.
          </p>
        </div>
      )}
    </div>
  );
}
