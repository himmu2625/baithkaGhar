import { NextRequest, NextResponse } from 'next/server';
import { RoomDataMigration } from '@/scripts/database/migrations/room-data-migration';

export async function POST(request: NextRequest) {
  try {
    const { action } = await request.json();
    const migration = new RoomDataMigration();
    await migration.initialize();

    switch (action) {
      case 'migrate':
        const result = await migration.migrateAllRooms();
        return NextResponse.json({
          success: true,
          data: result
        });

      case 'validate':
        const validation = await migration.validateMigration();
        return NextResponse.json({
          success: true,
          data: validation
        });

      case 'rollback':
        await migration.rollbackMigration();
        return NextResponse.json({
          success: true,
          message: 'Migration rolled back successfully'
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: migrate, validate, or rollback' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Migration API error:', error);
    return NextResponse.json(
      { error: 'Migration failed', details: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const migration = new RoomDataMigration();
    await migration.initialize();

    const validation = await migration.validateMigration();

    return NextResponse.json({
      success: true,
      data: validation
    });
  } catch (error) {
    console.error('Migration status error:', error);
    return NextResponse.json(
      { error: 'Failed to get migration status' },
      { status: 500 }
    );
  }
}