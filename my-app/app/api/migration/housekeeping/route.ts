import { NextRequest, NextResponse } from 'next/server';
import { HousekeepingScheduleSetup } from '@/scripts/setup/housekeeping-schedule-setup';

export async function POST(request: NextRequest) {
  try {
    const { action } = await request.json();
    const setup = new HousekeepingScheduleSetup();
    await setup.initialize();

    switch (action) {
      case 'setup':
        const result = await setup.setupInitialSchedules();
        await setup.createRecurringScheduleRules();
        await setup.generateSupplyRequirements();

        return NextResponse.json({
          success: true,
          data: result
        });

      case 'validate':
        const validation = await setup.validateSetup();
        return NextResponse.json({
          success: true,
          data: validation
        });

      case 'create_rules':
        await setup.createRecurringScheduleRules();
        return NextResponse.json({
          success: true,
          message: 'Recurring schedule rules created successfully'
        });

      case 'generate_supplies':
        await setup.generateSupplyRequirements();
        return NextResponse.json({
          success: true,
          message: 'Supply requirements generated successfully'
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: setup, validate, create_rules, or generate_supplies' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Housekeeping setup API error:', error);
    return NextResponse.json(
      { error: 'Housekeeping setup failed', details: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const setup = new HousekeepingScheduleSetup();
    await setup.initialize();

    const validation = await setup.validateSetup();

    return NextResponse.json({
      success: true,
      data: validation
    });
  } catch (error) {
    console.error('Housekeeping setup status error:', error);
    return NextResponse.json(
      { error: 'Failed to get setup status' },
      { status: 500 }
    );
  }
}