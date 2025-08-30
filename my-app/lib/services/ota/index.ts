// OTA Services Export - Consolidated OTA Core Service
export { OTACoreService, otaCoreService } from './ota-core-service';
export type { OTAChannel, SyncResult, RoomMapping, PropertyMapping, SyncConfig, ChannelCredentials } from './ota-core-service';

// Additional OTA service utilities
export * from './ota-core-service';

// Compatibility exports
export { otaCoreService as OTAService } from './ota-core-service';

// Note: Consolidated service using Phase 3 enhanced database operations