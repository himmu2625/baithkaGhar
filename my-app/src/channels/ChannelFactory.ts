/**
 * Channel Factory for creating and managing OTA channel instances
 * Provides a centralized way to instantiate, configure, and manage channel connections
 */

import { BaseChannel } from './BaseChannel';
import { ChannelConfig, CHANNEL_DEFAULTS } from './index';
import { BookingComChannel } from './implementations/BookingComChannel';
import { MakeMyTripChannel } from './implementations/MakeMyTripChannel';
import { OYOChannel } from './implementations/OYOChannel';
import { ValidationError, ChannelError } from './errors';
import { createLogger, ILogger } from './utils/Logger';

/**
 * Supported OTA channels
 */
export enum SupportedChannels {
  BOOKING_COM = 'booking.com',
  MAKEMYTRIP = 'makemytrip',
  OYO = 'oyo',
  EXPEDIA = 'expedia',
  AGODA = 'agoda',
  AIRBNB = 'airbnb'
}

/**
 * Channel registry entry
 */
interface ChannelRegistryEntry {
  instance: BaseChannel;
  config: ChannelConfig;
  createdAt: Date;
  lastUsed: Date;
  connectionCount: number;
}

/**
 * Channel factory configuration
 */
export interface ChannelFactoryConfig {
  /** Whether to enable connection pooling */
  enablePooling: boolean;
  
  /** Maximum number of channel instances per type */
  maxInstancesPerChannel: number;
  
  /** Idle timeout for pooled instances (ms) */
  idleTimeout: number;
  
  /** Whether to auto-connect channels on creation */
  autoConnect: boolean;
  
  /** Default retry configuration */
  defaultRetryConfig?: {
    maxAttempts: number;
    baseDelay: number;
    maxDelay: number;
  };
}

/**
 * Channel Factory class for managing OTA channel instances
 */
export class ChannelFactory {
  private readonly logger: ILogger;
  private readonly config: ChannelFactoryConfig;
  private readonly registry: Map<string, ChannelRegistryEntry[]> = new Map();
  private readonly supportedChannels: Map<string, typeof BaseChannel> = new Map();
  
  constructor(config: Partial<ChannelFactoryConfig> = {}) {
    this.config = {
      enablePooling: true,
      maxInstancesPerChannel: 3,
      idleTimeout: 300000, // 5 minutes
      autoConnect: false,
      ...config
    };
    
    this.logger = createLogger('channel-factory');
    this.registerSupportedChannels();
    this.startCleanupTimer();
    
    this.logger.info('Channel Factory initialized', {
      supportedChannels: Array.from(this.supportedChannels.keys()),
      config: this.config
    });
  }

  /**
   * Register supported channel implementations
   */
  private registerSupportedChannels(): void {
    this.supportedChannels.set(SupportedChannels.BOOKING_COM, BookingComChannel as any);
    this.supportedChannels.set(SupportedChannels.MAKEMYTRIP, MakeMyTripChannel as any);
    this.supportedChannels.set(SupportedChannels.OYO, OYOChannel as any);
    // Additional channels can be registered here as they're implemented
  }

