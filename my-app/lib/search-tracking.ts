import { connectMongo } from './db/mongodb'
import SearchQuery from '@/models/SearchQuery'
import Property from '@/models/Property'
import { type Session } from 'next-auth'

/**
 * Interface defining the search parameters
 */
interface SearchParams {
  searchTerm: string
  location?: string
  checkIn?: string
  checkOut?: string
  guests?: number
}

interface SearchQueryData {
  searchTerm: string
  isPropertyListed: boolean
  location?: string
  checkIn?: Date
  checkOut?: Date
  guests?: number
  metadata?: {
    resultCount: number
  }
  userId?: string
  userName?: string | null
  userEmail?: string | null
}

/**
 * Track a property search, especially when the property is not found
 */
export async function trackPropertySearch(
  searchParams: SearchParams,
  session?: Session | null
): Promise<void> {
  if (!searchParams.searchTerm) return;

  try {
    await connectMongo();

    const propertyExists = await Property.exists({
      $or: [
        { name: { $regex: searchParams.searchTerm, $options: 'i' } },
        { description: { $regex: searchParams.searchTerm, $options: 'i' } },
        { location: { $regex: searchParams.searchTerm, $options: 'i' } },
      ]
    });

    if (propertyExists) return;

    const searchQuery: SearchQueryData = {
      searchTerm: searchParams.searchTerm,
      isPropertyListed: false,
      location: searchParams.location,
      checkIn: searchParams.checkIn ? new Date(searchParams.checkIn) : undefined,
      checkOut: searchParams.checkOut ? new Date(searchParams.checkOut) : undefined,
      guests: searchParams.guests,
    };

    if (session?.user) {
      searchQuery.userId = session.user.id;
      searchQuery.userName = session.user.name;
      searchQuery.userEmail = session.user.email;
    }

    await SearchQuery.create(searchQuery);
    console.log('Tracked search for unlisted property:', searchParams.searchTerm);
  } catch (error) {
    console.error('Error tracking property search:', error);
  }
}

/**
 * Track a property search regardless of whether the property exists
 */
export async function trackAllSearches(
  searchParams: SearchParams,
  hasResults: boolean,
  resultCount: number,
  session?: Session | null
): Promise<void> {
  if (!searchParams.searchTerm) return;

  try {
    await connectMongo();

    const searchQuery: SearchQueryData = {
      searchTerm: searchParams.searchTerm,
      isPropertyListed: hasResults,
      location: searchParams.location,
      checkIn: searchParams.checkIn ? new Date(searchParams.checkIn) : undefined,
      checkOut: searchParams.checkOut ? new Date(searchParams.checkOut) : undefined,
      guests: searchParams.guests,
      metadata: { resultCount },
    };

    if (session?.user) {
      searchQuery.userId = session.user.id;
      searchQuery.userName = session.user.name;
      searchQuery.userEmail = session.user.email;
    }

    await SearchQuery.create(searchQuery);
  } catch (error) {
    console.error('Error tracking search analytics:', error);
  }
}
