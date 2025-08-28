-- OTA Channel Manager Database Schema
-- This is the SQL equivalent of the MongoDB models for reference

-- =====================================================
-- PROPERTIES TABLE
-- Stores information about each hotel using Baithaka
-- =====================================================
CREATE TABLE properties (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    baithak_property_id VARCHAR(100) UNIQUE NOT NULL, -- Links to existing Property model
    name VARCHAR(255) NOT NULL,
    
    -- Address information
    street_address TEXT,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    country VARCHAR(50) DEFAULT 'India',
    pincode VARCHAR(20),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    
    -- Contact information  
    owner_email VARCHAR(255) NOT NULL,
    manager_email VARCHAR(255),
    contact_phone VARCHAR(20),
    
    -- Property details
    total_rooms INTEGER NOT NULL CHECK (total_rooms > 0),
    property_type VARCHAR(50) NOT NULL CHECK (property_type IN ('hotel', 'resort', 'guesthouse', 'homestay', 'apartment', 'villa')),
    star_rating INTEGER CHECK (star_rating BETWEEN 1 AND 5),
    
    -- Business status
    status VARCHAR(50) DEFAULT 'pending_approval' CHECK (status IN ('active', 'inactive', 'pending_approval', 'suspended')),
    subscription_plan VARCHAR(50) DEFAULT 'trial' CHECK (subscription_plan IN ('basic', 'premium', 'enterprise', 'trial')),
    subscription_status VARCHAR(50) DEFAULT 'active' CHECK (subscription_status IN ('active', 'inactive', 'cancelled', 'past_due')),
    subscription_expires_at TIMESTAMP,
    
    -- OTA integration settings
    ota_integration_enabled BOOLEAN DEFAULT FALSE,
    auto_sync_enabled BOOLEAN DEFAULT TRUE,
    sync_frequency_minutes INTEGER DEFAULT 15 CHECK (sync_frequency_minutes BETWEEN 5 AND 1440),
    
    -- Operational settings
    timezone VARCHAR(50) DEFAULT 'Asia/Kolkata',
    currency VARCHAR(3) DEFAULT 'INR',
    check_in_time TIME DEFAULT '14:00:00',
    check_out_time TIME DEFAULT '11:00:00',
    
    -- Verification and compliance
    is_verified BOOLEAN DEFAULT FALSE,
    verified_at TIMESTAMP,
    verified_by VARCHAR(100),
    
    -- Metadata
    onboarded_at TIMESTAMP,
    onboarded_by VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for properties
CREATE INDEX idx_properties_owner_email ON properties(owner_email);
CREATE INDEX idx_properties_baithak_id ON properties(baithak_property_id);
CREATE INDEX idx_properties_status ON properties(status, subscription_status);
CREATE INDEX idx_properties_location ON properties(city, state);
CREATE INDEX idx_properties_ota_enabled ON properties(ota_integration_enabled);
CREATE INDEX idx_properties_created ON properties(created_at);

-- =====================================================
-- OTA_CHANNEL_CONFIGS TABLE
-- Stores hotel's credentials and settings for each OTA
-- =====================================================
CREATE TABLE ota_channel_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    
    -- Channel identification
    channel_name VARCHAR(50) NOT NULL CHECK (channel_name IN ('booking.com', 'oyo', 'makemytrip', 'airbnb', 'goibibo', 'trivago', 'agoda', 'expedia')),
    channel_display_name VARCHAR(100),
    
    -- Hotel's credentials on this channel (ENCRYPTED in application layer)
    channel_property_id VARCHAR(100) NOT NULL, -- Hotel's ID on the OTA platform
    credentials JSONB NOT NULL, -- Encrypted API keys, usernames, passwords, etc.
    
    -- Configuration and status
    enabled BOOLEAN DEFAULT FALSE,
    sync_status VARCHAR(50) DEFAULT 'setup_required' CHECK (sync_status IN ('active', 'paused', 'error', 'setup_required', 'authentication_failed')),
    last_sync_at TIMESTAMP,
    last_successful_sync_at TIMESTAMP,
    sync_error_count INTEGER DEFAULT 0,
    last_error_message TEXT,
    
    -- Sync settings
    sync_settings JSONB DEFAULT '{
        "inventorySync": true,
        "rateSync": true, 
        "bookingSync": true,
        "autoSync": true,
        "syncFrequencyMinutes": 15
    }',
    
    -- Room and rate mappings (critical for syncing)
    room_type_mappings JSONB DEFAULT '[]', -- Array of room type mappings
    rate_plan_mappings JSONB DEFAULT '[]', -- Array of rate plan mappings
    
    -- Channel-specific settings
    channel_settings JSONB DEFAULT '{}',
    
    -- Performance tracking
    sync_stats JSONB DEFAULT '{
        "totalSyncs": 0,
        "successfulSyncs": 0,
        "failedSyncs": 0
    }',
    
    -- Webhook configuration
    webhook_config JSONB DEFAULT '{"enabled": false}',
    
    -- Verification
    is_verified BOOLEAN DEFAULT FALSE,
    verified_at TIMESTAMP,
    verified_by VARCHAR(100),
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Ensure unique channel per property
    UNIQUE(property_id, channel_name)
);

