import Event from '@/models/Event';
import { format, parseISO, isWithinInterval } from 'date-fns';

interface EventPricingData {
  hasEvents: boolean;
  events: Array<{
    _id: string;
    name: string;
    type: string;
    impact: 'low' | 'medium' | 'high';
    suggestedPriceMultiplier: number;
    startDate: string;
    endDate: string;
  }>;
  highestImpactMultiplier: number;
  averageMultiplier: number;
  eventNames: string[];
}

/**
 * Get events that overlap with the given date range for a specific location
 */
export async function getEventsForDateRange(
  startDate: string,
  endDate: string,
  city: string,
  region: string
): Promise<EventPricingData> {
  try {
    // Query events that overlap with the booking period
    const events = await Event.find({
      isActive: true,
      $and: [
        {
          $or: [
            { city: { $regex: city, $options: 'i' } },
            { region: { $regex: region, $options: 'i' } },
            { isNational: true }
          ]
        },
        {
          $or: [
            // Event starts within the range
            { startDate: { $gte: startDate, $lte: endDate } },
            // Event ends within the range
            { endDate: { $gte: startDate, $lte: endDate } },
            // Event spans the entire range
            { startDate: { $lte: startDate }, endDate: { $gte: endDate } }
          ]
        }
      ]
    })
    .sort({ impact: -1, suggestedPriceMultiplier: -1 })
    .lean();

    if (!events.length) {
      return {
        hasEvents: false,
        events: [],
        highestImpactMultiplier: 1.0,
        averageMultiplier: 1.0,
        eventNames: []
      };
    }

    // Calculate pricing adjustments
    const highestImpactEvent = events[0];
    const highestImpactMultiplier = highestImpactEvent.suggestedPriceMultiplier;
    
    // Calculate average multiplier weighted by impact
    const impactWeights = { low: 1, medium: 2, high: 3 };
    let totalWeightedMultiplier = 0;
    let totalWeight = 0;

    events.forEach(event => {
      const weight = impactWeights[event.impact as 'low' | 'medium' | 'high'];
      totalWeightedMultiplier += event.suggestedPriceMultiplier * weight;
      totalWeight += weight;
    });

    const averageMultiplier = totalWeight > 0 ? totalWeightedMultiplier / totalWeight : 1.0;

    return {
      hasEvents: true,
      events: events.map(event => ({
        _id: (event._id as any).toString(),
        name: event.name,
        type: event.type,
        impact: event.impact,
        suggestedPriceMultiplier: event.suggestedPriceMultiplier,
        startDate: event.startDate,
        endDate: event.endDate
      })),
      highestImpactMultiplier,
      averageMultiplier,
      eventNames: events.map(event => event.name)
    };

  } catch (error) {
    console.error('Error fetching events for pricing:', error);
    return {
      hasEvents: false,
      events: [],
      highestImpactMultiplier: 1.0,
      averageMultiplier: 1.0,
      eventNames: []
    };
  }
}

/**
 * Check if a specific date has any events
 */
export async function hasEventsOnDate(
  date: string,
  city: string,
  region: string
): Promise<boolean> {
  try {
    const eventCount = await Event.countDocuments({
      isActive: true,
      $and: [
        {
          $or: [
            { city: { $regex: city, $options: 'i' } },
            { region: { $regex: region, $options: 'i' } },
            { isNational: true }
          ]
        },
        {
          startDate: { $lte: date },
          endDate: { $gte: date }
        }
      ]
    });

    return eventCount > 0;
  } catch (error) {
    console.error('Error checking events for date:', error);
    return false;
  }
}

/**
 * Get event-specific pricing suggestions for admin interface
 */
