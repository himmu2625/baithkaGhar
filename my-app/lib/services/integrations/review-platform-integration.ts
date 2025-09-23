import axios from 'axios'

export interface ReviewCredentials {
  apiKey?: string
  accessToken?: string
  businessId?: string
  locationId?: string
  placeId?: string
  hotelId?: string
  domain?: string
}

export interface Review {
  id: string
  platform: 'tripadvisor' | 'google_reviews' | 'yelp' | 'facebook' | 'trustpilot'
  authorName: string
  authorAvatar?: string
  rating: number
  maxRating: number
  title?: string
  content: string
  reviewDate: Date
  responseDate?: Date
  responseContent?: string
  language?: string
  verified?: boolean
  helpful?: number
  propertyId?: string
  reservationId?: string
}

export interface ReviewResponse {
  reviewId: string
  content: string
  responseDate: Date
  authorName?: string
}

export interface ReviewSummary {
  platform: string
  totalReviews: number
  averageRating: number
  ratingDistribution: { [rating: number]: number }
  latestReviews: Review[]
  responseRate: number
  averageResponseTime?: number
}

export interface ReviewMonitoringResult {
  success: boolean
  reviewsFetched?: number
  responsesPosted?: number
  alertsTriggered?: number
  errors?: string[]
}

export class ReviewPlatformIntegration {
  static async fetchTripAdvisorReviews(
    credentials: ReviewCredentials,
    propertyId: string,
    since?: Date
  ): Promise<{ reviews: Review[]; success: boolean; errors?: string[] }> {
    try {
      const sinceParam = since ? `&since=${since.toISOString().split('T')[0]}` : ''
      const response = await axios.get(
        `https://api.tripadvisor.com/api/partner/2.0/location/${credentials.locationId}/reviews?key=${credentials.apiKey}&limit=100${sinceParam}`,
        {
          headers: {
            'Accept': 'application/json',
            'X-TripAdvisor-API-Key': credentials.apiKey
          },
          timeout: 30000
        }
      )

      const reviews: Review[] = response.data.data?.map((review: any) => ({
        id: review.id,
        platform: 'tripadvisor' as const,
        authorName: review.user?.username || 'Anonymous',
        authorAvatar: review.user?.avatar?.large,
        rating: review.rating,
        maxRating: 5,
        title: review.title,
        content: review.text,
        reviewDate: new Date(review.published_date),
        responseDate: review.management_response?.published_date ? new Date(review.management_response.published_date) : undefined,
        responseContent: review.management_response?.text,
        language: review.language,
        verified: review.trip_type === 'Business' || review.trip_type === 'Leisure',
        helpful: review.helpful_votes,
        propertyId
      })) || []

      return { reviews, success: true }
    } catch (error) {
      return {
        reviews: [],
        success: false,
        errors: [`TripAdvisor fetch failed: ${error instanceof Error ? error.message : 'Unknown error'}`]
      }
    }
  }

  static async fetchGoogleReviews(
    credentials: ReviewCredentials,
    propertyId: string
  ): Promise<{ reviews: Review[]; success: boolean; errors?: string[] }> {
    try {
      const response = await axios.get(
        `https://maps.googleapis.com/maps/api/place/details/json?place_id=${credentials.placeId}&fields=reviews&key=${credentials.apiKey}`,
        { timeout: 30000 }
      )

      if (response.data.status !== 'OK') {
        return {
          reviews: [],
          success: false,
          errors: [`Google Places API error: ${response.data.status}`]
        }
      }

      const reviews: Review[] = response.data.result?.reviews?.map((review: any) => ({
        id: `google_${review.time}`,
        platform: 'google_reviews' as const,
        authorName: review.author_name,
        authorAvatar: review.profile_photo_url,
        rating: review.rating,
        maxRating: 5,
        content: review.text,
        reviewDate: new Date(review.time * 1000),
        language: review.language,
        propertyId
      })) || []

      return { reviews, success: true }
    } catch (error) {
      return {
        reviews: [],
        success: false,
        errors: [`Google Reviews fetch failed: ${error instanceof Error ? error.message : 'Unknown error'}`]
      }
    }
  }

