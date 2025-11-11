/**
 * Comprehensive list of ALL standard room categories in the hotel industry
 * This includes hotel rooms, residential units, specialty accommodations, and more
 */

export interface RoomCategory {
  value: string;
  label: string;
  description?: string;
  category: 'hotel' | 'residential' | 'specialty' | 'luxury';
}

export const ALL_ROOM_CATEGORIES: RoomCategory[] = [
  // ========== HOTEL ROOMS ==========
  {
    value: 'standard_room',
    label: 'Standard Room',
    description: 'Basic room with essential amenities',
    category: 'hotel'
  },
  {
    value: 'classic_room',
    label: 'Classic Room',
    description: 'Comfortable room with standard amenities',
    category: 'hotel'
  },
  {
    value: 'deluxe_room',
    label: 'Deluxe Room',
    description: 'Spacious room with premium amenities',
    category: 'hotel'
  },
  {
    value: 'super_deluxe_room',
    label: 'Super Deluxe Room',
    description: 'Extra spacious with upgraded amenities',
    category: 'hotel'
  },
  {
    value: 'premium_room',
    label: 'Premium Room',
    description: 'High-end room with luxury features',
    category: 'hotel'
  },
  {
    value: 'executive_room',
    label: 'Executive Room',
    description: 'Business-class room with work area',
    category: 'hotel'
  },
  {
    value: 'superior_room',
    label: 'Superior Room',
    description: 'Enhanced room with better amenities',
    category: 'hotel'
  },
  {
    value: 'comfort_room',
    label: 'Comfort Room',
    description: 'Cozy room designed for comfort',
    category: 'hotel'
  },

  // ========== SUITES ==========
  {
    value: 'suite',
    label: 'Suite',
    description: 'Multi-room suite with living area',
    category: 'luxury'
  },
  {
    value: 'junior_suite',
    label: 'Junior Suite',
    description: 'Compact suite with separate seating',
    category: 'luxury'
  },
  {
    value: 'executive_suite',
    label: 'Executive Suite',
    description: 'Premium suite for business travelers',
    category: 'luxury'
  },
  {
    value: 'family_suite',
    label: 'Family Suite',
    description: 'Spacious suite for families',
    category: 'luxury'
  },
  {
    value: 'presidential_suite',
    label: 'Presidential Suite',
    description: 'Ultra-luxury suite with premium services',
    category: 'luxury'
  },
  {
    value: 'royal_suite',
    label: 'Royal Suite',
    description: 'Opulent suite with royal treatment',
    category: 'luxury'
  },
  {
    value: 'honeymoon_suite',
    label: 'Honeymoon Suite',
    description: 'Romantic suite for couples',
    category: 'luxury'
  },
  {
    value: 'bridal_suite',
    label: 'Bridal Suite',
    description: 'Elegant suite for newlyweds',
    category: 'luxury'
  },
  {
    value: 'penthouse_suite',
    label: 'Penthouse Suite',
    description: 'Top-floor luxury suite',
    category: 'luxury'
  },

  // ========== SPECIALTY ROOMS ==========
  {
    value: 'king_room',
    label: 'King Room',
    description: 'Room with king-size bed',
    category: 'hotel'
  },
  {
    value: 'queen_room',
    label: 'Queen Room',
    description: 'Room with queen-size bed',
    category: 'hotel'
  },
  {
    value: 'twin_room',
    label: 'Twin Room',
    description: 'Room with two single beds',
    category: 'hotel'
  },
  {
    value: 'triple_room',
    label: 'Triple Room',
    description: 'Room accommodating three guests',
    category: 'hotel'
  },
  {
    value: 'quad_room',
    label: 'Quad Room',
    description: 'Room accommodating four guests',
    category: 'hotel'
  },
  {
    value: 'family_room',
    label: 'Family Room',
    description: 'Large room for families',
    category: 'hotel'
  },
  {
    value: 'connecting_room',
    label: 'Connecting Rooms',
    description: 'Adjacent rooms with connecting door',
    category: 'hotel'
  },
  {
    value: 'adjoining_room',
    label: 'Adjoining Rooms',
    description: 'Rooms next to each other',
    category: 'hotel'
  },

  // ========== ACCESSIBLE ROOMS ==========
  {
    value: 'accessible_room',
    label: 'Accessible Room',
    description: 'Wheelchair accessible room',
    category: 'hotel'
  },
  {
    value: 'hearing_accessible_room',
    label: 'Hearing Accessible Room',
    description: 'Room with hearing assistance features',
    category: 'hotel'
  },
  {
    value: 'mobility_accessible_room',
    label: 'Mobility Accessible Room',
    description: 'Room with mobility assistance features',
    category: 'hotel'
  },

  // ========== VIEW-BASED ROOMS ==========
  {
    value: 'ocean_view_room',
    label: 'Ocean View Room',
    description: 'Room with ocean/sea view',
    category: 'specialty'
  },
  {
    value: 'sea_view_room',
    label: 'Sea View Room',
    description: 'Room overlooking the sea',
    category: 'specialty'
  },
  {
    value: 'mountain_view_room',
    label: 'Mountain View Room',
    description: 'Room with mountain view',
    category: 'specialty'
  },
  {
    value: 'garden_view_room',
    label: 'Garden View Room',
    description: 'Room overlooking gardens',
    category: 'specialty'
  },
  {
    value: 'pool_view_room',
    label: 'Pool View Room',
    description: 'Room overlooking the pool',
    category: 'specialty'
  },
  {
    value: 'city_view_room',
    label: 'City View Room',
    description: 'Room with city skyline view',
    category: 'specialty'
  },
  {
    value: 'lake_view_room',
    label: 'Lake View Room',
    description: 'Room overlooking a lake',
    category: 'specialty'
  },
  {
    value: 'river_view_room',
    label: 'River View Room',
    description: 'Room with river view',
    category: 'specialty'
  },
  {
    value: 'beach_view_room',
    label: 'Beach View Room',
    description: 'Room facing the beach',
    category: 'specialty'
  },

  // ========== RESIDENTIAL UNITS (BHK) ==========
  {
    value: 'studio',
    label: 'Studio',
    description: 'Open-plan living space',
    category: 'residential'
  },
  {
    value: '1bhk',
    label: '1BHK',
    description: '1 Bedroom, Hall, Kitchen',
    category: 'residential'
  },
  {
    value: '2bhk',
    label: '2BHK',
    description: '2 Bedrooms, Hall, Kitchen',
    category: 'residential'
  },
  {
    value: '3bhk',
    label: '3BHK',
    description: '3 Bedrooms, Hall, Kitchen',
    category: 'residential'
  },
  {
    value: '4bhk',
    label: '4BHK',
    description: '4 Bedrooms, Hall, Kitchen',
    category: 'residential'
  },
  {
    value: '5bhk',
    label: '5BHK',
    description: '5 Bedrooms, Hall, Kitchen',
    category: 'residential'
  },
  {
    value: '6bhk',
    label: '6BHK',
    description: '6 Bedrooms, Hall, Kitchen',
    category: 'residential'
  },

  // ========== SPECIALTY ACCOMMODATIONS ==========
  {
    value: 'villa',
    label: 'Villa',
    description: 'Private standalone villa',
    category: 'specialty'
  },
  {
    value: 'cottage',
    label: 'Cottage',
    description: 'Cozy standalone cottage',
    category: 'specialty'
  },
  {
    value: 'wooden_cottage',
    label: 'Wooden Cottage',
    description: 'Rustic wooden cottage',
    category: 'specialty'
  },
  {
    value: 'bungalow',
    label: 'Bungalow',
    description: 'Detached single-story house',
    category: 'specialty'
  },
  {
    value: 'chalet',
    label: 'Chalet',
    description: 'Alpine-style wooden house',
    category: 'specialty'
  },
  {
    value: 'cabin',
    label: 'Cabin',
    description: 'Small wooden shelter',
    category: 'specialty'
  },
  {
    value: 'loft',
    label: 'Loft',
    description: 'Open-plan upper floor space',
    category: 'specialty'
  },
  {
    value: 'penthouse',
    label: 'Penthouse',
    description: 'Luxury top-floor apartment',
    category: 'luxury'
  },
  {
    value: 'apartment',
    label: 'Apartment',
    description: 'Self-contained residential unit',
    category: 'residential'
  },

  // ========== THEMED ROOMS ==========
  {
    value: 'romantic_room',
    label: 'Romantic Room',
    description: 'Room designed for couples',
    category: 'specialty'
  },
  {
    value: 'themed_room',
    label: 'Themed Room',
    description: 'Room with special theme decor',
    category: 'specialty'
  },
  {
    value: 'heritage_room',
    label: 'Heritage Room',
    description: 'Traditional heritage-style room',
    category: 'specialty'
  },
  {
    value: 'contemporary_room',
    label: 'Contemporary Room',
    description: 'Modern styled room',
    category: 'hotel'
  },

  // ========== LUXURY CATEGORIES ==========
  {
    value: 'club_room',
    label: 'Club Room',
    description: 'Room with club lounge access',
    category: 'luxury'
  },
  {
    value: 'cabana',
    label: 'Cabana',
    description: 'Poolside or beachside shelter',
    category: 'luxury'
  },
  {
    value: 'pavilion',
    label: 'Pavilion',
    description: 'Open-sided structure',
    category: 'luxury'
  },
  {
    value: 'private_pool_villa',
    label: 'Private Pool Villa',
    description: 'Villa with private pool',
    category: 'luxury'
  },
  {
    value: 'jacuzzi_room',
    label: 'Jacuzzi Room',
    description: 'Room with private jacuzzi',
    category: 'luxury'
  },

  // ========== DORMITORY & SHARED ==========
  {
    value: 'dormitory',
    label: 'Dormitory',
    description: 'Shared room with multiple beds',
    category: 'hotel'
  },
  {
    value: 'hostel_bed',
    label: 'Hostel Bed',
    description: 'Single bed in shared space',
    category: 'hotel'
  },
  {
    value: 'capsule_room',
    label: 'Capsule Room',
    description: 'Compact pod-style accommodation',
    category: 'specialty'
  },

  // ========== ECO & NATURE ==========
  {
    value: 'eco_room',
    label: 'Eco Room',
    description: 'Environmentally friendly room',
    category: 'specialty'
  },
  {
    value: 'tree_house',
    label: 'Tree House',
    description: 'Elevated house in trees',
    category: 'specialty'
  },
  {
    value: 'tent',
    label: 'Luxury Tent',
    description: 'Glamping tent accommodation',
    category: 'specialty'
  },
  {
    value: 'igloo',
    label: 'Igloo',
    description: 'Ice/snow structure room',
    category: 'specialty'
  },

  // ========== BUSINESS & CONFERENCE ==========
  {
    value: 'business_room',
    label: 'Business Room',
    description: 'Room optimized for business travelers',
    category: 'hotel'
  },
  {
    value: 'conference_room',
    label: 'Conference Room',
    description: 'Meeting and conference space',
    category: 'hotel'
  },
];

// Helper function to search/filter room categories
export function searchRoomCategories(query: string): RoomCategory[] {
  if (!query || query.trim() === '') {
    return ALL_ROOM_CATEGORIES;
  }

  const searchTerm = query.toLowerCase().trim();

  return ALL_ROOM_CATEGORIES.filter(category =>
    category.label.toLowerCase().includes(searchTerm) ||
    category.value.toLowerCase().includes(searchTerm) ||
    category.description?.toLowerCase().includes(searchTerm)
  );
}

// Helper function to get category by value
export function getRoomCategoryByValue(value: string): RoomCategory | undefined {
  return ALL_ROOM_CATEGORIES.find(cat => cat.value === value);
}

// Helper function to group categories by type
export function groupRoomCategoriesByType(): Record<string, RoomCategory[]> {
  return ALL_ROOM_CATEGORIES.reduce((acc, category) => {
    const type = category.category;
    if (!acc[type]) {
      acc[type] = [];
    }
    acc[type].push(category);
    return acc;
  }, {} as Record<string, RoomCategory[]>);
}
