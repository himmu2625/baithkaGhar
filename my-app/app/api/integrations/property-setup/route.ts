import { NextRequest, NextResponse } from 'next/server';
import { PropertyManagementIntegration } from '@/lib/integrations/property-management-integration';
import { ObjectId } from 'mongodb';

export async function POST(request: NextRequest) {
  try {
    const { action, propertyData, propertyId } = await request.json();

    const integration = new PropertyManagementIntegration();
    await integration.initialize();

    switch (action) {
      case 'setup_property':
        if (!propertyData) {
          return NextResponse.json(
            { error: 'Property data is required' },
            { status: 400 }
          );
        }

        const setupResult = await integration.setupPropertyConfiguration(propertyData);
        return NextResponse.json({
          success: true,
          data: setupResult
        });

      case 'setup_staff':
        if (!propertyId) {
          return NextResponse.json(
            { error: 'Property ID is required' },
            { status: 400 }
          );
        }

        const staffConfig = await integration.getDefaultStaffConfiguration();
        const staffResult = await integration.setupStaffStructure(new ObjectId(propertyId), staffConfig);
        return NextResponse.json({
          success: true,
          data: staffResult
        });

      case 'create_rooms':
        if (!propertyId) {
          return NextResponse.json(
            { error: 'Property ID is required' },
            { status: 400 }
          );
        }

        const roomsCreated = await integration.createDefaultRooms(new ObjectId(propertyId));
        return NextResponse.json({
          success: true,
          data: { roomsCreated }
        });

      case 'validate_setup':
        if (!propertyId) {
          return NextResponse.json(
            { error: 'Property ID is required' },
            { status: 400 }
          );
        }

        const validation = await integration.validatePropertySetup(new ObjectId(propertyId));
        return NextResponse.json({
          success: true,
          data: validation
        });

      case 'complete_setup':
        if (!propertyData) {
          return NextResponse.json(
            { error: 'Property data is required for complete setup' },
            { status: 400 }
          );
        }

        // Complete property setup
        const propertySetup = await integration.setupPropertyConfiguration(propertyData);

        // Setup staff structure
        const defaultStaffConfig = await integration.getDefaultStaffConfiguration();
        const staffSetup = await integration.setupStaffStructure(propertySetup.propertyId, defaultStaffConfig);

        // Create rooms
        const totalRoomsCreated = await integration.createDefaultRooms(propertySetup.propertyId);

        // Validate
        const finalValidation = await integration.validatePropertySetup(propertySetup.propertyId);

        return NextResponse.json({
          success: true,
          data: {
            propertySetup,
            staffSetup,
            roomsCreated: totalRoomsCreated,
            validation: finalValidation
          }
        });

      case 'get_default_config':
        const defaultConfig = await integration.getDefaultStaffConfiguration();
        return NextResponse.json({
          success: true,
          data: {
            staffConfiguration: defaultConfig,
            samplePropertyData: {
              name: 'Sample Hotel',
              type: 'hotel',
              address: {
                street: '123 Hotel Street',
                city: 'Sample City',
                state: 'Sample State',
                zipCode: '12345',
                country: 'USA'
              },
              contact: {
                phone: '+1-555-0123',
                email: 'info@samplehotel.com',
                website: 'https://samplehotel.com',
                manager: 'John Doe'
              },
              settings: {
                timezone: 'America/New_York',
                currency: 'USD',
                language: 'en',
                checkInTime: '15:00',
                checkOutTime: '11:00',
                maxAdvanceBooking: 365,
                minAdvanceBooking: 2
              },
              facilities: [
                {
                  name: 'Swimming Pool',
                  type: 'recreation',
                  description: 'Outdoor swimming pool with poolside service',
                  isActive: true,
                  operatingHours: { open: '06:00', close: '22:00' }
                },
                {
                  name: 'Fitness Center',
                  type: 'wellness',
                  description: '24-hour fitness center with modern equipment',
                  isActive: true
                },
                {
                  name: 'Restaurant',
                  type: 'dining',
                  description: 'Full-service restaurant serving international cuisine',
                  isActive: true,
                  operatingHours: { open: '06:00', close: '23:00' }
                },
                {
                  name: 'Business Center',
                  type: 'business',
                  description: 'Business center with printing and internet facilities',
                  isActive: true,
                  operatingHours: { open: '24:00', close: '24:00' }
                },
                {
                  name: 'Conference Room',
                  type: 'events',
                  description: 'Meeting room for up to 50 people',
                  isActive: true
                }
              ],
              policies: {
                cancellation: 'Free cancellation up to 24 hours before arrival',
                noShow: 'One night charge for no-show reservations',
                children: 'Children under 12 stay free with parents',
                pets: 'Pets not allowed',
                smoking: 'Non-smoking property',
                payment: ['Credit Card', 'Debit Card', 'Cash', 'Bank Transfer']
              },
              licensing: {
                businessLicense: 'BL-2024-001',
                hotelLicense: 'HL-2024-001',
                taxId: 'TAX-123456789',
                permits: [
                  { type: 'Fire Safety', number: 'FS-2024-001', expiry: new Date('2025-12-31') },
                  { type: 'Health Department', number: 'HD-2024-001', expiry: new Date('2025-06-30') }
                ]
              }
            }
          }
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: setup_property, setup_staff, create_rooms, validate_setup, complete_setup, or get_default_config' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Property setup API error:', error);
    return NextResponse.json(
      { error: 'Property setup failed', details: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get('propertyId');

    if (!propertyId) {
      return NextResponse.json(
        { error: 'Property ID is required' },
        { status: 400 }
      );
    }

    const integration = new PropertyManagementIntegration();
    await integration.initialize();

    const validation = await integration.validatePropertySetup(new ObjectId(propertyId));

    return NextResponse.json({
      success: true,
      data: validation
    });
  } catch (error) {
    console.error('Property setup status error:', error);
    return NextResponse.json(
      { error: 'Failed to get property setup status' },
      { status: 500 }
    );
  }
}