-- Indexes for ota_channel_configs
CREATE INDEX idx_ota_configs_property ON ota_channel_configs(property_id);
CREATE INDEX idx_ota_configs_channel ON ota_channel_configs(channel_name, enabled);
CREATE INDEX idx_ota_configs_sync_status ON ota_channel_configs(sync_status);
CREATE INDEX idx_ota_configs_enabled ON ota_channel_configs(enabled, sync_status);
CREATE INDEX idx_ota_configs_last_sync ON ota_channel_configs(last_sync_at);
CREATE INDEX idx_ota_configs_auto_sync ON ota_channel_configs(((sync_settings->>'autoSync')::boolean), enabled) WHERE (sync_settings->>'autoSync')::boolean = true;

-- =====================================================
-- BOOKINGS TABLE  
-- Stores all bookings received from OTA channels
-- =====================================================
CREATE TABLE bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    ota_channel_config_id UUID NOT NULL REFERENCES ota_channel_configs(id) ON DELETE CASCADE,
    
    -- External booking reference
    external_booking_id VARCHAR(200) NOT NULL, -- Booking ID from OTA platform
    channel_name VARCHAR(50) NOT NULL CHECK (channel_name IN ('booking.com', 'oyo', 'makemytrip', 'airbnb', 'goibibo', 'trivago', 'agoda', 'expedia')),
    
    -- Booking status and details
    booking_status VARCHAR(50) DEFAULT 'confirmed' CHECK (booking_status IN ('confirmed', 'cancelled', 'modified', 'no_show', 'checked_in', 'checked_out')),
    booking_source VARCHAR(50) NOT NULL,
    
    -- Guest information
    guest_details JSONB NOT NULL, -- firstName, lastName, email, phone, etc.
    
    -- Room and stay details
    room_details JSONB NOT NULL, -- roomTypeId, roomTypeName, numberOfRooms, etc.
    
    -- Stay dates
    check_in DATE NOT NULL,
    check_out DATE NOT NULL,  
    number_of_nights INTEGER NOT NULL,
    
    -- Timing
    estimated_arrival_time TIME,
    estimated_departure_time TIME,
    actual_checkin_time TIMESTAMP,
    actual_checkout_time TIMESTAMP,
    
    -- Pricing and payment
    amount JSONB NOT NULL, -- totalAmount, currency, breakdown, commission, etc.
    
    -- Cancellation details
    cancellation_details JSONB DEFAULT '{}',
    
    -- Modification history
    modifications JSONB DEFAULT '[]', -- Array of modification records
    
    -- OTA-specific data that doesn't fit standard schema
    ota_specific_data JSONB DEFAULT '{}',
    
    -- Sync and processing status
    sync_status VARCHAR(50) DEFAULT 'synced' CHECK (sync_status IN ('synced', 'pending', 'failed', 'processing')),
    sync_error TEXT,
    last_sync_attempt TIMESTAMP,
    sync_attempts INTEGER DEFAULT 0,
    
    -- Integration with local booking system
    local_booking_id VARCHAR(100), -- Reference to existing booking model
    is_linked_to_local_booking BOOLEAN DEFAULT FALSE,
    
    -- Processing status
    processing_status VARCHAR(50) DEFAULT 'new' CHECK (processing_status IN ('new', 'processing', 'confirmed', 'allocated', 'completed', 'cancelled')),
    processing_notes TEXT[],
    
    -- Communication and reviews
    communications JSONB DEFAULT '[]',
    guest_review JSONB,
    
    -- Operations
    housekeeping_status JSONB DEFAULT '{}',
    alerts JSONB DEFAULT '[]',
    
    -- Timestamps
    booked_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    received_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Ensure unique external booking per channel per property
    UNIQUE(property_id, external_booking_id, channel_name)
);

