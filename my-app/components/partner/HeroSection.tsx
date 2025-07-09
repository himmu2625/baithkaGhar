'use client';

import { Button } from '@/components/ui/button';
import { ArrowDown, Users, TrendingUp, Award } from 'lucide-react';

const HeroSection = () => {
  const scrollToForm = () => {
    const formSection = document.getElementById('apply');
    formSection?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-darkGreen via-teal-800 to-gray-900">
        <div className="absolute inset-0 bg-black/30"></div>
      </div>
      
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-white/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-teal-300/10 rounded-full blur-3xl animate-pulse delay-700"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-darkGreen/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="space-y-8">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-black/20 backdrop-blur-sm rounded-full px-4 py-2 text-white text-sm font-medium">
            <Award className="w-4 h-4" />
            India's Premier Travel Influencer Program
          </div>

          {/* Main Heading */}
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white leading-tight">
            Partner with{' '}
            <span className="text-teal-300">
              Baithaka Ghar
            </span>
            <br />
            as a Travel Influencer
          </h1>

          {/* Subheading */}
          <p className="text-xl md:text-2xl text-gray-200 max-w-3xl mx-auto leading-relaxed">
            Earn money, grow your reach, and help others discover unique stays. 
            Join hundreds of creators already earning with transparent commissions.
          </p>

          {/* Stats */}
          <div className="flex flex-wrap justify-center gap-8 md:gap-12 mt-12">
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-white">₹50L+</div>
              <div className="text-gray-300 text-sm">Paid to Partners</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-white">500+</div>
              <div className="text-gray-300 text-sm">Active Influencers</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-white">25%</div>
              <div className="text-gray-300 text-sm">Average Commission</div>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-12">
            <Button
              onClick={scrollToForm}
              size="lg"
              className="bg-darkGreen hover:bg-darkGreen/90 text-white font-semibold px-8 py-4 rounded-full text-lg shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300"
            >
              Apply Now
              <ArrowDown className="ml-2 w-5 h-5" />
            </Button>
            
            <Button
              variant="outline"
              size="lg"
              className="border-2 border-white/30 text-white hover:bg-white/20 backdrop-blur-sm px-8 py-4 rounded-full text-lg"
              onClick={() => document.getElementById('benefits')?.scrollIntoView({ behavior: 'smooth' })}
            >
              Learn More
            </Button>
          </div>

          {/* Scroll indicator */}
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
            <ArrowDown className="w-6 h-6 text-white/70" />
          </div>
        </div>
      </div>

      {/* Floating elements */}
      <div className="absolute top-20 left-10 hidden lg:block">
        <div className="bg-black/20 backdrop-blur-sm rounded-xl p-4 text-white">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            <span className="text-sm">Join 500+ creators</span>
          </div>
        </div>
      </div>

      <div className="absolute top-32 right-10 hidden lg:block">
        <div className="bg-black/20 backdrop-blur-sm rounded-xl p-4 text-white">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            <span className="text-sm">Up to 50% commission</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroSection; 