  /**
   * Create a channel instance
   * @param channelName - Name of the channel to create
   * @param credentials - Channel credentials
   * @param customConfig - Optional custom configuration
   * @returns Promise resolving to channel instance
   */
  async createChannel(
    channelName: string,
    credentials: Record<string, string>,
    customConfig?: Partial<ChannelConfig>
  ): Promise<BaseChannel> {
    this.logger.info(`Creating channel instance`, { channelName });

    // Validate channel is supported
    if (!this.isChannelSupported(channelName)) {
      throw new ValidationError(
        `Channel '${channelName}' is not supported`,
        channelName,
        'channelName',
        `Supported channels: ${Array.from(this.supportedChannels.keys()).join(', ')}`
      );
    }

    // Check if we can reuse an existing instance (if pooling is enabled)
    if (this.config.enablePooling) {
      const reusableInstance = this.findReusableInstance(channelName, credentials);
      if (reusableInstance) {
        this.logger.debug(`Reusing existing channel instance`, { channelName });
        return reusableInstance;
      }
    }

    // Create new instance
    const channelConfig = this.buildChannelConfig(channelName, credentials, customConfig);
    const ChannelClass = this.supportedChannels.get(channelName)!;
    const instance = new ChannelClass(channelConfig) as BaseChannel;

    // Auto-connect if enabled
    if (this.config.autoConnect) {
      try {
        await instance.connect();
        this.logger.info(`Channel auto-connected successfully`, { channelName });
      } catch (error) {
        this.logger.warn(`Channel auto-connection failed`, error as Error, { channelName });
        // Don't throw error, allow manual connection later
      }
    }

    // Register instance if pooling is enabled
    if (this.config.enablePooling) {
      this.registerInstance(channelName, instance, channelConfig);
    }

    this.logger.info(`Channel instance created successfully`, { channelName });
    return instance;
  }

  /**
   * Get an existing channel instance
   * @param channelName - Name of the channel
   * @param credentials - Channel credentials (for matching)
   * @returns Channel instance or null if not found
   */
  getChannel(channelName: string, credentials: Record<string, string>): BaseChannel | null {
    if (!this.config.enablePooling) return null;

    const instances = this.registry.get(channelName);
    if (!instances || instances.length === 0) return null;

    // Find instance with matching credentials
    const credentialsKey = this.generateCredentialsKey(credentials);
    for (const entry of instances) {
      const entryCredentialsKey = this.generateCredentialsKey(entry.config.credentials);
      if (entryCredentialsKey === credentialsKey) {
        entry.lastUsed = new Date();
        entry.connectionCount++;
        return entry.instance;
      }
    }

    return null;
  }

  /**
   * Test connection for a channel
   * @param channelName - Name of the channel
   * @param credentials - Channel credentials
   * @returns Promise resolving to connection test result
   */
  async testChannelConnection(
    channelName: string,
    credentials: Record<string, string>
  ): Promise<{
    success: boolean;
    responseTime: number;
    error?: string;
    details?: Record<string, any>;
  }> {
    this.logger.info(`Testing channel connection`, { channelName });

    try {
      // Create temporary instance for testing
      const tempInstance = await this.createChannel(channelName, credentials);
      
      // Test connection
      const result = await tempInstance.testConnection();
      
      // Clean up if not pooling
      if (!this.config.enablePooling) {
        try {
          await tempInstance.disconnect();
        } catch (error) {
          this.logger.warn('Failed to disconnect test instance', error as Error);
        }
      }

      this.logger.info(`Channel connection test completed`, { 
        channelName, 
        success: result.success,
        responseTime: result.responseTime
      });

      return {
        success: result.success,
        responseTime: result.responseTime,
        error: result.error,
        details: {
          channelName,
          testedAt: new Date().toISOString()
        }
      };
    } catch (error) {
      this.logger.error(`Channel connection test failed`, error as Error, { channelName });
      
      return {
        success: false,
        responseTime: 0,
        error: (error as Error).message,
        details: {
          channelName,
          testedAt: new Date().toISOString(),
          errorType: error.constructor.name
        }
      };
    }
  }

  /**
   * Get all active channel instances
   * @returns Map of channel names to their instances
   */
  getActiveChannels(): Map<string, BaseChannel[]> {
    const activeChannels = new Map<string, BaseChannel[]>();
    
    for (const [channelName, entries] of this.registry) {
      const instances = entries.map(entry => entry.instance);
      if (instances.length > 0) {
        activeChannels.set(channelName, instances);
      }
    }
    
    return activeChannels;
  }

