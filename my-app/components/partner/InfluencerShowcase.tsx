'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Star, Instagram, Youtube, Users, TrendingUp } from 'lucide-react';

// Mock data, to be replaced with API call
interface Influencer {
  id: string;
  name: string;
  socialHandle: string;
  platform: 'instagram' | 'youtube';
  niche: string;
  profileImage: string;
  bio: string;
  testimonial: string;
  featured: boolean;
  stats: {
    totalEarnings: string;
    referrals: number;
  };
}

const mockInfluencers: Influencer[] = [
    { id: "1", name: "Aisha Verma", socialHandle: "aisha.travels", platform: "instagram", niche: "Luxury Travel", profileImage: "https://placehold.co/150x150/a7f3d0/4d7c0f?text=AV", bio: "Exploring the world, one luxury stay at a time. Lover of aesthetics, culture, and unique experiences.", testimonial: "Partnering with Baithaka Ghar has been a game-changer! The properties are stunning, and the commission structure is the most transparent I've seen.", featured: true, stats: { totalEarnings: "₹1.5L", referrals: 25 } },
    { id: "2", name: "Rohan Kumar", socialHandle: "rohanexplores", platform: "youtube", niche: "Adventure & Vlogging", profileImage: "https://placehold.co/150x150/a7f3d0/4d7c0f?text=RK", bio: "Seeking adrenaline and authenticity. My vlogs capture the raw beauty of travel off the beaten path.", testimonial: "The team at Baithaka Ghar genuinely supports creators. The free stays for content creation helped me produce my best work.", featured: false, stats: { totalEarnings: "₹95K", referrals: 18 } },
    { id: "3", name: "Priya Singh", socialHandle: "priyascooking", platform: "instagram", niche: "Food & Travel", profileImage: "https://placehold.co/150x150/a7f3d0/4d7c0f?text=PS", bio: "Discovering cultures through their cuisine. I blend my love for food with my passion for travel.", testimonial: "I love that I can offer my audience unique homestays that align with my brand. The earnings are a great bonus!", featured: false, stats: { totalEarnings: "₹70K", referrals: 15 } },
    { id: "4", name: "Sameer Joshi", socialHandle: "sameer.on.the.go", platform: "youtube", niche: "Budget Travel", profileImage: "https://placehold.co/150x150/a7f3d0/4d7c0f?text=SJ", bio: "Making travel accessible for everyone. I share tips and tricks for exploring India on a budget.", testimonial: "Baithaka Ghar's affiliate program is straightforward and rewarding. My audience trusts the recommendations, and I've built a steady income stream.", featured: true, stats: { totalEarnings: "₹1.2L", referrals: 32 } }
];

const getPlatformIcon = (platform: 'instagram' | 'youtube') => {
  if (platform === 'instagram') return <Instagram className="w-4 h-4 text-gray-500" />;
  if (platform === 'youtube') return <Youtube className="w-4 h-4 text-gray-500" />;
  return null;
};