-- Indexes for bookings
CREATE INDEX idx_bookings_property ON bookings(property_id);
CREATE INDEX idx_bookings_channel_config ON bookings(ota_channel_config_id);
CREATE INDEX idx_bookings_channel ON bookings(channel_name);
CREATE INDEX idx_bookings_status ON bookings(booking_status);
CREATE INDEX idx_bookings_dates ON bookings(check_in, check_out);
CREATE INDEX idx_bookings_guest_email ON bookings(((guest_details->>'email')::text));
CREATE INDEX idx_bookings_sync_status ON bookings(sync_status);
CREATE INDEX idx_bookings_processing ON bookings(processing_status);
CREATE INDEX idx_bookings_booked_at ON bookings(booked_at DESC);
CREATE INDEX idx_bookings_received_at ON bookings(received_at DESC);
CREATE INDEX idx_bookings_created_at ON bookings(created_at DESC);

-- Compound indexes for common queries
CREATE INDEX idx_bookings_property_dates ON bookings(property_id, check_in, check_out);
CREATE INDEX idx_bookings_property_status ON bookings(property_id, booking_status, check_in);
CREATE INDEX idx_bookings_channel_sync ON bookings(channel_name, sync_status);
CREATE INDEX idx_bookings_upcoming ON bookings(property_id, check_in) WHERE check_in > CURRENT_DATE;
CREATE INDEX idx_bookings_current ON bookings(property_id, check_in, check_out) WHERE check_in <= CURRENT_DATE AND check_out > CURRENT_DATE;

-- =====================================================
-- INVENTORY_SYNC_LOGS TABLE
-- Logs all sync operations for monitoring and debugging
-- =====================================================
CREATE TABLE inventory_sync_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    channel_name VARCHAR(50) NOT NULL CHECK (channel_name IN ('booking.com', 'oyo', 'makemytrip', 'airbnb', 'goibibo', 'trivago', 'agoda', 'expedia')),
    ota_channel_config_id UUID REFERENCES ota_channel_configs(id) ON DELETE SET NULL,
    
    -- Sync operation details
    sync_type VARCHAR(50) NOT NULL CHECK (sync_type IN ('inventory', 'rates', 'bookings', 'availability', 'full_sync')),
    sync_trigger VARCHAR(50) DEFAULT 'scheduled' CHECK (sync_trigger IN ('manual', 'scheduled', 'webhook', 'api_call', 'system_initiated')),
    sync_direction VARCHAR(50) NOT NULL CHECK (sync_direction IN ('push', 'pull', 'bidirectional')),
    
    -- Status and results
    sync_status VARCHAR(50) NOT NULL CHECK (sync_status IN ('success', 'partial_success', 'failed', 'in_progress', 'cancelled')),
    
    -- Detailed sync metrics and data
    sync_data JSONB DEFAULT '{}', -- totalRecords, successfulRecords, duration, etc.
    
    -- Error details
    error_details JSONB DEFAULT '{}', -- errors array, retry info, debug info
    
    -- API interaction details
    api_details JSONB DEFAULT '{}', -- endpoint, method, response times, etc.
    
    -- Performance metrics
    performance JSONB DEFAULT '{}', -- recordsPerSecond, responseTime, etc.
    
    -- Context and metadata
    sync_context JSONB DEFAULT '{}', -- triggeredBy, batchId, system state, etc.
    
    -- Notifications and business impact
    notifications JSONB DEFAULT '{}', -- alerts sent, escalation level
    business_impact JSONB DEFAULT '{}', -- revenue impact, bookings affected
    
    -- Compliance and auditing
    compliance JSONB DEFAULT '{"gdprCompliant": true, "dataRetentionDays": 90}',
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    archived_at TIMESTAMP
);