  /**
   * Get channel health status for all active channels
   * @returns Promise resolving to health status map
   */
  async getChannelHealthStatus(): Promise<Map<string, any[]>> {
    const healthStatus = new Map<string, any[]>();
    
    for (const [channelName, entries] of this.registry) {
      const channelHealth = [];
      
      for (const entry of entries) {
        const health = entry.instance.getConnectionStatus();
        channelHealth.push({
          instanceId: this.generateInstanceId(entry.instance),
          health,
          createdAt: entry.createdAt,
          lastUsed: entry.lastUsed,
          connectionCount: entry.connectionCount
        });
      }
      
      if (channelHealth.length > 0) {
        healthStatus.set(channelName, channelHealth);
      }
    }
    
    return healthStatus;
  }

  /**
   * Disconnect and remove a channel instance
   * @param channelName - Name of the channel
   * @param instance - Instance to remove
   */
  async removeChannel(channelName: string, instance: BaseChannel): Promise<void> {
    this.logger.info(`Removing channel instance`, { channelName });
    
    try {
      await instance.disconnect();
    } catch (error) {
      this.logger.warn('Failed to disconnect channel during removal', error as Error);
    }
    
    const entries = this.registry.get(channelName);
    if (entries) {
      const index = entries.findIndex(entry => entry.instance === instance);
      if (index >= 0) {
        entries.splice(index, 1);
        
        if (entries.length === 0) {
          this.registry.delete(channelName);
        }
      }
    }
    
    this.logger.info(`Channel instance removed`, { channelName });
  }

  /**
   * Disconnect all channels and cleanup
   */
  async shutdown(): Promise<void> {
    this.logger.info('Shutting down Channel Factory');
    
    const disconnectPromises: Promise<void>[] = [];
    
    for (const [channelName, entries] of this.registry) {
      for (const entry of entries) {
        disconnectPromises.push(
          entry.instance.disconnect().catch(error => 
            this.logger.warn(`Failed to disconnect ${channelName}`, error as Error)
          )
        );
      }
    }
    
    await Promise.allSettled(disconnectPromises);
    this.registry.clear();
    
    this.logger.info('Channel Factory shutdown completed');
  }

  /**
   * Get list of supported channels
   */
  getSupportedChannels(): string[] {
    return Array.from(this.supportedChannels.keys());
  }

  // =============================================================================
  // PRIVATE HELPER METHODS
  // =============================================================================

  /**
   * Check if a channel is supported
   */
  private isChannelSupported(channelName: string): boolean {
    return this.supportedChannels.has(channelName);
  }

  /**
   * Build channel configuration from defaults and custom config
   */
  private buildChannelConfig(
    channelName: string,
    credentials: Record<string, string>,
    customConfig?: Partial<ChannelConfig>
  ): ChannelConfig {
    // Get default configuration for the channel
    const defaultConfig = this.getDefaultChannelConfig(channelName);
    
    // Merge with custom configuration
    const config: ChannelConfig = {
      ...defaultConfig,
      ...customConfig,
      credentials: {
        ...defaultConfig.credentials,
        ...credentials
      },
      channelName,
      endpoints: {
        ...defaultConfig.endpoints,
        ...customConfig?.endpoints
      },
      rateLimits: {
        ...defaultConfig.rateLimits,
        ...customConfig?.rateLimits
      },
      timeouts: {
        ...defaultConfig.timeouts,
        ...customConfig?.timeouts
      },
      features: {
        ...defaultConfig.features,
        ...customConfig?.features
      }
    };
    
    return config;
  }

  /**
   * Get default configuration for a channel
   */
  private getDefaultChannelConfig(channelName: string): ChannelConfig {
    const channelDefaults = (CHANNEL_DEFAULTS as any)[channelName.toUpperCase().replace('.', '_')];
    
    if (channelDefaults) {
      return {
        ...channelDefaults,
        credentials: {},
        settings: {}
      };
    }
    
    // Fallback default configuration
    return {
      channelName,
      displayName: channelName,
      credentials: {},
      endpoints: {
        production: '',
        sandbox: ''
      },
      rateLimits: {
        requestsPerMinute: 60,
        burstLimit: 10
      },
      timeouts: {
        connection: 30000,
        request: 30000,
        retry: 300000
      },
      features: {
        supportsInventorySync: true,
        supportsPricingSync: true,
        supportsBookingWebhooks: false,
        supportsBookingModifications: false,
        supportsCancellations: true
      },
      settings: {}
    };
  }

