import { sendBookingReminderEmail } from './email'
import Booking from '@/models/Booking'
import User from '@/models/User'
import Property from '@/models/Property'
import { dbConnect } from '@/lib/db'

/**
 * Service for managing booking reminders and automated email workflows
 */
export class BookingReminderService {
  
  /**
   * Send reminder emails for bookings that are 24 hours away
   */
  static async sendCheckInReminders(): Promise<void> {
    try {
      await dbConnect()
      
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      tomorrow.setHours(0, 0, 0, 0)
      
      const dayAfterTomorrow = new Date()
      dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2)
      dayAfterTomorrow.setHours(0, 0, 0, 0)
      
      // Find all confirmed bookings with check-in tomorrow
      const upcomingBookings = await Booking.find({
        status: 'confirmed',
        dateFrom: {
          $gte: tomorrow,
          $lt: dayAfterTomorrow
        }
      })
      .populate('userId', 'name email')
      .populate('propertyId', 'title address')
      .lean()
      
      console.log(`[BookingReminderService] Found ${upcomingBookings.length} bookings with check-in tomorrow`)
      
      for (const booking of upcomingBookings) {
        try {
          if (booking.userId && typeof booking.userId === 'object' && booking.userId.email) {
            const user = booking.userId as any
            const property = booking.propertyId as any
            
            const emailSent = await sendBookingReminderEmail({
              to: user.email,
              name: user.name || 'Guest',
              booking: {
                _id: booking._id,
                dateFrom: booking.dateFrom,
                dateTo: booking.dateTo,
                guests: booking.guests
              },
              property: {
                title: property?.title || 'Your Property',
                city: property?.city || 'Unknown'
              }
            })
            
            if (emailSent) {
              console.log(`[BookingReminderService] ✅ Reminder sent for booking ${booking._id}`)
            } else {
              console.log(`[BookingReminderService] ❌ Failed to send reminder for booking ${booking._id}`)
            }
            
            // Add a small delay to avoid overwhelming the email service
            await new Promise(resolve => setTimeout(resolve, 1000))
          }
        } catch (error) {
          console.error(`[BookingReminderService] Error sending reminder for booking ${booking._id}:`, error)
        }
      }
    } catch (error) {
      console.error('[BookingReminderService] Error in sendCheckInReminders:', error)
    }
  }
  
  /**
   * Send follow-up emails after checkout
   */
  static async sendCheckOutFollowUps(): Promise<void> {
    try {
      await dbConnect()
      
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      yesterday.setHours(0, 0, 0, 0)
      
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      // Find all bookings that checked out yesterday
      const recentCheckouts = await Booking.find({
        status: 'confirmed',
        dateTo: {
          $gte: yesterday,
          $lt: today
        }
      })
      .populate('userId', 'name email')
      .populate('propertyId', 'title address')
      .lean()
      
      console.log(`[BookingReminderService] Found ${recentCheckouts.length} recent checkouts`)
      
      for (const booking of recentCheckouts) {
        try {
          if (booking.userId && typeof booking.userId === 'object' && booking.userId.email) {
            const user = booking.userId as any
            const property = booking.propertyId as any
            
            // Mark booking as completed
            await Booking.findByIdAndUpdate(booking._id, { 
              status: 'completed',
              completedAt: new Date()
            })
            
            // Send thank you and review request email
            const emailSent = await this.sendThankYouEmail({
              to: user.email,
              name: user.name || 'Guest',
              booking: {
                _id: booking._id,
                dateFrom: booking.dateFrom,
                dateTo: booking.dateTo
              },
              property: {
                title: property?.title || 'Your Property',
                city: property?.city || 'Unknown'
              }
            })
            
            if (emailSent) {
              console.log(`[BookingReminderService] ✅ Thank you email sent for booking ${booking._id}`)
            }
            
            await new Promise(resolve => setTimeout(resolve, 1000))
          }
        } catch (error) {
          console.error(`[BookingReminderService] Error sending follow-up for booking ${booking._id}:`, error)
        }
      }
    } catch (error) {
      console.error('[BookingReminderService] Error in sendCheckOutFollowUps:', error)
    }
  }
  
  /**
   * Send thank you email after checkout
   */
  private static async sendThankYouEmail({
    to,
    name,
    booking,
    property
  }: {
    to: string
    name: string
    booking: any
    property: any
  }): Promise<boolean> {
    try {
      const subject = `🙏 Thank you for staying with us! | Baithaka Ghar`
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Thank You</title>
            <style>
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body { 
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
                    line-height: 1.6; 
                    color: #333; 
                    background-color: #f8f9fa;
                }
                .container { 
                    max-width: 600px; 
                    margin: 0 auto; 
                    background: white; 
                    border-radius: 12px; 
                    overflow: hidden;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
                }
                .header { 
                    background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%); 
                    color: white; 
                    padding: 40px 30px; 
                    text-align: center; 
                }
                .content { padding: 30px; }
                .review-card { 
                    background: #f8f9fa; 
                    border: 2px solid #4CAF50; 
                    border-radius: 12px; 
                    padding: 25px; 
                    margin: 25px 0;
                    text-align: center;
                }
                .btn { 
                    display: inline-block; 
                    padding: 15px 30px; 
                    background: #4CAF50; 
                    color: white; 
                    text-decoration: none; 
                    border-radius: 8px; 
                    font-weight: bold; 
                    margin: 10px;
                }
                .footer { 
                    background: #2c3e50; 
                    color: white; 
                    padding: 30px; 
                    text-align: center;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <div style="font-size: 48px; margin-bottom: 10px;">🙏</div>
                    <h1>Thank You for Staying with Us!</h1>
                    <p>We hope you had a wonderful experience</p>
                </div>
                
                <div class="content">
                    <p style="font-size: 18px; margin-bottom: 20px;">Hello <strong>${name}</strong>,</p>
                    
                    <p style="margin-bottom: 20px;">
                        Thank you for choosing Baithaka Ghar for your stay at <strong>${property.title}</strong>. 
                        We hope you had a memorable and comfortable experience with us.
                    </p>
                    
                    <div class="review-card">
                        <h2 style="margin-bottom: 15px; color: #4CAF50;">⭐ Share Your Experience</h2>
                        <p style="margin-bottom: 20px;">
                            Your feedback helps us improve and helps other travelers make informed decisions. 
                            Would you like to share a review of your stay?
                        </p>
                        <a href="${process.env.NEXTAUTH_URL || 'https://yourdomain.com'}/reviews/write?booking=${booking._id}" class="btn">
                            Write a Review
                        </a>
                    </div>
                    
                    <div style="background: #e7f3ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <h3 style="margin-bottom: 10px; color: #0056b3;">🎁 Special Offer</h3>
                        <p style="color: #0056b3; margin-bottom: 10px;">
                            As a valued guest, enjoy <strong>10% off</strong> your next booking with us!
                        </p>
                        <p style="color: #0056b3; font-size: 14px;">
                            Use code: <strong>WELCOME10</strong> (Valid for 30 days)
                        </p>
                    </div>
                    
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${process.env.NEXTAUTH_URL || 'https://yourdomain.com'}" class="btn">
                            Book Your Next Stay
                        </a>
                    </div>
                    
                    <p style="text-align: center; color: #666;">
                        Questions about your stay? Contact us at 📞 +91 8800 123 456
                    </p>
                </div>
                
                <div class="footer">
                    <p style="margin-bottom: 15px;">Thank you for being our valued guest!</p>
                    <p style="font-size: 12px; opacity: 0.8;">
                        © ${new Date().getFullYear()} Baithaka Ghar. All rights reserved.
                    </p>
                </div>
            </div>
        </body>
        </html>
      `
      
      // Since we're using the existing email service, we'll use sendEmail directly
      const { sendEmail } = await import('./email')
      return await sendEmail({
        to,
        subject,
        html
      })
    } catch (error) {
      console.error('Failed to send thank you email:', error)
      return false
    }
  }
  
  /**
   * Initialize reminder system (to be called from a cron job or scheduled task)
   */
  static async initializeReminderSystem(): Promise<void> {
    console.log('[BookingReminderService] Starting reminder system...')
    
    try {
      // Send check-in reminders
      await this.sendCheckInReminders()
      
      // Send checkout follow-ups
      await this.sendCheckOutFollowUps()
      
      console.log('[BookingReminderService] Reminder system completed successfully')
    } catch (error) {
      console.error('[BookingReminderService] Error in reminder system:', error)
    }
  }
}

// Export individual functions for API routes
export const {
  sendCheckInReminders,
  sendCheckOutFollowUps,
  initializeReminderSystem
} = BookingReminderService 