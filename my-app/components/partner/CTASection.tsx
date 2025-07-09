'use client';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Award, TrendingUp, Users } from 'lucide-react';

const CTASection = () => {
  const scrollToForm = () => {
    const formSection = document.getElementById('apply');
    formSection?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-darkGreen via-teal-800 to-gray-900">
        <div className="absolute inset-0 bg-black/50"></div>
      </div>
      
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-20 -left-20 w-96 h-96 bg-white/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-20 -right-20 w-96 h-96 bg-teal-300/10 rounded-full blur-3xl animate-pulse delay-700"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
        <div className="space-y-8">
          {/* Main Heading */}
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight">
            Ready to Turn Your Passion <br /> into{' '}
            <span className="text-teal-300">
              Profit?
            </span>
          </h2>

          {/* Subheading */}
          <p className="text-xl text-gray-200 max-w-3xl mx-auto leading-relaxed">
            Join a community of top travel creators and start earning with India's most trusted
            homestay brand. Our application process is quick, transparent, and designed for you.
          </p>

          {/* Key Points */}
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-12 text-gray-200 pt-4">
            <div className="flex items-center gap-3">
              <Award className="w-6 h-6 text-teal-300" />
              <span className="font-medium">Competitive Commissions</span>
            </div>
            <div className="flex items-center gap-3">
              <TrendingUp className="w-6 h-6 text-teal-300" />
              <span className="font-medium">Real-Time Tracking</span>
            </div>
            <div className="flex items-center gap-3">
              <Users className="w-6 h-6 text-teal-300" />
              <span className="font-medium">Dedicated Support</span>
            </div>
          </div>

          {/* CTA Button */}
          <div className="pt-8">
            <Button
              onClick={scrollToForm}
              size="lg"
              className="bg-white text-darkGreen font-semibold px-10 py-4 rounded-full text-lg shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300"
            >
              Apply to the Program
            </Button>
            
            <p className="text-sm text-gray-400 mt-4">
              Takes less than 5 minutes. Approval within 24-48 hours.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CTASection; 