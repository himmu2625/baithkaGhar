// OTA Services Export
export { OTACoreService, otaCoreService } from './ota-core-service';
export type { OTAChannel, SyncResult } from './ota-core-service';

// Additional OTA service utilities can be exported here
export * from './ota-core-service';

// Compatibility export
export const OTAService = OTACoreService;