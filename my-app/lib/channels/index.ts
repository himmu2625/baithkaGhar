// Base Channel Connector
export { OTAChannelBase } from './base-channel-connector';
export type { ChannelConfig, InventoryItem, RateItem } from './base-channel-connector';

// International OTA Connectors
export { BookingComConnector } from './booking-com-connector';
export type { BookingComConfig, BookingComInventory } from './booking-com-connector';

export { ExpediaConnector } from './expedia-connector';
export type { ExpediaConfig, ExpediaRate } from './expedia-connector';

export { AgodaConnector } from './agoda-connector';
export type { AgodaConfig, AgodaBooking } from './agoda-connector';

export { AirbnbConnector } from './airbnb-connector';
export type { AirbnbConfig, AirbnbListing, AirbnbReservation, AirbnbCalendarEntry } from './airbnb-connector';

export { TripAdvisorConnector } from './tripadvisor-connector';
export type { TripAdvisorConfig, TripAdvisorInventory, TripAdvisorBooking } from './tripadvisor-connector';

// Indian OTA Connectors
export { MakeMyTripConnector } from './makemytrip-connector';
export type { MakeMyTripConfig, MakeMyTripInventory, MakeMyTripBooking } from './makemytrip-connector';

export { GoibiboConnector } from './goibibo-connector';
export type { GoibiboConfig, GoibiboBooking, GoibiboInventory } from './goibibo-connector';

export { CleartripConnector } from './cleartrip-connector';
export type { CleartripConfig, CleartripBooking, CleartripInventory } from './cleartrip-connector';

export { EaseMyTripConnector } from './easemytrip-connector';
export type { EaseMyTripConfig, EaseMyTripBooking, EaseMyTripInventory } from './easemytrip-connector';

// Domestic OTA Connectors
export { OyoConnector } from './oyo-connector';
export type { OyoConfig, OyoBooking, OyoInventory } from './oyo-connector';

// Connector Factory
export interface ConnectorConstructor {
  new (propertyId: string): OTAChannelBase;
}

export const CONNECTOR_MAP: Record<string, ConnectorConstructor> = {
  // International OTAs
  'booking.com': BookingComConnector,
  'expedia': ExpediaConnector,
  'agoda': AgodaConnector,
  'airbnb': AirbnbConnector,
  'tripadvisor': TripAdvisorConnector,
  
  // Indian OTAs
  'makemytrip': MakeMyTripConnector,
  'goibibo': GoibiboConnector,
  'cleartrip': CleartripConnector,
  'easemytrip': EaseMyTripConnector,
  
  // Domestic OTAs
  'oyo': OyoConnector
};

/**
 * Factory function to create OTA connector instances
 * @param channelName - The OTA channel name
 * @param propertyId - The property ID
 * @returns OTA connector instance
 */
export function createConnector(channelName: string, propertyId: string): OTAChannelBase {
  const ConnectorClass = CONNECTOR_MAP[channelName.toLowerCase()];
  
  if (!ConnectorClass) {
    throw new Error(`Unsupported OTA channel: ${channelName}`);
  }
  
  return new ConnectorClass(propertyId);
}

/**
 * Get all supported channel names
 * @returns Array of supported channel names
 */
export function getSupportedChannels(): string[] {
  return Object.keys(CONNECTOR_MAP);
}

/**
 * Check if a channel is supported
 * @param channelName - The channel name to check
 * @returns Whether the channel is supported
 */
export function isChannelSupported(channelName: string): boolean {
  return channelName.toLowerCase() in CONNECTOR_MAP;
}

/**
 * Get connector by channel name (without creating instance)
 * @param channelName - The channel name
 * @returns Connector class
 */
export function getConnectorClass(channelName: string): ConnectorConstructor | null {
  return CONNECTOR_MAP[channelName.toLowerCase()] || null;
}