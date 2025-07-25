import { NextRequest, NextResponse } from 'next/server';
import getServerSession from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/db/dbConnect';
import Coupon from '@/models/Coupon';
import SpecialOffer from '@/models/SpecialOffer';
import Promotion from '@/models/Promotion';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions) as any;
    
    if (!session?.user || !['admin', 'super_admin'].includes(session.user.role)) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await dbConnect();

    const { migrationType } = await request.json();
    
    let migratedCount = 0;
    let errors: string[] = [];

    // Migrate Coupons
    if (migrationType === 'all' || migrationType === 'coupons') {
      try {
        const coupons = await Coupon.find({});
        
        for (const coupon of coupons) {
          try {
            // Check if already migrated
            const existingPromotion = await Promotion.findOne({
              migratedFrom: 'coupon',
              originalId: coupon._id.toString()
            });

            if (existingPromotion) {
              continue; // Skip if already migrated
            }

            const promotionData = {
              name: coupon.name,
              description: coupon.description,
              type: 'coupon',
              discountType: coupon.type,
              discountValue: coupon.value,
              maxDiscountAmount: coupon.maxDiscountAmount,
              
              conditions: {
                validFrom: coupon.validFrom,
                validTo: coupon.validTo,
                minBookingAmount: coupon.minOrderAmount,
                usageLimit: coupon.usageLimit,
                usageLimitPerCustomer: coupon.userUsageLimit,
                userUsageLimit: coupon.userUsageLimit,
                requiresCouponCode: true,
                applicableFor: coupon.applicableFor,
                applicableProperties: coupon.applicableProperties?.map((id: any) => id.toString()),
                applicableUsers: coupon.applicableUsers,
                excludeProperties: coupon.excludedProperties?.map((id: any) => id.toString()),
                excludedUsers: coupon.excludedUsers,
              },
              
              displaySettings: {
                title: coupon.name,
                subtitle: coupon.description,
                badgeText: 'Coupon Code',
                showInSearch: false,
                showOnPropertyPage: false,
                showAtCheckout: true,
                priority: 5
              },
              
              analytics: {
                usageCount: coupon.usageCount,
                totalDiscountGiven: 0,
                revenue: 0,
                bookingsGenerated: 0,
                conversionRate: 0,
                avgBookingValue: 0
              },
              
              createdBy: coupon.createdBy,
              isActive: coupon.isActive,
              status: coupon.isActive ? 'active' : 'paused',
              couponCode: coupon.code,
              couponCodeType: 'fixed',
              
              // Migration tracking
              migratedFrom: 'coupon',
              originalId: coupon._id.toString(),
              
              automation: {
                autoActivate: false,
                autoDeactivate: false
              }
            };

            await Promotion.create(promotionData);
            migratedCount++;
            
          } catch (error) {
            console.error(`Error migrating coupon ${coupon.code}:`, error);
            errors.push(`Failed to migrate coupon ${coupon.code}: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
        }
      } catch (error) {
        console.error('Error migrating coupons:', error);
        errors.push(`Error migrating coupons: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    // Migrate Special Offers
    if (migrationType === 'all' || migrationType === 'special_offers') {
      try {
        const specialOffers = await SpecialOffer.find({});
        
        for (const offer of specialOffers) {
          try {
            // Check if already migrated
            const existingPromotion = await Promotion.findOne({
              migratedFrom: 'special_offer',
              originalId: offer._id.toString()
            });

            if (existingPromotion) {
              continue; // Skip if already migrated
            }

            const promotionData = {
              name: offer.title,
              description: offer.description,
              type: 'special_offer',
              discountType: 'percentage', // Default, can be updated manually
              discountValue: 10, // Default 10%, can be updated manually
              
              conditions: {
                validFrom: new Date(),
                validTo: offer.validUntil,
                requiresCouponCode: false,
                applicableFor: 'specific_properties',
              },
              
              displaySettings: {
                title: offer.title,
                subtitle: offer.subtitle,
                badgeText: offer.label || 'Special Offer',
                tag: offer.tag,
                imageUrl: offer.imageUrl,
                publicId: offer.publicId,
                showInSearch: true,
                showOnPropertyPage: true,
                showAtCheckout: false,
                priority: 7
              },
              
              targetProperties: offer.targetProperties,
              
              analytics: {
                usageCount: 0,
                totalDiscountGiven: 0,
                revenue: 0,
                bookingsGenerated: 0,
                conversionRate: 0,
                avgBookingValue: 0
              },
              
              createdBy: session.user.id, // Use current admin as creator
              isActive: offer.isActive,
              status: offer.isActive ? 'active' : 'paused',
              
              // Migration tracking
              migratedFrom: 'special_offer',
              originalId: offer._id.toString(),
              
              automation: {
                autoActivate: false,
                autoDeactivate: false
              }
            };

            await Promotion.create(promotionData);
            migratedCount++;
            
          } catch (error) {
            console.error(`Error migrating special offer ${offer.title}:`, error);
            errors.push(`Failed to migrate special offer ${offer.title}: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
        }
      } catch (error) {
        console.error('Error migrating special offers:', error);
        errors.push(`Error migrating special offers: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Migration completed. ${migratedCount} items migrated successfully.`,
      migratedCount,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error) {
    console.error('Migration error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Migration failed' 
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions) as any;
    
    if (!session?.user || !['admin', 'super_admin'].includes(session.user.role)) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await dbConnect();

    // Get migration status
    const couponCount = await Coupon.countDocuments({});
    const specialOfferCount = await SpecialOffer.countDocuments({});
    const migratedCoupons = await Promotion.countDocuments({ migratedFrom: 'coupon' });
    const migratedSpecialOffers = await Promotion.countDocuments({ migratedFrom: 'special_offer' });

    return NextResponse.json({
      success: true,
      status: {
        coupons: {
          total: couponCount,
          migrated: migratedCoupons,
          remaining: couponCount - migratedCoupons
        },
        specialOffers: {
          total: specialOfferCount,
          migrated: migratedSpecialOffers,
          remaining: specialOfferCount - migratedSpecialOffers
        }
      }
    });

  } catch (error) {
    console.error('Migration status error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to get migration status' 
      },
      { status: 500 }
    );
  }
} 