-- Indexes for inventory_sync_logs
CREATE INDEX idx_sync_logs_property ON inventory_sync_logs(property_id, created_at DESC);
CREATE INDEX idx_sync_logs_channel_status ON inventory_sync_logs(channel_name, sync_status);
CREATE INDEX idx_sync_logs_type_status ON inventory_sync_logs(sync_type, sync_status);
CREATE INDEX idx_sync_logs_property_channel_type ON inventory_sync_logs(property_id, channel_name, sync_type);
CREATE INDEX idx_sync_logs_created ON inventory_sync_logs(created_at DESC);
CREATE INDEX idx_sync_logs_manual_intervention ON inventory_sync_logs(((notifications->>'requiresManualIntervention')::boolean), sync_status) WHERE (notifications->>'requiresManualIntervention')::boolean = true;
CREATE INDEX idx_sync_logs_batch ON inventory_sync_logs(((sync_context->>'syncBatchId')::text)) WHERE sync_context->>'syncBatchId' IS NOT NULL;

-- TTL equivalent: Create a function to clean up old logs
CREATE OR REPLACE FUNCTION cleanup_old_sync_logs()
RETURNS void AS $$
BEGIN
    DELETE FROM inventory_sync_logs 
    WHERE created_at < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql;

-- Schedule the cleanup function (requires pg_cron extension)
-- SELECT cron.schedule('cleanup-sync-logs', '0 2 * * *', 'SELECT cleanup_old_sync_logs();');

-- =====================================================
-- ADDITIONAL TABLES FOR ENHANCED FUNCTIONALITY
-- =====================================================

-- Property amenities lookup table
CREATE TABLE property_amenities (
    property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
    amenity VARCHAR(100) NOT NULL CHECK (amenity IN ('wifi', 'parking', 'pool', 'gym', 'spa', 'restaurant', 'bar', 'conference_room', 'airport_shuttle', 'pet_friendly')),
    PRIMARY KEY (property_id, amenity)
);

-- Property images
CREATE TABLE property_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    caption TEXT,
    is_primary BOOLEAN DEFAULT FALSE,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_property_images_property ON property_images(property_id);
CREATE INDEX idx_property_images_primary ON property_images(property_id, is_primary) WHERE is_primary = true;

-- Verification documents
CREATE TABLE verification_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    document_type VARCHAR(100) NOT NULL,
    document_url TEXT NOT NULL,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    verified_at TIMESTAMP,
    verified_by VARCHAR(100)
);

-- =====================================================
-- VIEWS FOR COMMON QUERIES
-- =====================================================

-- View for property OTA summary
CREATE VIEW property_ota_summary AS
SELECT 
    p.id,
    p.name,
    p.owner_email,
    p.ota_integration_enabled,
    COUNT(occ.id) as total_channels,
    COUNT(CASE WHEN occ.enabled = true THEN 1 END) as active_channels,
    COUNT(CASE WHEN occ.sync_status = 'error' THEN 1 END) as channels_with_errors,
    MAX(occ.last_sync_at) as last_sync_at