export async function getEventPricingSuggestions(
  propertyId: string,
  city: string,
  region: string,
  basePrice: number,
  startDate?: string,
  endDate?: string
): Promise<{
  currentEvents: EventPricingData;
  upcomingEvents: Array<{
    event: any;
    suggestedPrice: number;
    currentPrice: number;
    priceIncrease: number;
    percentageIncrease: number;
  }>;
}> {
  try {
    // Get current events if date range provided
    let currentEvents: EventPricingData = {
      hasEvents: false,
      events: [],
      highestImpactMultiplier: 1.0,
      averageMultiplier: 1.0,
      eventNames: []
    };

    if (startDate && endDate) {
      currentEvents = await getEventsForDateRange(startDate, endDate, city, region);
    }

    // Get upcoming events (next 90 days)
    const today = new Date();
    const futureDate = new Date();
    futureDate.setDate(today.getDate() + 90);

    const upcomingEvents = await Event.find({
      isActive: true,
      $and: [
        {
          $or: [
            { city: { $regex: city, $options: 'i' } },
            { region: { $regex: region, $options: 'i' } },
            { isNational: true }
          ]
        },
        {
          startDate: {
            $gte: format(today, 'yyyy-MM-dd'),
            $lte: format(futureDate, 'yyyy-MM-dd')
          }
        }
      ]
    })
    .sort({ startDate: 1, impact: -1 })
    .lean();

    const eventSuggestions = upcomingEvents.map(event => {
      const suggestedPrice = Math.round(basePrice * event.suggestedPriceMultiplier);
      const priceIncrease = suggestedPrice - basePrice;
      const percentageIncrease = ((priceIncrease / basePrice) * 100);

      return {
        event: {
          ...event,
          _id: (event._id as any).toString()
        },
        suggestedPrice,
        currentPrice: basePrice,
        priceIncrease,
        percentageIncrease: Math.round(percentageIncrease * 100) / 100
      };
    });

    return {
      currentEvents,
      upcomingEvents: eventSuggestions
    };

  } catch (error) {
    console.error('Error getting event pricing suggestions:', error);
    return {
      currentEvents: {
        hasEvents: false,
        events: [],
        highestImpactMultiplier: 1.0,
        averageMultiplier: 1.0,
        eventNames: []
      },
      upcomingEvents: []
    };
  }
}

/**
 * Apply event pricing to existing dynamic pricing calculation
 */
export function applyEventPricing(
  basePrice: number,
  dynamicMultiplier: number,
  eventData: EventPricingData,
  useHighestImpact: boolean = true
): {
  finalPrice: number;
  eventMultiplier: number;
  appliedEvents: string[];
} {
  if (!eventData.hasEvents) {
    return {
      finalPrice: Math.round(basePrice * dynamicMultiplier),
      eventMultiplier: 1.0,
      appliedEvents: []
    };
  }

  // Choose between highest impact or average multiplier
  const eventMultiplier = useHighestImpact 
    ? eventData.highestImpactMultiplier 
    : eventData.averageMultiplier;

  // Combine dynamic pricing with event pricing
  const combinedMultiplier = dynamicMultiplier * eventMultiplier;
  const finalPrice = Math.round(basePrice * combinedMultiplier);

  return {
    finalPrice,
    eventMultiplier,
    appliedEvents: eventData.eventNames
  };
}

/**
 * Get event badge info for calendar display
 */
export function getEventBadgeInfo(event: any): {
  color: string;
  text: string;
  icon: string;
} {
  const typeColors = {
    holiday: 'bg-red-100 text-red-800',
    festival: 'bg-purple-100 text-purple-800',
    conference: 'bg-blue-100 text-blue-800',
    sports: 'bg-green-100 text-green-800',
    concert: 'bg-pink-100 text-pink-800',
    local_event: 'bg-orange-100 text-orange-800',
    religious: 'bg-yellow-100 text-yellow-800',
    cultural: 'bg-indigo-100 text-indigo-800',
    custom: 'bg-gray-100 text-gray-800'
  };

  const typeIcons = {
    holiday: '🏖️',
    festival: '🎉',
    conference: '📊',
    sports: '⚽',
    concert: '🎵',
    local_event: '📍',
    religious: '🕌',
    cultural: '🎭',
    custom: '📅'
  };

  return {
    color: typeColors[event.type as keyof typeof typeColors] || typeColors.custom,
    text: event.impact === 'high' ? 'High Impact' : event.impact === 'medium' ? 'Med Impact' : 'Low Impact',
    icon: typeIcons[event.type as keyof typeof typeIcons] || typeIcons.custom
  };
} 