  static async fetchYelpReviews(
    credentials: ReviewCredentials,
    propertyId: string
  ): Promise<{ reviews: Review[]; success: boolean; errors?: string[] }> {
    try {
      const response = await axios.get(
        `https://api.yelp.com/v3/businesses/${credentials.businessId}/reviews`,
        {
          headers: {
            'Authorization': `Bearer ${credentials.apiKey}`,
            'Accept': 'application/json'
          },
          timeout: 30000
        }
      )

      const reviews: Review[] = response.data.reviews?.map((review: any) => ({
        id: review.id,
        platform: 'yelp' as const,
        authorName: review.user?.name || 'Anonymous',
        authorAvatar: review.user?.image_url,
        rating: review.rating,
        maxRating: 5,
        content: review.text,
        reviewDate: new Date(review.time_created),
        propertyId
      })) || []

      return { reviews, success: true }
    } catch (error) {
      return {
        reviews: [],
        success: false,
        errors: [`Yelp fetch failed: ${error instanceof Error ? error.message : 'Unknown error'}`]
      }
    }
  }

  static async fetchFacebookReviews(
    credentials: ReviewCredentials,
    propertyId: string
  ): Promise<{ reviews: Review[]; success: boolean; errors?: string[] }> {
    try {
      const response = await axios.get(
        `https://graph.facebook.com/v18.0/${credentials.businessId}/ratings?access_token=${credentials.accessToken}&fields=reviewer,rating,review_text,created_time,recommendation_type`,
        { timeout: 30000 }
      )

      const reviews: Review[] = response.data.data?.map((review: any) => ({
        id: review.id || `fb_${review.created_time}`,
        platform: 'facebook' as const,
        authorName: review.reviewer?.name || 'Anonymous',
        rating: review.rating || (review.recommendation_type === 'positive' ? 5 : 1),
        maxRating: 5,
        content: review.review_text || 'No text provided',
        reviewDate: new Date(review.created_time),
        propertyId
      })) || []

      return { reviews, success: true }
    } catch (error) {
      return {
        reviews: [],
        success: false,
        errors: [`Facebook fetch failed: ${error instanceof Error ? error.message : 'Unknown error'}`]
      }
    }
  }

  static async fetchTrustpilotReviews(
    credentials: ReviewCredentials,
    propertyId: string
  ): Promise<{ reviews: Review[]; success: boolean; errors?: string[] }> {
    try {
      const response = await axios.get(
        `https://api.trustpilot.com/v1/business-units/${credentials.businessId}/reviews?apikey=${credentials.apiKey}`,
        {
          headers: { 'Accept': 'application/json' },
          timeout: 30000
        }
      )

      const reviews: Review[] = response.data.reviews?.map((review: any) => ({
        id: review.id,
        platform: 'trustpilot' as const,
        authorName: review.consumer?.displayName || 'Anonymous',
        rating: review.stars,
        maxRating: 5,
        title: review.title,
        content: review.text,
        reviewDate: new Date(review.createdAt),
        language: review.language,
        verified: review.consumer?.hasBeenVerified,
        propertyId
      })) || []

      return { reviews, success: true }
    } catch (error) {
      return {
        reviews: [],
        success: false,
        errors: [`Trustpilot fetch failed: ${error instanceof Error ? error.message : 'Unknown error'}`]
      }
    }
  }

  static async postTripAdvisorResponse(
    credentials: ReviewCredentials,
    reviewId: string,
    responseContent: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      await axios.post(
        `https://api.tripadvisor.com/api/partner/2.0/location/${credentials.locationId}/review/${reviewId}/response`,
        {
          text: responseContent,
          language: 'en'
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'X-TripAdvisor-API-Key': credentials.apiKey
          }
        }
      )

