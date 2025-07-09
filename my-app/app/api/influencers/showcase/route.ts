import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db/dbConnect';
import Influencer from '@/models/Influencer';

export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '12');
    const featured = searchParams.get('featured') === 'true';

    let query: any = {
      status: 'active',
      profileImage: { $exists: true, $ne: '' } // Only show influencers with profile images
    };

    // If featured is requested, prioritize featured influencers
    if (featured) {
      query.featured = true;
    }

    const influencers = await Influencer.find(query)
      .select({
        name: 1,
        profileImage: 1,
        socialLinks: 1,
        bio: 1,
        niche: 1,
        featured: 1,
        totalCommissionEarned: 1,
        successfulReferrals: 1,
        instagramHandle: 1,
        youtubeChannel: 1,
        // Don't expose sensitive data like commission rates, bank details, etc.
      })
      .sort({ featured: -1, totalCommissionEarned: -1, successfulReferrals: -1 })
      .limit(limit);

    // Transform data for public consumption
    const showcaseInfluencers = influencers.map(influencer => ({
      id: influencer._id,
      name: influencer.name,
      profileImage: influencer.profileImage,
      bio: influencer.bio?.substring(0, 150) + (influencer.bio?.length > 150 ? '...' : ''), // Truncate bio
      niche: influencer.niche,
      featured: influencer.featured,
      socialHandle: influencer.instagramHandle || influencer.youtubeChannel || 'Unknown',
      platform: influencer.instagramHandle ? 'Instagram' : 
                influencer.youtubeChannel ? 'YouTube' : 
                'Social Media',
      stats: {
        totalEarnings: influencer.totalCommissionEarned > 0 ? '₹' + (influencer.totalCommissionEarned / 1000).toFixed(0) + 'K+' : 'New Partner',
        referrals: influencer.successfulReferrals || 0
      },
      testimonial: generateTestimonial(influencer.niche, influencer.name)
    }));

    return NextResponse.json({
      success: true,
      data: showcaseInfluencers,
      count: showcaseInfluencers.length
    });

  } catch (error) {
    console.error('Error fetching influencer showcase:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch influencer showcase'
    }, { status: 500 });
  }
}

// Helper function to generate sample testimonials based on niche
function generateTestimonial(niche?: string, name?: string): string {
  const testimonials = {
    travel: [
      "Partnering with Baithaka Ghar has opened up incredible travel opportunities and steady income!",
      "The commission structure is transparent and the properties are truly unique. Highly recommend!",
      "My followers love the authentic stays I recommend through Baithaka Ghar."
    ],
    lifestyle: [
      "Baithaka Ghar's properties perfectly match my aesthetic and my audience loves them!",
      "The partnership has been seamless and the support team is incredibly helpful.",
      "Working with Baithaka Ghar has elevated my content and income significantly."
    ],
    food: [
      "The unique stays offer amazing local food experiences that my audience craves!",
      "Baithaka Ghar properties provide the perfect backdrop for my culinary content.",
      "The partnership combines my love for food and travel beautifully."
    ],
    default: [
      "Baithaka Ghar has been an amazing partner for authentic travel experiences!",
      "The commission structure is fair and the properties are genuinely special.",
      "My audience trusts my recommendations because these stays are truly unique."
    ]
  };

  const nicheKey = niche?.toLowerCase().includes('travel') ? 'travel' :
                   niche?.toLowerCase().includes('lifestyle') ? 'lifestyle' :
                   niche?.toLowerCase().includes('food') ? 'food' : 'default';

  const nicheTestimonials = testimonials[nicheKey];
  return nicheTestimonials[Math.floor(Math.random() * nicheTestimonials.length)];
} 