const InfluencerShowcase = () => {
  const [influencers, setInfluencers] = useState<Influencer[]>([]);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    // In a real app, you'd fetch this from an API
    setInfluencers(mockInfluencers);
  }, []);

  const displayedInfluencers = showAll ? influencers : influencers.slice(0, 8);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-12">
        <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-6">
          Meet Our{' '}
          <span className="text-darkGreen">
            Success Stories
          </span>
        </h2>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Join hundreds of creators who are already earning through our platform. 
          See what our partners have to say about their experience with Baithaka Ghar.
        </p>
      </div>

      {influencers.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {displayedInfluencers.map((influencer) => (
              <Dialog key={influencer.id}>
                <DialogTrigger asChild>
                  <Card className="group cursor-pointer hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border-0 bg-white/80 backdrop-blur-sm overflow-hidden">
                    <div className="p-6">
                      <div className="flex flex-col items-center space-y-4">
                        {/* Profile Image */}
                        <div className="relative">
                          <div className="w-20 h-20 rounded-full overflow-hidden ring-4 ring-teal-100 group-hover:ring-teal-200 transition-all">
                            <Image
                              src={influencer.profileImage || 'https://placehold.co/150x150/e0e0e0/757575?text=B'}
                              alt={influencer.name}
                              width={80}
                              height={80}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          {influencer.featured && (
                            <div className="absolute -top-1 -right-1 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center">
                              <Star className="w-3 h-3 text-yellow-800" />
                            </div>
                          )}
                        </div>

                        {/* Name & Handle */}
                        <div className="text-center">
                          <h3 className="font-semibold text-gray-900 group-hover:text-darkGreen transition-colors">
                            {influencer.name}
                          </h3>
                          <div className="flex items-center justify-center gap-1 text-sm text-gray-500 mt-1">
                            {getPlatformIcon(influencer.platform)}
                            <span>@{influencer.socialHandle}</span>
                          </div>
                        </div>

                        {/* Niche */}
                        {influencer.niche && (
                          <Badge variant="secondary" className="text-xs">
                            {influencer.niche}
                          </Badge>
                        )}

                        {/* Stats */}
                        <div className="flex justify-between w-full text-center">
                          <div>
                            <div className="text-sm font-semibold text-gray-900">
                              {influencer.stats.totalEarnings}
                            </div>
                            <div className="text-xs text-gray-500">Earned</div>
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-gray-900">
                              {influencer.stats.referrals}
                            </div>
                            <div className="text-xs text-gray-500">Bookings</div>
                          </div>
                        </div>

                        {/* Hover indicator */}
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                          <p className="text-xs text-darkGreen">Click to read testimonial</p>
                        </div>
                      </div>
                    </div>
                  </Card>
                </DialogTrigger>

                <DialogContent className="max-w-md">
                  <div className="space-y-6 p-6">
                    {/* Profile Header */}
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-full overflow-hidden">
                        <Image
                          src={influencer.profileImage || 'https://placehold.co/150x150/e0e0e0/757575?text=B'}
                          alt={influencer.name}
                          width={64}
                          height={64}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                          {influencer.name}
                          {influencer.featured && (
                            <Badge className="bg-yellow-100 text-yellow-800">Featured</Badge>
                          )}
                        </h3>
                        <div className="flex items-center gap-1 text-sm text-gray-500">
                          {getPlatformIcon(influencer.platform)}
                          <span>@{influencer.socialHandle}</span>
                        </div>
                      </div>
                    </div>

                    {/* Bio */}
                    {influencer.bio && (
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">About</h4>
                        <p className="text-sm text-gray-600 leading-relaxed">
                          {influencer.bio}
                        </p>
                      </div>
                    )}

                    {/* Testimonial */}
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Testimonial</h4>
                      <blockquote className="text-sm text-gray-600 italic border-l-4 border-teal-200 pl-4">
                        "{influencer.testimonial}"
                      </blockquote>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                      <div className="text-center">
                        <div className="text-lg font-semibold text-gray-900">
                          {influencer.stats.totalEarnings}
                        </div>
                        <div className="text-sm text-gray-500">Total Earned</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-semibold text-gray-900">
                          {influencer.stats.referrals}
                        </div>
                        <div className="text-sm text-gray-500">Successful Bookings</div>
                      </div>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            ))}
          </div>

          {/* Show More Button */}
          {influencers.length > 8 && (
            <div className="text-center">
              <Button
                onClick={() => setShowAll(!showAll)}
                variant="outline"
                className="border-2 border-darkGreen text-darkGreen hover:bg-darkGreen hover:text-white"
              >
                {showAll ? 'Show Less' : `View All ${influencers.length} Partners`}
              </Button>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Be Our First Partner!
          </h3>
          <p className="text-gray-600 max-w-md mx-auto">
            We're building our influencer network and looking for passionate travel creators 
            to join us. Be among the first to partner with Baithaka Ghar!
          </p>
        </div>
      )}

      {/* CTA Section */}
      <div className="mt-16 text-center">
        <Card className="p-8 bg-gradient-to-r from-gray-50 to-teal-50 border-0">
          <div className="space-y-4">
            <TrendingUp className="w-12 h-12 text-darkGreen mx-auto" />
            <h3 className="text-2xl font-bold text-gray-900">
              Ready to Join Our Success Stories?
            </h3>
            <p className="text-gray-600 max-w-2xl mx-auto">
              These creators started their journey just like you. Take the first step 
              towards building a sustainable income through travel content creation.
            </p>
            <Button
              onClick={() => document.getElementById('apply')?.scrollIntoView({ behavior: 'smooth' })}
              className="bg-darkGreen hover:bg-darkGreen/90 text-white px-8 py-3"
            >
              Start Your Journey
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default InfluencerShowcase; 