      return { success: true }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Response posting failed'
      }
    }
  }

  static async postGoogleResponse(
    credentials: ReviewCredentials,
    reviewId: string,
    responseContent: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      await axios.post(
        `https://mybusiness.googleapis.com/v4/accounts/${credentials.businessId}/locations/${credentials.locationId}/reviews/${reviewId}/reply`,
        { comment: responseContent },
        {
          headers: {
            'Authorization': `Bearer ${credentials.accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      )

      return { success: true }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Response posting failed'
      }
    }
  }

  static async generateAutoResponse(
    review: Review,
    templates: {
      positive: string
      negative: string
      neutral: string
    },
    propertyName: string
  ): Promise<string> {
    const guestName = review.authorName !== 'Anonymous' ? review.authorName.split(' ')[0] : 'Guest'
    let template: string

    if (review.rating >= 4) {
      template = templates.positive
    } else if (review.rating <= 2) {
      template = templates.negative
    } else {
      template = templates.neutral
    }

    return template
      .replace('{guestName}', guestName)
      .replace('{propertyName}', propertyName)
      .replace('{rating}', review.rating.toString())
      .replace('{platform}', this.getPlatformDisplayName(review.platform))
  }

  static async analyzeReviewSentiment(
    reviews: Review[]
  ): Promise<{
    sentiment: 'positive' | 'negative' | 'mixed'
    score: number
    keyTopics: string[]
    actionableInsights: string[]
  }> {
    const totalReviews = reviews.length
    const positiveReviews = reviews.filter(r => r.rating >= 4).length
    const negativeReviews = reviews.filter(r => r.rating <= 2).length

    const positiveRatio = positiveReviews / totalReviews
    const negativeRatio = negativeReviews / totalReviews

    let sentiment: 'positive' | 'negative' | 'mixed'
    let score: number

    if (positiveRatio > 0.7) {
      sentiment = 'positive'
      score = positiveRatio
    } else if (negativeRatio > 0.3) {
      sentiment = 'negative'
      score = negativeRatio
    } else {
      sentiment = 'mixed'
      score = 0.5
    }

    const keyTopics = this.extractKeyTopics(reviews)
    const actionableInsights = this.generateActionableInsights(reviews, sentiment)

    return { sentiment, score, keyTopics, actionableInsights }
  }

  static async monitorReviews(
    platforms: Array<{
      platform: 'tripadvisor' | 'google_reviews' | 'yelp' | 'facebook' | 'trustpilot'
      credentials: ReviewCredentials
    }>,
    propertyId: string,
    settings: {
      autoResponseEnabled: boolean
      responseTemplates: {
        positive: string
        negative: string
        neutral: string
      }
      alertThreshold: number
      monitorKeywords: string[]
    }
  ): Promise<ReviewMonitoringResult> {
    const result: ReviewMonitoringResult = {
      success: true,
      reviewsFetched: 0,
      responsesPosted: 0,
      alertsTriggered: 0,
      errors: []
    }

    for (const platformConfig of platforms) {
      try {
        let fetchResult: { reviews: Review[]; success: boolean; errors?: string[] }

        switch (platformConfig.platform) {
          case 'tripadvisor':
            fetchResult = await this.fetchTripAdvisorReviews(platformConfig.credentials, propertyId)
            break
          case 'google_reviews':
            fetchResult = await this.fetchGoogleReviews(platformConfig.credentials, propertyId)
            break
          case 'yelp':
            fetchResult = await this.fetchYelpReviews(platformConfig.credentials, propertyId)
            break
          case 'facebook':
            fetchResult = await this.fetchFacebookReviews(platformConfig.credentials, propertyId)
            break
          case 'trustpilot':
            fetchResult = await this.fetchTrustpilotReviews(platformConfig.credentials, propertyId)
            break
          default:
            continue
        }

        if (fetchResult.success) {
          result.reviewsFetched! += fetchResult.reviews.length

          for (const review of fetchResult.reviews) {
            if (review.rating <= settings.alertThreshold) {
              result.alertsTriggered!++
            }

            if (settings.autoResponseEnabled && !review.responseContent) {
              try {
                const responseContent = await this.generateAutoResponse(
                  review,
                  settings.responseTemplates,
                  'Your Property'
                )

                let responseResult: { success: boolean; error?: string }

                switch (platformConfig.platform) {
                  case 'tripadvisor':
                    responseResult = await this.postTripAdvisorResponse(
                      platformConfig.credentials,
                      review.id,
                      responseContent
                    )
                    break
                  case 'google_reviews':
                    responseResult = await this.postGoogleResponse(
                      platformConfig.credentials,
                      review.id,
                      responseContent
                    )
                    break
                  default:
                    responseResult = { success: false, error: 'Auto-response not supported for this platform' }
                }

                if (responseResult.success) {
                  result.responsesPosted!++
                } else {
                  result.errors?.push(`Auto-response failed: ${responseResult.error}`)
                }
              } catch (error) {
                result.errors?.push(`Auto-response generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
              }
            }
          }
        } else {
          result.errors?.push(...(fetchResult.errors || []))
        }
      } catch (error) {
        result.errors?.push(`Platform monitoring failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }

    return result
  }

  static async generateReviewSummary(
    platforms: Array<{
      platform: 'tripadvisor' | 'google_reviews' | 'yelp' | 'facebook' | 'trustpilot'
      credentials: ReviewCredentials
    }>,
    propertyId: string
  ): Promise<ReviewSummary[]> {
    const summaries: ReviewSummary[] = []

    for (const platformConfig of platforms) {
      try {
        let fetchResult: { reviews: Review[]; success: boolean; errors?: string[] }

        switch (platformConfig.platform) {
          case 'tripadvisor':
            fetchResult = await this.fetchTripAdvisorReviews(platformConfig.credentials, propertyId)
            break
          case 'google_reviews':
            fetchResult = await this.fetchGoogleReviews(platformConfig.credentials, propertyId)
            break
          case 'yelp':
            fetchResult = await this.fetchYelpReviews(platformConfig.credentials, propertyId)
            break
          case 'facebook':
            fetchResult = await this.fetchFacebookReviews(platformConfig.credentials, propertyId)
            break
          case 'trustpilot':
            fetchResult = await this.fetchTrustpilotReviews(platformConfig.credentials, propertyId)
            break
          default:
            continue
        }

        if (fetchResult.success && fetchResult.reviews.length > 0) {
          const reviews = fetchResult.reviews
          const totalReviews = reviews.length
          const averageRating = reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews

          const ratingDistribution: { [rating: number]: number } = {}
          for (let i = 1; i <= 5; i++) {
            ratingDistribution[i] = reviews.filter(r => r.rating === i).length
          }

          const reviewsWithResponses = reviews.filter(r => r.responseContent).length
          const responseRate = (reviewsWithResponses / totalReviews) * 100

          summaries.push({
            platform: this.getPlatformDisplayName(platformConfig.platform),
            totalReviews,
            averageRating: Math.round(averageRating * 10) / 10,
            ratingDistribution,
            latestReviews: reviews.sort((a, b) => b.reviewDate.getTime() - a.reviewDate.getTime()).slice(0, 5),
            responseRate: Math.round(responseRate)
          })
        }
      } catch (error) {
        console.error(`Failed to generate summary for ${platformConfig.platform}:`, error)
      }
    }

    return summaries
  }

  private static extractKeyTopics(reviews: Review[]): string[] {
    const commonWords = ['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'a', 'an', 'is', 'was', 'were', 'are', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'shall', 'can', 'very', 'really', 'quite', 'just', 'also', 'too', 'so', 'much', 'many', 'more', 'most', 'good', 'great', 'nice', 'bad', 'poor', 'excellent', 'amazing', 'terrible', 'awful']

    const allText = reviews.map(r => r.content.toLowerCase()).join(' ')
    const words = allText.match(/\b\w+\b/g) || []
    const wordCount: { [word: string]: number } = {}

    words.forEach(word => {
      if (word.length > 3 && !commonWords.includes(word)) {
        wordCount[word] = (wordCount[word] || 0) + 1
      }
    })

    return Object.entries(wordCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([word]) => word)
  }

  private static generateActionableInsights(reviews: Review[], sentiment: string): string[] {
    const insights: string[] = []

    if (sentiment === 'negative') {
      insights.push('Focus on addressing common complaints mentioned in recent reviews')
      insights.push('Implement staff training to improve service quality')
      insights.push('Consider property improvements based on guest feedback')
    } else if (sentiment === 'positive') {
      insights.push('Leverage positive reviews in marketing materials')
      insights.push('Maintain current service standards that guests appreciate')
      insights.push('Encourage satisfied guests to leave reviews on other platforms')
    } else {
      insights.push('Analyze mixed feedback to identify specific improvement areas')
      insights.push('Implement targeted improvements for commonly mentioned issues')
      insights.push('Enhance guest communication to manage expectations')
    }

    return insights
  }

  private static getPlatformDisplayName(platform: string): string {
    const names: { [key: string]: string } = {
      'tripadvisor': 'TripAdvisor',
      'google_reviews': 'Google Reviews',
      'yelp': 'Yelp',
      'facebook': 'Facebook',
      'trustpilot': 'Trustpilot'
    }
    return names[platform] || platform
  }

  static async fetchBookingComReviews(
    credentials: ReviewCredentials,
    propertyId: string
  ): Promise<{ reviews: Review[]; success: boolean; errors?: string[] }> {
    try {
      const response = await axios.get(
        `https://supply-xml.booking.com/reviews/${credentials.hotelId}`,
        {
          headers: {
            'Authorization': `Basic ${Buffer.from(`${credentials.apiKey}:${credentials.domain}`).toString('base64')}`,
            'Content-Type': 'application/json'
          },
          params: {
            offset: 0,
            rows: 100,
            customer_type: 'guest'
          },
          timeout: 30000
        }
      )

      const reviews: Review[] = response.data.reviews?.map((review: any) => ({
        id: review.review_id,
        platform: 'booking_com' as any,
        authorName: review.reviewer_name || 'Guest',
        rating: parseFloat(review.review_score),
        maxRating: 10,
        content: review.positive_review || review.negative_review || 'No content',
        reviewDate: new Date(review.review_date),
        responseDate: review.hotel_response_date ? new Date(review.hotel_response_date) : undefined,
        responseContent: review.hotel_response,
        language: review.language,
        verified: true,
        propertyId
      })) || []

      return { reviews, success: true }
    } catch (error) {
      return {
        reviews: [],
        success: false,
        errors: [`Booking.com fetch failed: ${error instanceof Error ? error.message : 'Unknown error'}`]
      }
    }
  }

  static async fetchExpediaReviews(
    credentials: ReviewCredentials,
    propertyId: string
  ): Promise<{ reviews: Review[]; success: boolean; errors?: string[] }> {
    try {
      const response = await axios.get(
        `https://services.expediapartnercentral.com/reviews/v1/hotels/${credentials.hotelId}/reviews`,
        {
          headers: {
            'Authorization': `Bearer ${credentials.accessToken}`,
            'Content-Type': 'application/json'
          },
          params: {
            size: 100,
            from: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
          },
          timeout: 30000
        }
      )

      const reviews: Review[] = response.data.reviews?.map((review: any) => ({
        id: review.reviewId,
        platform: 'expedia' as any,
        authorName: review.reviewerName || 'Guest',
        rating: review.overallSatisfaction,
        maxRating: 5,
        title: review.reviewTitle,
        content: review.reviewBody,
        reviewDate: new Date(review.reviewSubmissionDate),
        language: review.reviewLanguage,
        verified: true,
        propertyId
      })) || []

      return { reviews, success: true }
    } catch (error) {
      return {
        reviews: [],
        success: false,
        errors: [`Expedia fetch failed: ${error instanceof Error ? error.message : 'Unknown error'}`]
      }
    }
  }

  static async generateCompetitiveAnalysis(
    reviews: Review[],
    competitorReviews?: Review[]
  ): Promise<{
    averageRating: number
    competitorAverage?: number
    strengthsVsCompetitors: string[]
    weaknessesVsCompetitors: string[]
    recommendations: string[]
    marketPosition: 'leading' | 'competitive' | 'lagging'
  }> {
    const totalReviews = reviews.length
    const averageRating = totalReviews > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews
      : 0

    let competitorAverage: number | undefined
    let marketPosition: 'leading' | 'competitive' | 'lagging' = 'competitive'

    if (competitorReviews && competitorReviews.length > 0) {
      competitorAverage = competitorReviews.reduce((sum, r) => sum + r.rating, 0) / competitorReviews.length

      if (averageRating > competitorAverage + 0.3) {
        marketPosition = 'leading'
      } else if (averageRating < competitorAverage - 0.3) {
        marketPosition = 'lagging'
      }
    }

    const keyTopics = this.extractKeyTopics(reviews)
    const positiveReviews = reviews.filter(r => r.rating >= 4)
    const negativeReviews = reviews.filter(r => r.rating <= 2)

    const strengthsVsCompetitors = [
      'Consistently high ratings for cleanliness',
      'Outstanding customer service mentioned frequently',
      'Location advantages highlighted by guests',
      'Value for money appreciated by guests'
    ]

    const weaknessesVsCompetitors = [
      'Room amenities could be enhanced',
      'WiFi connectivity mentioned as concern',
      'Check-in process efficiency',
      'Parking availability and pricing'
    ]

    const recommendations = [
      'Focus on improving areas mentioned in negative reviews',
      'Leverage positive aspects in marketing campaigns',
      'Implement guest feedback system improvements',
      'Monitor competitor pricing and service offerings'
    ]

    return {
      averageRating: Math.round(averageRating * 10) / 10,
      competitorAverage: competitorAverage ? Math.round(competitorAverage * 10) / 10 : undefined,
      strengthsVsCompetitors,
      weaknessesVsCompetitors,
      recommendations,
      marketPosition
    }
  }

  static async generateReviewInsights(
    reviews: Review[],
    timeframeDays: number = 30
  ): Promise<{
    trendAnalysis: {
      ratingTrend: 'improving' | 'declining' | 'stable'
      volumeTrend: 'increasing' | 'decreasing' | 'stable'
      recentAverage: number
      previousAverage: number
    }
    themesAndPatterns: {
      positiveThemes: Array<{ theme: string; frequency: number }>
      negativeThemes: Array<{ theme: string; frequency: number }>
      emergingIssues: string[]
    }
    actionableRecommendations: Array<{
      priority: 'high' | 'medium' | 'low'
      category: 'service' | 'facilities' | 'value' | 'location'
      recommendation: string
      impact: string
    }>
  }> {
    const cutoffDate = new Date(Date.now() - timeframeDays * 24 * 60 * 60 * 1000)
    const recentReviews = reviews.filter(r => r.reviewDate >= cutoffDate)
    const previousReviews = reviews.filter(r => r.reviewDate < cutoffDate)

    const recentAverage = recentReviews.length > 0
      ? recentReviews.reduce((sum, r) => sum + r.rating, 0) / recentReviews.length
      : 0
    const previousAverage = previousReviews.length > 0
      ? previousReviews.reduce((sum, r) => sum + r.rating, 0) / previousReviews.length
      : 0

    let ratingTrend: 'improving' | 'declining' | 'stable' = 'stable'
    if (recentAverage > previousAverage + 0.2) ratingTrend = 'improving'
    else if (recentAverage < previousAverage - 0.2) ratingTrend = 'declining'

    const volumeTrend: 'increasing' | 'decreasing' | 'stable' =
      recentReviews.length > previousReviews.length ? 'increasing' :
      recentReviews.length < previousReviews.length ? 'decreasing' : 'stable'

    // Theme analysis
    const positiveWords = ['excellent', 'amazing', 'perfect', 'wonderful', 'outstanding', 'clean', 'comfortable', 'friendly', 'helpful']
    const negativeWords = ['terrible', 'awful', 'poor', 'dirty', 'uncomfortable', 'rude', 'noisy', 'expensive']

    const positiveThemes = this.analyzeThemes(reviews.filter(r => r.rating >= 4), positiveWords)
    const negativeThemes = this.analyzeThemes(reviews.filter(r => r.rating <= 2), negativeWords)

    const emergingIssues = this.identifyEmergingIssues(recentReviews, previousReviews)

    const actionableRecommendations = [
      {
        priority: 'high' as const,
        category: 'service' as const,
        recommendation: 'Implement staff training program based on service-related feedback',
        impact: 'Improve overall guest satisfaction and ratings'
      },
      {
        priority: 'medium' as const,
        category: 'facilities' as const,
        recommendation: 'Upgrade room amenities based on guest suggestions',
        impact: 'Enhance competitive positioning and guest experience'
      },
      {
        priority: 'low' as const,
        category: 'value' as const,
        recommendation: 'Review pricing strategy based on value perception feedback',
        impact: 'Optimize revenue while maintaining guest satisfaction'
      }
    ]

    return {
      trendAnalysis: {
        ratingTrend,
        volumeTrend,
        recentAverage: Math.round(recentAverage * 10) / 10,
        previousAverage: Math.round(previousAverage * 10) / 10
      },
      themesAndPatterns: {
        positiveThemes,
        negativeThemes,
        emergingIssues
      },
      actionableRecommendations
    }
  }

  private static analyzeThemes(reviews: Review[], keywords: string[]): Array<{ theme: string; frequency: number }> {
    const themeCount: { [theme: string]: number } = {}

    reviews.forEach(review => {
      const content = review.content.toLowerCase()
      keywords.forEach(keyword => {
        if (content.includes(keyword)) {
          themeCount[keyword] = (themeCount[keyword] || 0) + 1
        }
      })
    })

    return Object.entries(themeCount)
      .map(([theme, frequency]) => ({ theme, frequency }))
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 5)
  }

  private static identifyEmergingIssues(recentReviews: Review[], previousReviews: Review[]): string[] {
    const issues = []

    const recentNegativeCount = recentReviews.filter(r => r.rating <= 2).length
    const previousNegativeCount = previousReviews.filter(r => r.rating <= 2).length

    if (recentNegativeCount > previousNegativeCount * 1.5) {
      issues.push('Increase in negative reviews requires immediate attention')
    }

    const commonComplaints = ['noise', 'cleanliness', 'staff', 'wifi', 'parking']
    commonComplaints.forEach(complaint => {
      const recentMentions = recentReviews.filter(r => r.content.toLowerCase().includes(complaint)).length
      const previousMentions = previousReviews.filter(r => r.content.toLowerCase().includes(complaint)).length

      if (recentMentions > previousMentions * 2) {
        issues.push(`Emerging concern about ${complaint}`)
      }
    })

    return issues
  }

  static async generateReputationReport(
    platforms: Array<{
      platform: 'tripadvisor' | 'google_reviews' | 'yelp' | 'facebook' | 'trustpilot' | 'booking_com' | 'expedia'
      credentials: ReviewCredentials
    }>,
    propertyId: string
  ): Promise<{
    overallScore: number
    platformBreakdown: Array<{
      platform: string
      score: number
      totalReviews: number
      trend: 'up' | 'down' | 'stable'
    }>
    strengths: string[]
    areas_for_improvement: string[]
    competitive_position: string
    recommendations: string[]
  }> {
    const platformData = []
    let totalScore = 0
    let totalReviewCount = 0

    for (const platformConfig of platforms) {
      try {
        let fetchResult: { reviews: Review[]; success: boolean; errors?: string[] }

        switch (platformConfig.platform) {
          case 'tripadvisor':
            fetchResult = await this.fetchTripAdvisorReviews(platformConfig.credentials, propertyId)
            break
          case 'google_reviews':
            fetchResult = await this.fetchGoogleReviews(platformConfig.credentials, propertyId)
            break
          case 'yelp':
            fetchResult = await this.fetchYelpReviews(platformConfig.credentials, propertyId)
            break
          case 'facebook':
            fetchResult = await this.fetchFacebookReviews(platformConfig.credentials, propertyId)
            break
          case 'trustpilot':
            fetchResult = await this.fetchTrustpilotReviews(platformConfig.credentials, propertyId)
            break
          case 'booking_com':
            fetchResult = await this.fetchBookingComReviews(platformConfig.credentials, propertyId)
            break
          case 'expedia':
            fetchResult = await this.fetchExpediaReviews(platformConfig.credentials, propertyId)
            break
          default:
            continue
        }

        if (fetchResult.success && fetchResult.reviews.length > 0) {
          const reviews = fetchResult.reviews
          const averageRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
          const normalizedScore = (averageRating / reviews[0].maxRating) * 100

          platformData.push({
            platform: this.getPlatformDisplayName(platformConfig.platform),
            score: Math.round(normalizedScore),
            totalReviews: reviews.length,
            trend: 'stable' as const // Would need historical data for accurate trend
          })

          totalScore += normalizedScore * reviews.length
          totalReviewCount += reviews.length
        }
      } catch (error) {
        console.error(`Failed to fetch data for ${platformConfig.platform}:`, error)
      }
    }

    const overallScore = totalReviewCount > 0 ? Math.round(totalScore / totalReviewCount) : 0

    return {
      overallScore,
      platformBreakdown: platformData,
      strengths: [
        'Consistent high ratings across multiple platforms',
        'Strong customer service feedback',
        'Positive location and facility reviews'
      ],
      areas_for_improvement: [
        'Response rate to reviews could be improved',
        'Address recurring complaints about amenities',
        'Enhance digital presence and engagement'
      ],
      competitive_position: overallScore >= 80 ? 'Leading' : overallScore >= 65 ? 'Competitive' : 'Needs Improvement',
      recommendations: [
        'Implement automated review monitoring',
        'Develop response templates for common review types',
        'Create guest feedback loop for continuous improvement',
        'Focus marketing on platforms with highest engagement'
      ]
    }
  }

  static async validateCredentials(
    platform: 'tripadvisor' | 'google_reviews' | 'yelp' | 'facebook' | 'trustpilot' | 'booking_com' | 'expedia',
    credentials: ReviewCredentials
  ): Promise<{ valid: boolean; error?: string }> {
    try {
      switch (platform) {
        case 'tripadvisor':
          await axios.get(
            `https://api.tripadvisor.com/api/partner/2.0/location/${credentials.locationId}?key=${credentials.apiKey}`,
            { timeout: 10000 }
          )
          return { valid: true }

        case 'google_reviews':
          const response = await axios.get(
            `https://maps.googleapis.com/maps/api/place/details/json?place_id=${credentials.placeId}&fields=name&key=${credentials.apiKey}`,
            { timeout: 10000 }
          )
          return { valid: response.data.status === 'OK' }

        case 'yelp':
          await axios.get(
            `https://api.yelp.com/v3/businesses/${credentials.businessId}`,
            {
              headers: { 'Authorization': `Bearer ${credentials.apiKey}` },
              timeout: 10000
            }
          )
          return { valid: true }

        case 'facebook':
          await axios.get(
            `https://graph.facebook.com/v18.0/${credentials.businessId}?access_token=${credentials.accessToken}`,
            { timeout: 10000 }
          )
          return { valid: true }

        case 'trustpilot':
          await axios.get(
            `https://api.trustpilot.com/v1/business-units/${credentials.businessId}?apikey=${credentials.apiKey}`,
            { timeout: 10000 }
          )
          return { valid: true }

        case 'booking_com':
          await axios.get(
            `https://supply-xml.booking.com/hotels/${credentials.hotelId}`,
            {
              headers: {
                'Authorization': `Basic ${Buffer.from(`${credentials.apiKey}:${credentials.domain}`).toString('base64')}`
              },
              timeout: 10000
            }
          )
          return { valid: true }

        case 'expedia':
          await axios.get(
            `https://services.expediapartnercentral.com/reviews/v1/hotels/${credentials.hotelId}`,
            {
              headers: { 'Authorization': `Bearer ${credentials.accessToken}` },
              timeout: 10000
            }
          )
          return { valid: true }

        default:
          return { valid: false, error: 'Unsupported platform' }
      }
    } catch (error) {
      return {
        valid: false,
        error: error instanceof Error ? error.message : 'Validation failed'
      }
    }
  }
}