FROM properties p
LEFT JOIN ota_channel_configs occ ON p.id = occ.property_id
GROUP BY p.id, p.name, p.owner_email, p.ota_integration_enabled;

-- View for recent bookings summary
CREATE VIEW recent_bookings_summary AS
SELECT 
    p.name as property_name,
    b.channel_name,
    COUNT(*) as booking_count,
    SUM((b.amount->>'totalAmount')::numeric) as total_revenue,
    MIN(b.booked_at) as first_booking,
    MAX(b.booked_at) as last_booking
FROM bookings b
JOIN properties p ON b.property_id = p.id
WHERE b.booked_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY p.name, b.channel_name;

-- View for sync performance metrics
CREATE VIEW sync_performance_summary AS
SELECT 
    property_id,
    channel_name,
    sync_type,
    COUNT(*) as total_syncs,
    COUNT(CASE WHEN sync_status = 'success' THEN 1 END) as successful_syncs,
    ROUND(
        COUNT(CASE WHEN sync_status = 'success' THEN 1 END)::numeric / 
        COUNT(*)::numeric * 100, 2
    ) as success_rate_percentage,
    AVG((sync_data->>'durationMs')::numeric) as avg_duration_ms
FROM inventory_sync_logs
WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY property_id, channel_name, sync_type;

-- =====================================================
-- TRIGGERS FOR UPDATED_AT TIMESTAMPS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for each table
CREATE TRIGGER update_properties_updated_at BEFORE UPDATE ON properties FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_ota_channel_configs_updated_at BEFORE UPDATE ON ota_channel_configs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON bookings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- CONSTRAINTS AND BUSINESS RULES
-- =====================================================

-- Ensure at least one room type mapping exists for enabled channels
CREATE OR REPLACE FUNCTION validate_room_mappings() 
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.enabled = true AND (NEW.room_type_mappings IS NULL OR jsonb_array_length(NEW.room_type_mappings) = 0) THEN
        RAISE EXCEPTION 'Cannot enable channel without room type mappings';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER validate_ota_channel_mappings 
    BEFORE INSERT OR UPDATE ON ota_channel_configs 
    FOR EACH ROW EXECUTE FUNCTION validate_room_mappings();

-- Ensure booking dates are logical
ALTER TABLE bookings ADD CONSTRAINT check_booking_dates 
    CHECK (check_out > check_in);

ALTER TABLE bookings ADD CONSTRAINT check_number_of_nights 
    CHECK (number_of_nights > 0);

-- =====================================================
-- SAMPLE QUERIES FOR COMMON OPERATIONS
-- =====================================================

/*
-- Find all properties with OTA integration enabled
SELECT * FROM properties WHERE ota_integration_enabled = true;

-- Get all active channels for a property
SELECT * FROM ota_channel_configs 
WHERE property_id = 'property-uuid-here' AND enabled = true;

-- Find recent bookings for a property
SELECT * FROM bookings 
WHERE property_id = 'property-uuid-here' 
AND booked_at >= CURRENT_DATE - INTERVAL '7 days'
ORDER BY booked_at DESC;

-- Get sync performance metrics
SELECT 
    channel_name,
    COUNT(*) as total_syncs,
    AVG(CASE WHEN sync_status = 'success' THEN 1.0 ELSE 0.0 END) * 100 as success_rate
FROM inventory_sync_logs 
WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY channel_name;

-- Find channels needing attention (errors or no recent sync)
SELECT occ.*, p.name as property_name
FROM ota_channel_configs occ
JOIN properties p ON occ.property_id = p.id
WHERE occ.enabled = true 
AND (
    occ.sync_status = 'error' 
    OR occ.last_sync_at < CURRENT_TIMESTAMP - INTERVAL '1 hour'
);

-- Revenue by channel for last 30 days
SELECT 
    channel_name,
    COUNT(*) as bookings,
    SUM((amount->>'totalAmount')::numeric) as total_revenue
FROM bookings 
WHERE booked_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY channel_name
ORDER BY total_revenue DESC;
*/