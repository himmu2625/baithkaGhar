import { Briefcase, Users, Heart, Utensils } from "lucide-react";

export const STAY_TYPES = {
  'corporate-stay': {
    id: 'corporate-stay',
    label: 'Corporate Stay',
    description: 'Business-friendly accommodations with workspace and high-speed internet',
    icon: Briefcase,
    color: '#2563EB',
    gradient: 'linear-gradient(135deg, #3B82F6 0%, #1E40AF 100%)',
  },
  'family-stay': {
    id: 'family-stay',
    label: 'Family Stay', 
    description: 'Spacious rooms and kid-friendly amenities for the whole family',
    icon: Users,
    color: '#16A34A',
    gradient: 'linear-gradient(135deg, #22C55E 0%, #15803D 100%)',
  },
  'couple-stay': {
    id: 'couple-stay',
    label: 'Couple Stay',
    description: 'Romantic getaways with privacy and special amenities for couples',
    icon: Heart,
    color: '#E11D48',
    gradient: 'linear-gradient(135deg, #F43F5E 0%, #BE123C 100%)',
  },
  'banquet-events': {
    id: 'banquet-events',
    label: 'Banquet & Events',
    description: 'Venues for weddings, conferences, and special occasions',
    icon: Utensils,
    color: '#9333EA',
    gradient: 'linear-gradient(135deg, #A855F7 0%, #7E22CE 100%)',
  },
} as const;

export const STAY_TYPE_OPTIONS = Object.entries(STAY_TYPES).map(([id, stayType]) => ({
  ...stayType
}));

export type StayTypeId = keyof typeof STAY_TYPES;

// Helper function to get stay type by ID
export function getStayTypeById(id: string): typeof STAY_TYPES[StayTypeId] | null {
  return STAY_TYPES[id as StayTypeId] || null;
}

// Helper function to validate stay type
export function isValidStayType(id: string): id is StayTypeId {
  return id in STAY_TYPES;
} 