  /**
   * Find reusable channel instance
   */
  private findReusableInstance(channelName: string, credentials: Record<string, string>): BaseChannel | null {
    const instances = this.registry.get(channelName);
    if (!instances || instances.length === 0) return null;

    const credentialsKey = this.generateCredentialsKey(credentials);
    
    for (const entry of instances) {
      const entryCredentialsKey = this.generateCredentialsKey(entry.config.credentials);
      if (entryCredentialsKey === credentialsKey) {
        entry.lastUsed = new Date();
        entry.connectionCount++;
        return entry.instance;
      }
    }

    return null;
  }

  /**
   * Register channel instance in registry
   */
  private registerInstance(channelName: string, instance: BaseChannel, config: ChannelConfig): void {
    if (!this.registry.has(channelName)) {
      this.registry.set(channelName, []);
    }

    const entries = this.registry.get(channelName)!;
    
    // Check if we're at the limit
    if (entries.length >= this.config.maxInstancesPerChannel) {
      // Remove oldest instance
      const oldestEntry = entries.reduce((oldest, current) => 
        current.lastUsed < oldest.lastUsed ? current : oldest
      );
      
      this.removeChannel(channelName, oldestEntry.instance).catch(error =>
        this.logger.warn('Failed to remove oldest instance', error as Error)
      );
    }

    entries.push({
      instance,
      config,
      createdAt: new Date(),
      lastUsed: new Date(),
      connectionCount: 1
    });

    this.logger.debug(`Channel instance registered`, { 
      channelName, 
      totalInstances: entries.length 
    });
  }

  /**
   * Generate unique key for credentials comparison
   */
  private generateCredentialsKey(credentials: Record<string, string>): string {
    const sortedEntries = Object.entries(credentials).sort(([a], [b]) => a.localeCompare(b));
    return JSON.stringify(sortedEntries);
  }

  /**
   * Generate unique instance ID
   */
  private generateInstanceId(instance: BaseChannel): string {
    return `${(instance as any).channelName}-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
  }

  /**
   * Start cleanup timer for idle instances
   */
  private startCleanupTimer(): void {
    if (!this.config.enablePooling) return;

    setInterval(() => {
      this.cleanupIdleInstances().catch(error =>
        this.logger.warn('Cleanup timer error', error as Error)
      );
    }, 60000); // Run every minute
  }

  /**
   * Cleanup idle instances
   */
  private async cleanupIdleInstances(): Promise<void> {
    const now = Date.now();
    const cleanupPromises: Promise<void>[] = [];

    for (const [channelName, entries] of this.registry) {
      const entriesToRemove = entries.filter(entry => 
        now - entry.lastUsed.getTime() > this.config.idleTimeout
      );

      for (const entry of entriesToRemove) {
        cleanupPromises.push(this.removeChannel(channelName, entry.instance));
      }
    }

    if (cleanupPromises.length > 0) {
      await Promise.allSettled(cleanupPromises);
      this.logger.debug(`Cleaned up ${cleanupPromises.length} idle instances`);
    }
  }
}

/**
 * Global channel factory instance
 */
let globalChannelFactory: ChannelFactory | null = null;

/**
 * Get or create global channel factory instance
 */
export function getChannelFactory(config?: Partial<ChannelFactoryConfig>): ChannelFactory {
  if (!globalChannelFactory) {
    globalChannelFactory = new ChannelFactory(config);
  }
  return globalChannelFactory;
}

/**
 * Reset global channel factory (useful for testing)
 */
export async function resetChannelFactory(): Promise<void> {
  if (globalChannelFactory) {
    await globalChannelFactory.shutdown();
    globalChannelFactory = null;
  }
}