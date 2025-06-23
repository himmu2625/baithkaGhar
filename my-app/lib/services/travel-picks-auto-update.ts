import dbConnect from '@/lib/db/dbConnect';
import TravelPick from '@/models/TravelPick';
import Property from '@/models/Property';
import Booking from '@/models/Booking';

interface UpdateTrigger {
  type: 'booking' | 'review' | 'rating' | 'manual';
  propertyId?: string;
  bookingId?: string;
}

export class TravelPicksAutoUpdater {
  private static isUpdating = false;
  private static lastUpdateTime = 0;
  private static readonly UPDATE_COOLDOWN = 5 * 60 * 1000; // 5 minutes cooldown

  /**
   * Main method to trigger travel picks update
   */
  static async triggerUpdate(trigger: UpdateTrigger): Promise<boolean> {
    try {
      // Prevent concurrent updates and rate limiting
      if (this.isUpdating) {
        console.log('Travel picks update already in progress, skipping...');
        return false;
      }

      const now = Date.now();
      if (now - this.lastUpdateTime < this.UPDATE_COOLDOWN && trigger.type !== 'manual') {
        console.log('Travel picks update cooldown active, skipping...');
        return false;
      }

      this.isUpdating = true;
      this.lastUpdateTime = now;

      console.log(`🔄 Updating travel picks triggered by: ${trigger.type}`);
      
      await dbConnect();
      const success = await this.calculateAndUpdateTravelPicks();
      
      if (success) {
        console.log('✅ Travel picks updated successfully');
      } else {
        console.log('❌ Travel picks update failed');
      }

      return success;

    } catch (error) {
      console.error('Error in travel picks auto-update:', error);
      return false;
    } finally {
      this.isUpdating = false;
    }
  }

  /**
   * Calculate and update travel picks based on current data
   */
  private static async calculateAndUpdateTravelPicks(): Promise<boolean> {
    try {
      // Get all published and available properties (including pending verification)
      const properties = await Property.find({
        isPublished: true,
        isAvailable: true
        // Removed verificationStatus filter to include all your properties
      }).lean();

      if (properties.length === 0) {
        console.log('No eligible properties found for travel picks');
        return false;
      }

      const propertyScores = [];

      for (const property of properties) {
        const score = await this.calculatePropertyScore(property);
        // Include all properties regardless of score (minimum scoring ensures no 0 scores)
        propertyScores.push({
          propertyId: property._id,
          score: score.totalScore,
          metrics: score.metrics
        });
      }

      // Sort by score and take top 5
      propertyScores.sort((a, b) => b.score - a.score);
      const top5Properties = propertyScores.slice(0, 5);

      if (top5Properties.length === 0) {
        console.log('No properties with valid scores found');
        return false;
      }

      // Check if the ranking has actually changed
      const currentPicks = await TravelPick.find({ isActive: true })
        .sort({ rank: 1 })
        .select('propertyId score')
        .lean();

      const hasChanged = this.hasRankingChanged(currentPicks, top5Properties);
      
      if (!hasChanged) {
        console.log('Travel picks ranking unchanged, skipping update');
        return true;
      }

      // Clear existing travel picks
      await TravelPick.updateMany({}, { isActive: false });

      // Create new travel picks
      const newTravelPicks = top5Properties.map((prop, index) => ({
        propertyId: prop.propertyId,
        rank: index + 1,
        score: prop.score,
        metrics: prop.metrics,
        isActive: true
      }));

      await TravelPick.insertMany(newTravelPicks);

      console.log(`🏆 Updated travel picks: ${newTravelPicks.length} properties ranked`);
      return true;

    } catch (error) {
      console.error('Error calculating travel picks:', error);
      return false;
    }
  }

  /**
   * Calculate score for a single property
   */
  private static async calculatePropertyScore(property: any) {
    try {
      // Get booking metrics for the last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const recentBookings = await Booking.countDocuments({
        propertyId: property._id,
        status: { $in: ['confirmed', 'completed'] },
        createdAt: { $gte: thirtyDaysAgo }
      });

      const totalBookings = await Booking.countDocuments({
        propertyId: property._id,
        status: { $in: ['confirmed', 'completed'] }
      });

      // Calculate revenue from bookings
      const bookingRevenue = await Booking.aggregate([
        {
          $match: {
            propertyId: property._id,
            status: { $in: ['confirmed', 'completed'] },
            totalPrice: { $exists: true }
          }
        },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: '$totalPrice' }
          }
        }
      ]);

      const revenue = bookingRevenue.length > 0 ? bookingRevenue[0].totalRevenue : 0;

      // Calculate occupancy rate (simplified)
      const daysActive = Math.max(1, Math.floor((new Date().getTime() - property.createdAt) / (1000 * 60 * 60 * 24)));
      const occupancyRate = Math.min(totalBookings / (daysActive / 30), 1);

      // Calculate score based on multiple factors with weights
      const weights = {
        rating: 0.25,      // 25% weight
        reviews: 0.15,     // 15% weight  
        bookings: 0.30,    // 30% weight
        recent: 0.20,      // 20% weight
        revenue: 0.10      // 10% weight
      };

      const ratingScore = (property.rating || 4.5) * 20; // Default 4.5 rating if none
      const reviewScore = Math.min((property.reviewCount || 10) * 2, 100); // Default 10 reviews if none
      const bookingScore = Math.min((totalBookings || 3) * 10, 100); // Minimum 3 bookings worth of points
      const recentBookingScore = Math.min((recentBookings || 1) * 20, 100); // Minimum 1 recent booking worth
      const revenueScore = Math.min((revenue || 5000) / 1000, 100); // Default revenue if none

      const totalScore = 
        (ratingScore * weights.rating) +
        (reviewScore * weights.reviews) +
        (bookingScore * weights.bookings) +
        (recentBookingScore * weights.recent) +
        (revenueScore * weights.revenue);

      return {
        totalScore,
        metrics: {
          rating: property.rating || 0,
          reviewCount: property.reviewCount || 0,
          bookingCount: totalBookings,
          recentBookings,
          revenue,
          occupancyRate
        }
      };

    } catch (error) {
      console.error('Error calculating property score:', error);
      return { totalScore: 0, metrics: {} };
    }
  }

  /**
   * Check if the ranking has changed significantly
   */
  private static hasRankingChanged(currentPicks: any[], newPicks: any[]): boolean {
    if (currentPicks.length !== newPicks.length) {
      return true;
    }

    for (let i = 0; i < currentPicks.length; i++) {
      const current = currentPicks[i];
      const newPick = newPicks[i];
      
      // Check if property changed position or score changed significantly
      if (current.propertyId.toString() !== newPick.propertyId.toString() ||
          Math.abs(current.score - newPick.score) > 5) {
        return true;
      }
    }

    return false;
  }

  /**
   * Manual trigger for admin updates
   */
  static async manualUpdate(): Promise<boolean> {
    return this.triggerUpdate({ type: 'manual' });
  }

  /**
   * Trigger when a new booking is created
   */
  static async onBookingCreated(bookingId: string, propertyId: string): Promise<void> {
    // Run in background, don't wait
    this.triggerUpdate({ 
      type: 'booking', 
      bookingId, 
      propertyId 
    }).catch(error => {
      console.error('Background travel picks update failed:', error);
    });
  }

  /**
   * Trigger when a review is added or rating is updated
   */
  static async onReviewOrRatingUpdate(propertyId: string): Promise<void> {
    // Run in background, don't wait
    this.triggerUpdate({ 
      type: 'review', 
      propertyId 
    }).catch(error => {
      console.error('Background travel picks update failed:', error);
    });
  }
}

export default TravelPicksAutoUpdater; 